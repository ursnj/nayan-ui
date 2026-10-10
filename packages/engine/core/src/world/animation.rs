//! Tweens: move, rotate, scale and recolor an entity over time, stepped with the simulation (so they
//! are interpolated like everything else and cost no JS per frame).
//!
//! One animation per entity: starting another replaces it. When one ends (or its entity is
//! despawned) the entity id is reported in `World::done`, which JS uses to resolve promises.

use super::*;

/// Length of an encoded animation, in f64 values.
pub const ANIM_LEN: usize = 20;

/// Encoded layout: flags (1 position, 2 rotation, 4 scale, 8 color), position xyz, rotation xyzw,
/// scale xyz, color rgba, duration, delay, easing, repeat (-1 = forever), yoyo.
mod slot {
    pub const FLAGS: usize = 0;
    pub const POSITION: usize = 1;
    pub const ROTATION: usize = 4;
    pub const SCALE: usize = 8;
    pub const COLOR: usize = 11;
    pub const DURATION: usize = 15;
    pub const DELAY: usize = 16;
    pub const EASING: usize = 17;
    pub const REPEAT: usize = 18;
    pub const YOYO: usize = 19;
}

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

/// What to animate and how. Targets that are `None` aren't touched.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Animation {
    pub position: Option<Vec3>,
    pub rotation: Option<Quat>,
    pub scale: Option<Vec3>,
    pub color: Option<[f32; 4]>,
    /// Seconds.
    pub duration: f32,
    /// Seconds before it starts.
    pub delay: f32,
    pub easing: Easing,
    /// Extra runs after the first; -1 repeats forever.
    pub repeat: i32,
    /// Every other run plays backwards (pulses, ping-pong).
    pub yoyo: bool,
}

impl Animation {
    /// Decodes the flat C-ABI form. None if it's too short or malformed.
    pub fn decode(d: &[f64]) -> Option<Animation> {
        if d.len() < ANIM_LEN || !(0.0..16.0).contains(&d[slot::FLAGS]) {
            return None;
        }
        let flags = d[slot::FLAGS] as u32;
        let f = |i: usize| d[i] as f32;
        let v3 = |i: usize| Vec3::new(f(i), f(i + 1), f(i + 2));
        let r = slot::ROTATION;
        let c = slot::COLOR;
        let a = Animation {
            position: (flags & 1 != 0).then(|| v3(slot::POSITION)),
            rotation: (flags & 2 != 0).then(|| Quat::from_xyzw(f(r), f(r + 1), f(r + 2), f(r + 3))),
            scale: (flags & 4 != 0).then(|| v3(slot::SCALE)),
            color: (flags & 8 != 0).then(|| [f(c), f(c + 1), f(c + 2), f(c + 3)]),
            duration: f(slot::DURATION),
            delay: f(slot::DELAY),
            easing: Easing::from_index(d[slot::EASING])?,
            repeat: d[slot::REPEAT].clamp(-1.0, 1e6) as i32,
            yoyo: d[slot::YOYO] != 0.0,
        };
        let finite = a.position.is_none_or(|p| p.is_finite())
            && a.rotation.is_none_or(|q| q.is_finite() && q.length_squared() > 1e-12)
            && a.scale.is_none_or(|s| s.is_finite())
            && a.color.is_none_or(|c| c.iter().all(|v| v.is_finite()))
            && a.duration.is_finite()
            && a.delay.is_finite();
        finite.then_some(a)
    }
}

/// A running animation: start and end values per channel, plus timing.
#[derive(Clone, Debug)]
pub(super) struct Tween {
    position: Option<(Vec3, Vec3)>,
    rotation: Option<(Quat, Quat)>,
    scale: Option<(Vec3, Vec3)>,
    color: Option<([f32; 4], [f32; 4])>,
    elapsed: f32,
    delay: f32,
    duration: f32,
    easing: Easing,
    repeat: i32,
    yoyo: bool,
    forward: bool,
}

impl World {
    /// Starts animating from the entity's current values to the targets in `a`, replacing any
    /// running animation. Returns false for a stale handle or an animation with no targets.
    pub fn animate(&mut self, e: Entity, a: &Animation) -> bool {
        let Some(i) = self.dense(e) else { return false };
        if a.position.is_none() && a.rotation.is_none() && a.scale.is_none() && a.color.is_none() {
            self.tween[i] = None;
            return false;
        }
        self.tween[i] = Some(Box::new(Tween {
            position: a.position.map(|p| (self.position[i], p)),
            rotation: a.rotation.map(|r| (self.rotation[i], r.normalize())),
            scale: a.scale.map(|s| (self.scale[i], s)),
            color: a.color.map(|c| (self.color[i], c)),
            elapsed: 0.0,
            delay: a.delay.max(0.0),
            duration: a.duration.max(0.0),
            easing: a.easing,
            repeat: a.repeat,
            yoyo: a.yoyo,
            forward: true,
        }));
        true
    }

    /// Stops the entity's animation where it is. Returns false if it had none.
    pub fn stop_animation(&mut self, e: Entity) -> bool {
        self.dense(e).is_some_and(|i| self.tween[i].take().is_some())
    }

    /// Advances every running animation by `h` seconds and applies it.
    pub(super) fn advance_tweens(&mut self, h: f32) {
        for i in 0..self.len() {
            let Some(t) = self.tween[i].as_mut() else { continue };
            t.elapsed += h;
            if t.elapsed < t.delay {
                continue;
            }
            let raw = if t.duration > 0.0 {
                ((t.elapsed - t.delay) / t.duration).min(1.0)
            } else {
                1.0
            };
            let k = t.easing.apply(if t.forward { raw } else { 1.0 - raw });
            let (position, rotation, scale, color) = (
                t.position.map(|(a, b)| a.lerp(b, k)),
                t.rotation.map(|(a, b)| a.slerp(b, k.clamp(0.0, 1.0))),
                t.scale.map(|(a, b)| a.lerp(b, k)),
                t.color.map(|(a, b)| std::array::from_fn(|c| a[c] + (b[c] - a[c]) * k)),
            );
            let finished = raw >= 1.0 && t.repeat == 0;
            if raw >= 1.0 && !finished {
                if t.repeat > 0 {
                    t.repeat -= 1;
                }
                t.elapsed = t.delay;
                if t.yoyo {
                    t.forward = !t.forward;
                }
            }
            if let Some(p) = position {
                self.position[i] = p;
                self.move_body(i);
            }
            if let Some(r) = rotation {
                self.rotation[i] = r;
                self.move_body(i);
            }
            if let Some(s) = scale {
                self.scale[i] = s;
            }
            if let Some(c) = color {
                self.color[i] = c;
            }
            if finished {
                self.tween[i] = None;
                if self.done.len() < self.capacity {
                    self.done.push(self.entity_at(i).0);
                }
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

#[cfg(test)]
mod tests {
    use super::*;

    fn run(w: &mut World, seconds: f32) {
        for _ in 0..(seconds / FIXED_DT).round() as usize {
            w.update(FIXED_DT);
        }
    }

    fn moving(to: Vec3, duration: f32) -> Animation {
        Animation {
            position: Some(to),
            rotation: None,
            scale: None,
            color: None,
            duration,
            delay: 0.0,
            easing: Easing::Linear,
            repeat: 0,
            yoyo: false,
        }
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
    fn moves_over_time_then_reports_done() {
        let mut w = World::new(2);
        let e = w.spawn(0, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        assert!(w.animate(e, &moving(Vec3::new(10.0, 0.0, 0.0), 0.5)));
        run(&mut w, 0.25);
        assert!((w.position(e).unwrap().x - 5.0).abs() < 0.4, "halfway");
        let mut reported = 0;
        for _ in 0..30 {
            w.update(FIXED_DT);
            reported += w.done().iter().filter(|&&d| d == e.0).count();
        }
        assert_eq!(w.position(e), Some(Vec3::new(10.0, 0.0, 0.0)));
        assert_eq!(reported, 1, "reported once");
    }

    #[test]
    fn repeats_with_yoyo_and_despawn_reports_done() {
        let mut w = World::new(2);
        let e = w.spawn(0, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        let pulse = Animation {
            position: None,
            scale: Some(Vec3::splat(2.0)),
            repeat: -1,
            yoyo: true,
            ..moving(Vec3::ZERO, 0.2)
        };
        assert!(w.animate(e, &pulse));
        run(&mut w, 0.4);
        assert!(w.scale[0].x < 1.2, "came back");
        assert!(w.done().is_empty(), "forever");
        w.despawn(e);
        assert_eq!(w.done(), &[e.0]);
    }

    #[test]
    fn decodes_and_validates() {
        let mut d = [0.0; ANIM_LEN];
        d[0] = 1.0;
        d[1..4].copy_from_slice(&[1.0, 2.0, 3.0]);
        d[15] = 0.5;
        d[17] = 4.0; // back
        let a = Animation::decode(&d).unwrap();
        assert_eq!(a.position, Some(Vec3::new(1.0, 2.0, 3.0)));
        assert_eq!(a.easing, Easing::Back);
        d[17] = 99.0;
        assert!(Animation::decode(&d).is_none());
        assert!(Animation::decode(&d[..5]).is_none());
    }
}
