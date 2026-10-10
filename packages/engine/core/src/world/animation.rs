//! Animations, stepped with the simulation so they're interpolated like everything else and cost no
//! JS per frame.
//!
//! An animation call creates one track per animated property (position, rotation, scale, color,
//! shake) per entity. Tracks are independent: an entity can move while it pulses. A new track on the
//! same entity and property replaces the old one; a replaced spring hands over its velocity, so
//! interrupted motion stays smooth. Each call has an id; when all of its tracks have ended (finished,
//! replaced, stopped, or their entity despawned) the id is reported in `World::done`, which JS uses
//! to resolve promises.
//!
//! - Tweens: duration + easing, through any number of keyframes (optionally a smooth curve),
//!   with delay, repeat and yoyo.
//! - Springs: physically simulated motion toward the target (no fixed duration).
//! - Relative: move by an offset, or turn by angles (more than a full turn spins).
//! - Shake: decaying jitter drawn on top of the position, which isn't changed.
//! - Stagger: one call animates many entities, each starting a little later.

use super::*;
use rapier3d::glamx::EulerRot;

/// Encoded header length, in f64 values: entity count, keyframe count, duration, delay, easing,
/// repeat (-1 = forever), yoyo, stagger, smooth path, spring stiffness (0 = tween), damping, mass.
pub const ANIM_HEADER: usize = 12;
/// Encoded keyframe length: flags (1 position, 2 rotation, 4 scale, 8 color, 16 move by, 32 turn,
/// 64 shake, 128 has time), time 0..1, position xyz, rotation xyzw, scale xyz, color rgba,
/// move by xyz, turn xyz (radians), shake amplitude.
pub const ANIM_KEY_LEN: usize = 23;
/// Room in `World::done` per entity of capacity (one id per animated property, at most).
pub const DONE_PER_ENTITY: usize = 5;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Easing {
    Linear,
    /// Starts slow.
    In,
    /// Ends slow (the default: feels responsive).
    #[default]
    Out,
    InOut,
    /// Overshoots a little, then settles.
    Back,
    /// Bounces at the end, like a dropped ball.
    Bounce,
    /// Springs past the target and wobbles in.
    Elastic,
}

impl Easing {
    fn from_index(i: f64) -> Option<Easing> {
        Some(match i as i64 {
            0 => Easing::Linear,
            1 => Easing::In,
            2 => Easing::Out,
            3 => Easing::InOut,
            4 => Easing::Back,
            5 => Easing::Bounce,
            6 => Easing::Elastic,
            _ => return None,
        })
    }

    /// Maps progress 0..1 to eased progress (0 at 0, 1 at 1; Back and Elastic overshoot).
    pub fn apply(self, t: f32) -> f32 {
        match self {
            Easing::Linear => t,
            Easing::In => t * t * t,
            Easing::Out => 1.0 - (1.0 - t).powi(3),
            Easing::InOut if t < 0.5 => 4.0 * t * t * t,
            Easing::InOut => 1.0 - (-2.0 * t + 2.0).powi(3) / 2.0,
            Easing::Back => {
                let (c1, u) = (1.70158, t - 1.0);
                1.0 + (c1 + 1.0) * u * u * u + c1 * u * u
            }
            Easing::Bounce => bounce(t),
            Easing::Elastic if t <= 0.0 || t >= 1.0 => t,
            Easing::Elastic => 2f32.powf(-10.0 * t) * ((t * 10.0 - 0.75) * std::f32::consts::TAU / 3.0).sin() + 1.0,
        }
    }
}

fn bounce(t: f32) -> f32 {
    let (n, d) = (7.5625, 2.75);
    if t < 1.0 / d {
        n * t * t
    } else if t < 2.0 / d {
        let t = t - 1.5 / d;
        n * t * t + 0.75
    } else if t < 2.5 / d {
        let t = t - 2.25 / d;
        n * t * t + 0.9375
    } else {
        let t = t - 2.625 / d;
        n * t * t + 0.984375
    }
}

/// One step of an animation: the values to reach, and optionally when (0..1 of the duration).
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Keyframe {
    pub at: Option<f32>,
    pub position: Option<Vec3>,
    pub rotation: Option<Quat>,
    pub scale: Option<Vec3>,
    pub color: Option<[f32; 4]>,
    /// Position offset from where the animation starts.
    pub move_by: Option<Vec3>,
    /// Angles (radians, x y z) to turn by from the starting rotation; 2π is a full spin.
    pub turn: Option<Vec3>,
    /// Shake amplitude (world units), fading to 0 by the end.
    pub shake: Option<f32>,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Spring {
    pub stiffness: f32,
    pub damping: f32,
    pub mass: f32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Animation {
    pub entities: Vec<Entity>,
    pub keys: Vec<Keyframe>,
    /// Seconds (tweens).
    pub duration: f32,
    /// Seconds before it starts.
    pub delay: f32,
    pub easing: Easing,
    /// Extra runs after the first; -1 repeats forever (tweens).
    pub repeat: i32,
    /// Every other run plays backwards.
    pub yoyo: bool,
    /// Extra delay per entity, in order (waves, board reveals).
    pub stagger: f32,
    /// Positions follow a smooth curve through the keyframes instead of straight lines.
    pub smooth: bool,
    /// Simulated spring motion toward the last keyframe instead of a timed tween.
    pub spring: Option<Spring>,
}

impl Animation {
    /// Decodes the flat C-ABI form. None if it's too short or malformed.
    pub fn decode(d: &[f64]) -> Option<Animation> {
        if d.len() < ANIM_HEADER {
            return None;
        }
        let (n, k) = (d[0], d[1]);
        if !(0.0..=1e6).contains(&n) || !(1.0..=64.0).contains(&k) {
            return None;
        }
        let (n, k) = (n as usize, k as usize);
        let len = ANIM_HEADER + n + k * ANIM_KEY_LEN;
        if d.len() < len || !d[..len].iter().all(|v| v.is_finite()) {
            return None;
        }
        let f = |i: usize| d[i] as f32;
        let entities = (0..n)
            .map(|i| d[ANIM_HEADER + i])
            .filter(|&v| (0.0..NO_ENTITY as f64).contains(&v))
            .map(|v| Entity(v as u32))
            .collect();
        let keys: Vec<Keyframe> = (0..k)
            .map(|j| {
                let o = ANIM_HEADER + n + j * ANIM_KEY_LEN;
                let flags = d[o] as u32;
                let has = |bit: u32| flags & bit != 0;
                let v3 = |i: usize| Vec3::new(f(o + i), f(o + i + 1), f(o + i + 2));
                Keyframe {
                    at: has(128).then(|| f(o + 1)),
                    position: has(1).then(|| v3(2)),
                    rotation: has(2).then(|| Quat::from_xyzw(f(o + 5), f(o + 6), f(o + 7), f(o + 8))),
                    scale: has(4).then(|| v3(9)),
                    color: has(8).then(|| [f(o + 12), f(o + 13), f(o + 14), f(o + 15)]),
                    move_by: has(16).then(|| v3(16)),
                    turn: has(32).then(|| v3(19)),
                    shake: has(64).then(|| f(o + 22)),
                }
            })
            .collect();
        if keys.iter().any(|k| k.rotation.is_some_and(|q| q.length_squared() < 1e-12)) {
            return None;
        }
        Some(Animation {
            entities,
            keys,
            duration: f(2),
            delay: f(3),
            easing: Easing::from_index(d[4])?,
            repeat: d[5].clamp(-1.0, 1e6) as i32,
            yoyo: d[6] != 0.0,
            stagger: f(7),
            smooth: d[8] != 0.0,
            spring: (d[9] > 0.0).then(|| Spring {
                stiffness: f(9),
                damping: f(10).max(0.0),
                mass: f(11).max(1e-3),
            }),
        })
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Channel {
    Position,
    Rotation,
    Scale,
    Color,
    Shake,
}

const CHANNELS: [Channel; 5] = [Channel::Position, Channel::Rotation, Channel::Scale, Channel::Color, Channel::Shake];

/// One animated property of one entity.
#[derive(Clone, Debug)]
pub(super) struct Track {
    id: u32,
    entity: Entity,
    channel: Channel,
    /// Keyframe times 0..1; the first is 0 (the starting value).
    times: Vec<f32>,
    /// Values per keyframe: xyz, quaternion xyzw, rgba, or [amplitude]. Turns store angles here.
    values: Vec<[f32; 4]>,
    /// For turns: the rotation the angles are applied on top of.
    turn_base: Option<Quat>,
    smooth: bool,
    spring: Option<SpringState>,
    easing: Easing,
    duration: f32,
    delay: f32,
    elapsed: f32,
    repeat: i32,
    yoyo: bool,
    forward: bool,
}

#[derive(Clone, Copy, Debug)]
struct SpringState {
    spring: Spring,
    current: [f32; 4],
    velocity: [f32; 4],
}

const fn v4(v: Vec3) -> [f32; 4] {
    [v.x, v.y, v.z, 0.0]
}

fn lerp4(a: [f32; 4], b: [f32; 4], t: f32) -> [f32; 4] {
    std::array::from_fn(|i| a[i] + (b[i] - a[i]) * t)
}

/// Catmull-Rom through p1..p2 (with neighbours p0 and p3): a smooth curve through every keyframe.
fn catmull_rom(p0: [f32; 4], p1: [f32; 4], p2: [f32; 4], p3: [f32; 4], t: f32) -> [f32; 4] {
    let (t2, t3) = (t * t, t * t * t);
    std::array::from_fn(|i| {
        0.5 * (2.0 * p1[i]
            + (p2[i] - p0[i]) * t
            + (2.0 * p0[i] - 5.0 * p1[i] + 4.0 * p2[i] - p3[i]) * t2
            + (3.0 * p1[i] - p0[i] - 3.0 * p2[i] + p3[i]) * t3)
    })
}

fn quat(v: [f32; 4]) -> Quat {
    Quat::from_xyzw(v[0], v[1], v[2], v[3])
}

impl Track {
    /// The value at overall progress `k` (eased, so it may leave 0..1 for Back / Elastic).
    fn sample(&self, k: f32) -> [f32; 4] {
        let n = self.values.len();
        // The segment containing k (the first / last one when overshooting).
        let s = (1..n).find(|&i| k <= self.times[i]).unwrap_or(n - 1) - 1;
        let span = (self.times[s + 1] - self.times[s]).max(1e-6);
        let t = (k - self.times[s]) / span;
        let (a, b) = (self.values[s], self.values[s + 1]);
        match self.channel {
            Channel::Rotation if self.turn_base.is_none() => {
                let (qa, mut qb) = (quat(a), quat(b));
                if qa.dot(qb) < 0.0 {
                    qb = -qb; // the short way round
                }
                let q = if (0.0..=1.0).contains(&t) {
                    qa.slerp(qb, t)
                } else {
                    qa.lerp(qb, t).normalize() // overshoot
                };
                q.to_array()
            }
            Channel::Position if self.smooth && n > 2 => {
                let p0 = self.values[s.saturating_sub(1)];
                let p3 = self.values[(s + 2).min(n - 1)];
                catmull_rom(p0, a, b, p3, t)
            }
            _ => lerp4(a, b, t),
        }
    }
}

impl World {
    /// The current value of a property, in track form.
    fn channel_value(&self, i: usize, channel: Channel) -> [f32; 4] {
        match channel {
            Channel::Position => v4(self.position[i]),
            Channel::Rotation => self.rotation[i].to_array(),
            Channel::Scale => v4(self.scale[i]),
            Channel::Color => self.color[i],
            Channel::Shake => [0.0; 4],
        }
    }

    /// Starts an animation on every live entity in `a`. Returns its id (reported in `done` when it
    /// ends), or None if nothing was animated.
    pub fn animate(&mut self, a: &Animation) -> Option<u32> {
        self.next_animation = self.next_animation.wrapping_add(1).max(1);
        let id = self.next_animation;
        let mut started = false;
        for (order, &e) in a.entities.iter().enumerate() {
            let Some(i) = self.dense(e) else { continue };
            for channel in CHANNELS {
                if let Some(track) = self.build_track(id, e, i, channel, a, order) {
                    self.add_track(track);
                    started = true;
                }
            }
        }
        started.then_some(id)
    }

    fn build_track(&self, id: u32, e: Entity, i: usize, channel: Channel, a: &Animation, order: usize) -> Option<Track> {
        let mut turn_base = None;
        // The keyframes that set this property, as (time, value).
        let keys: Vec<(Option<f32>, [f32; 4])> = a
            .keys
            .iter()
            .filter_map(|k| {
                let value = match channel {
                    Channel::Position => k.position.map(v4).or(k.move_by.map(|d| v4(self.position[i] + d)))?,
                    Channel::Rotation => match (k.rotation, k.turn) {
                        (Some(q), _) => q.normalize().to_array(),
                        (None, Some(angles)) => {
                            turn_base = Some(self.rotation[i]);
                            v4(angles)
                        }
                        (None, None) => return None,
                    },
                    Channel::Scale => v4(k.scale?),
                    Channel::Color => k.color?,
                    Channel::Shake => [k.shake?, 0.0, 0.0, 0.0],
                };
                Some((k.at, value))
            })
            .collect();
        if keys.is_empty() {
            return None;
        }
        // The current value sits at time 0; keyframes without a time are spread evenly after it.
        let mut times = vec![0.0f32];
        let mut values = vec![if turn_base.is_some() { [0.0; 4] } else { self.channel_value(i, channel) }];
        for (j, (at, value)) in keys.iter().enumerate() {
            let even = (j + 1) as f32 / keys.len() as f32;
            times.push(at.unwrap_or(even).clamp(0.0, 1.0).max(*times.last().unwrap()));
            values.push(*value);
        }
        if channel == Channel::Shake {
            times = vec![0.0, 1.0]; // from the amplitude down to nothing
            values = vec![values[1], [0.0; 4]];
        }
        let spring = a.spring.filter(|_| channel != Channel::Shake).map(|spring| SpringState {
            spring,
            current: values[0],
            velocity: [0.0; 4],
        });
        Some(Track {
            id,
            entity: e,
            channel,
            times,
            values,
            turn_base,
            smooth: a.smooth,
            spring,
            easing: a.easing,
            duration: a.duration.max(0.0),
            delay: (a.delay + a.stagger * order as f32).max(0.0),
            elapsed: 0.0,
            repeat: a.repeat,
            yoyo: a.yoyo,
            forward: true,
        })
    }

    /// Adds a track, replacing any on the same entity and property. A replaced spring hands over its
    /// velocity, so retargeting mid-motion stays smooth.
    fn add_track(&mut self, mut track: Track) {
        if let Some(k) = self.tracks.iter().position(|t| t.entity == track.entity && t.channel == track.channel) {
            let old = self.tracks.swap_remove(k);
            if let (Some(new), Some(prev)) = (track.spring.as_mut(), old.spring)
                && old.turn_base.is_none()
                && track.turn_base.is_none()
            {
                new.velocity = prev.velocity;
            }
            self.report_if_finished(old.id);
        }
        self.tracks.push(track);
    }

    /// Reports an animation id as done once none of its tracks remain.
    fn report_if_finished(&mut self, id: u32) {
        if !self.tracks.iter().any(|t| t.id == id) && self.done.len() < self.done.capacity() {
            self.done.push(id);
        }
    }

    /// Stops every animation on the entity where it is. Returns false if it had none.
    pub fn stop_animation(&mut self, e: Entity) -> bool {
        self.remove_tracks(e)
    }

    /// Drops an entity's tracks (stopped or despawned), reporting ids that ended. True if it had any.
    pub(super) fn remove_tracks(&mut self, e: Entity) -> bool {
        if self.tracks.is_empty() {
            return false; // the common case for despawns (particles, projectiles)
        }
        let mut ended = Vec::new();
        self.tracks.retain(|t| {
            if t.entity == e {
                ended.push(t.id);
            }
            t.entity != e
        });
        if let Some(i) = self.dense(e) {
            self.shake_offset[i] = Vec3::ZERO;
        }
        ended.dedup();
        for &id in &ended {
            self.report_if_finished(id);
        }
        !ended.is_empty()
    }

    /// Advances every track by `h` seconds and applies it. Only animating entities cost anything.
    pub(super) fn advance_tracks(&mut self, h: f32) {
        self.shake_offset.fill(Vec3::ZERO);
        let mut k = 0;
        while k < self.tracks.len() {
            let Some(i) = self.dense(self.tracks[k].entity) else {
                let id = self.tracks.swap_remove(k).id; // its entity is gone
                self.report_if_finished(id);
                continue;
            };
            let (value, finished) = step_track(&mut self.tracks[k], h);
            if let Some(value) = value {
                let t = &self.tracks[k];
                self.apply_channel(i, t.channel, value, t.turn_base, t.elapsed);
            }
            if finished {
                let id = self.tracks.swap_remove(k).id;
                self.report_if_finished(id);
            } else {
                k += 1;
            }
        }
    }

    fn apply_channel(&mut self, i: usize, channel: Channel, v: [f32; 4], turn_base: Option<Quat>, time: f32) {
        match channel {
            Channel::Position => {
                self.position[i] = Vec3::new(v[0], v[1], v[2]);
                self.move_body(i);
            }
            Channel::Rotation => {
                self.rotation[i] = match turn_base {
                    Some(base) => (base * Quat::from_euler(EulerRot::YXZ, v[1], v[0], v[2])).normalize(),
                    None => quat(v).normalize(),
                };
                self.move_body(i);
            }
            Channel::Scale => self.scale[i] = Vec3::new(v[0], v[1], v[2]),
            Channel::Color => self.color[i] = v,
            Channel::Shake => {
                // Smooth pseudo-random jitter: unrelated frequencies per axis, within the amplitude.
                let jitter = Vec3::new(
                    ((time * 71.0).sin() + (time * 37.0).sin() * 0.5) / 1.5,
                    (time * 83.0 + 1.3).sin(),
                    (time * 59.0 + 2.1).sin(),
                );
                self.shake_offset[i] += jitter * v[0];
            }
        }
    }

    /// Puts a dynamic or fixed body where an animation moved its entity (kinematic bodies follow
    /// the entity anyway).
    fn move_body(&mut self, i: usize) {
        if let Some((h, BodyKind::Dynamic | BodyKind::Fixed)) = self.body[i]
            && let Some(b) = self.physics.bodies.get_mut(h)
        {
            b.set_translation(self.position[i], true);
            b.set_rotation(self.rotation[i], true);
        }
    }
}

/// Advances a track; returns the value to apply (None while delayed) and whether it has finished.
fn step_track(t: &mut Track, h: f32) -> (Option<[f32; 4]>, bool) {
    t.elapsed += h;
    if t.elapsed < t.delay {
        return (None, false);
    }
    let target = t.values[t.values.len() - 1];
    if let Some(s) = t.spring.as_mut() {
        // Semi-implicit Euler: stable at 60 Hz for game-like stiffness.
        let Spring { stiffness, damping, mass } = s.spring;
        let mut settled = true;
        for ((x, v), goal) in s.current.iter_mut().zip(&mut s.velocity).zip(target) {
            let accel = (-stiffness * (*x - goal) - damping * *v) / mass;
            *v += accel * h;
            *x += *v * h;
            settled &= (*x - goal).abs() < 1e-3 && v.abs() < 1e-2;
        }
        return if settled { (Some(target), true) } else { (Some(s.current), false) };
    }
    let raw = if t.duration > 0.0 {
        ((t.elapsed - t.delay) / t.duration).min(1.0)
    } else {
        1.0
    };
    let progress = if t.forward { raw } else { 1.0 - raw };
    // Shake fades linearly; everything else follows the easing curve.
    let k = if t.channel == Channel::Shake {
        progress
    } else {
        t.easing.apply(progress)
    };
    let finished = raw >= 1.0 && t.repeat == 0;
    let value = if finished && t.forward && t.channel != Channel::Shake {
        target
    } else {
        t.sample(k)
    };
    if raw >= 1.0 && !finished {
        if t.repeat > 0 {
            t.repeat -= 1;
        }
        t.elapsed = t.delay;
        if t.yoyo {
            t.forward = !t.forward;
        }
    }
    (Some(value), finished)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run(w: &mut World, seconds: f32) {
        for _ in 0..(seconds / FIXED_DT).round() as usize {
            w.update(FIXED_DT);
        }
    }

    /// Steps until `id` is reported; returns the seconds it took (None after `limit`).
    fn run_until_done(w: &mut World, id: u32, limit: f32) -> Option<f32> {
        let mut t = 0.0;
        while t < limit {
            w.update(FIXED_DT);
            t += FIXED_DT;
            if w.done().contains(&id) {
                return Some(t);
            }
        }
        None
    }

    fn anim(entities: &[Entity], keys: Vec<Keyframe>, duration: f32) -> Animation {
        Animation {
            entities: entities.to_vec(),
            keys,
            duration,
            delay: 0.0,
            easing: Easing::Linear,
            repeat: 0,
            yoyo: false,
            stagger: 0.0,
            smooth: false,
            spring: None,
        }
    }

    fn to(position: Vec3) -> Keyframe {
        Keyframe {
            position: Some(position),
            ..Default::default()
        }
    }

    fn scale_to(s: f32) -> Keyframe {
        Keyframe {
            scale: Some(Vec3::splat(s)),
            ..Default::default()
        }
    }

    fn spawn(w: &mut World) -> Entity {
        w.spawn(0, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap()
    }

    #[test]
    fn easings_start_at_0_and_end_at_1() {
        for e in [
            Easing::Linear,
            Easing::In,
            Easing::Out,
            Easing::InOut,
            Easing::Back,
            Easing::Bounce,
            Easing::Elastic,
        ] {
            assert!(e.apply(0.0).abs() < 1e-4, "{e:?}");
            assert!((e.apply(1.0) - 1.0).abs() < 1e-4, "{e:?}");
        }
    }

    #[test]
    fn tween_moves_then_reports_its_id_once() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        let id = w.animate(&anim(&[e], vec![to(Vec3::new(10.0, 0.0, 0.0))], 0.5)).unwrap();
        run(&mut w, 0.25);
        assert!((w.position(e).unwrap().x - 5.0).abs() < 0.4, "halfway");
        assert!(run_until_done(&mut w, id, 1.0).unwrap() < 0.35);
        assert_eq!(w.position(e), Some(Vec3::new(10.0, 0.0, 0.0)));
        w.update(FIXED_DT);
        assert!(!w.done().contains(&id), "reported once");
    }

    #[test]
    fn properties_animate_independently_and_replacing_ends_the_old_one() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        let moving = w.animate(&anim(&[e], vec![to(Vec3::new(4.0, 0.0, 0.0))], 1.0)).unwrap();
        w.animate(&anim(&[e], vec![scale_to(2.0)], 0.2)).unwrap();
        run(&mut w, 0.5);
        assert!(w.position(e).unwrap().x > 1.5, "the move kept going while it pulsed");
        assert!((w.scale[0].x - 2.0).abs() < 1e-5);
        let replacing = w.animate(&anim(&[e], vec![to(Vec3::ZERO)], 0.1)).unwrap();
        assert!(w.done().contains(&moving), "the replaced move counts as done");
        assert!(run_until_done(&mut w, replacing, 1.0).is_some());
    }

    #[test]
    fn keyframes_pass_through_each_value_and_smooth_paths_curve() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        // A hop: up to (2, 3) at the middle, landing at (4, 0).
        let mut a = anim(&[e], vec![to(Vec3::new(2.0, 3.0, 0.0)), to(Vec3::new(4.0, 0.0, 0.0))], 1.0);
        a.smooth = true;
        let id = w.animate(&a).unwrap();
        run(&mut w, 0.5);
        let mid = w.position(e).unwrap();
        assert!((mid - Vec3::new(2.0, 3.0, 0.0)).length() < 0.2, "{mid:?}");
        run(&mut w, 0.25);
        assert!(w.position(e).unwrap().y > 1.6, "a curve, not straight lines (straight would be 1.5)");
        assert!(run_until_done(&mut w, id, 1.0).is_some());
        assert_eq!(w.position(e), Some(Vec3::new(4.0, 0.0, 0.0)));
    }

    #[test]
    fn keyframe_times_are_respected() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        let mut fast = to(Vec3::new(1.0, 0.0, 0.0));
        fast.at = Some(0.2);
        w.animate(&anim(&[e], vec![fast, to(Vec3::new(2.0, 0.0, 0.0))], 1.0)).unwrap();
        run(&mut w, 0.2);
        assert!((w.position(e).unwrap().x - 1.0).abs() < 0.1, "first keyframe at 20%");
    }

    #[test]
    fn turns_spin_past_a_full_circle_and_moves_are_relative() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        w.set_position(e, Vec3::new(1.0, 0.0, 0.0));
        let key = Keyframe {
            turn: Some(Vec3::new(0.0, std::f32::consts::TAU, 0.0)),
            move_by: Some(Vec3::new(0.0, 2.0, 0.0)),
            ..Default::default()
        };
        let id = w.animate(&anim(&[e], vec![key], 1.0)).unwrap();
        run(&mut w, 0.5);
        let half = w.rotation[0];
        assert!(
            half.dot(Quat::from_rotation_y(std::f32::consts::PI)).abs() > 0.99,
            "half a spin: {half:?}"
        );
        assert!(run_until_done(&mut w, id, 1.0).is_some());
        assert!(w.rotation[0].dot(Quat::IDENTITY).abs() > 0.999, "a full turn ends facing the same way");
        assert_eq!(w.position(e), Some(Vec3::new(1.0, 2.0, 0.0)));
    }

    #[test]
    fn springs_overshoot_settle_and_keep_velocity_when_retargeted() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        let mut a = anim(&[e], vec![to(Vec3::new(1.0, 0.0, 0.0))], 0.0);
        a.spring = Some(Spring {
            stiffness: 200.0,
            damping: 10.0,
            mass: 1.0,
        });
        let first = w.animate(&a).unwrap();
        let mut peak: f32 = 0.0;
        for _ in 0..20 {
            w.update(FIXED_DT);
            peak = peak.max(w.position(e).unwrap().x);
        }
        assert!(peak > 1.05, "a bouncy spring overshoots: {peak}");
        a.keys = vec![to(Vec3::new(-1.0, 0.0, 0.0))];
        let second = w.animate(&a).unwrap();
        assert!(w.done().contains(&first));
        assert!(w.tracks[0].spring.unwrap().velocity[0] != 0.0, "velocity handed over");
        assert!(run_until_done(&mut w, second, 5.0).is_some(), "settles");
        assert!((w.position(e).unwrap().x + 1.0).abs() < 1e-3);
    }

    #[test]
    fn stagger_delays_each_entity_and_one_id_covers_all() {
        let mut w = World::new(4);
        let es: Vec<Entity> = (0..3).map(|_| spawn(&mut w)).collect();
        let mut a = anim(&es, vec![to(Vec3::new(0.0, 1.0, 0.0))], 0.2);
        a.stagger = 0.2;
        let id = w.animate(&a).unwrap();
        run(&mut w, 0.2);
        let ys: Vec<f32> = es.iter().map(|&e| w.position(e).unwrap().y).collect();
        assert!(ys[0] > 0.9 && ys[1] < 0.1 && ys[2] == 0.0, "{ys:?}");
        assert!(run_until_done(&mut w, id, 2.0).unwrap() > 0.35, "done when the last one finishes");
    }

    #[test]
    fn shake_jitters_the_drawn_position_only_and_fades() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        let key = Keyframe {
            shake: Some(0.5),
            ..Default::default()
        };
        let id = w.animate(&anim(&[e], vec![key], 0.5)).unwrap();
        run(&mut w, 0.1);
        assert_eq!(w.position(e), Some(Vec3::ZERO), "the real position doesn't move");
        assert!(w.shake_offset[0].length() > 0.0);
        assert!(run_until_done(&mut w, id, 1.0).is_some());
        w.update(FIXED_DT);
        assert_eq!(w.shake_offset[0], Vec3::ZERO);
    }

    #[test]
    fn repeat_yoyo_runs_until_despawned() {
        let mut w = World::new(2);
        let e = spawn(&mut w);
        let mut a = anim(&[e], vec![scale_to(2.0)], 0.2);
        a.repeat = -1;
        a.yoyo = true;
        let id = w.animate(&a).unwrap();
        run(&mut w, 0.4);
        assert!(w.scale[0].x < 1.2, "came back");
        assert!(w.done().is_empty(), "forever");
        w.despawn(e);
        assert!(w.done().contains(&id));
    }

    #[test]
    fn decodes_and_validates() {
        let mut d = vec![0.0; ANIM_HEADER + 1 + ANIM_KEY_LEN];
        d[0] = 1.0; // one entity
        d[1] = 1.0; // one keyframe
        d[2] = 0.5;
        d[4] = 4.0; // back
        d[ANIM_HEADER] = 7.0;
        let k = ANIM_HEADER + 1;
        d[k] = (1 | 32) as f64; // position + turn
        d[k + 2..k + 5].copy_from_slice(&[1.0, 2.0, 3.0]);
        d[k + 20] = 4.5;
        let a = Animation::decode(&d).unwrap();
        assert_eq!(a.entities, vec![Entity(7)]);
        assert_eq!(a.keys[0].position, Some(Vec3::new(1.0, 2.0, 3.0)));
        assert_eq!(a.keys[0].turn, Some(Vec3::new(0.0, 4.5, 0.0)));
        assert_eq!(a.easing, Easing::Back);
        d[4] = 99.0;
        assert!(Animation::decode(&d).is_none(), "bad easing");
        d[4] = 0.0;
        assert!(Animation::decode(&d[..ANIM_HEADER + 3]).is_none(), "too short");
        d[2] = f64::NAN;
        assert!(Animation::decode(&d).is_none(), "not finite");
    }
}
