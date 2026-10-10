//! The fixed-step update loop: animations, steering, integration, physics, events, lifetimes.

use super::*;
use rapier3d::prelude::Collider;
use std::f32::consts::TAU;

impl World {
    /// Advances by `dt` seconds: runs whole `FIXED_DT` steps (at most 5; a longer stall is dropped
    /// rather than spiralling), then interpolates the render output between the last two steps.
    /// Collision events from all steps run this call are available from `events()`.
    pub fn update(&mut self, dt: f32) {
        self.events.clear();
        self.done.clear();
        if dt.is_finite() && dt > 0.0 {
            self.accumulator += dt;
            let mut steps = 0;
            while self.accumulator >= FIXED_DT && steps < MAX_STEPS_PER_UPDATE {
                self.step(FIXED_DT);
                self.accumulator -= FIXED_DT;
                steps += 1;
            }
            if steps == MAX_STEPS_PER_UPDATE {
                self.accumulator = self.accumulator.min(FIXED_DT * 0.999);
            }
        }
        self.write_outputs(self.accumulator / FIXED_DT);
    }

    pub(super) fn step(&mut self, h: f32) {
        let n = self.len();
        self.prev_position.copy_from_slice(&self.position);
        self.prev_rotation.copy_from_slice(&self.rotation);
        self.advance_tweens(h);

        // Followers steer toward their target.
        for i in 0..n {
            let f = self.follow[i];
            if f.speed <= 0.0 || self.parent[i] != NO_ENTITY {
                continue;
            }
            let dir = match self.dense(Entity(f.target)) {
                Some(t) => {
                    let to = self.position[t] - self.position[i];
                    Vec3::new(to.x, 0.0, to.z).normalize_or_zero()
                }
                None => Vec3::ZERO,
            };
            match self.body[i] {
                Some((h, BodyKind::Dynamic)) => {
                    if let Some(b) = self.physics.bodies.get_mut(h) {
                        let y = b.linvel().y;
                        physics::set_linvel(b, Vec3::new(dir.x * f.speed, y, dir.z * f.speed));
                    }
                }
                _ => self.velocity[i] = dir * f.speed,
            }
        }

        // Integrate everything physics doesn't own, and tell kinematic bodies where to go.
        let mut any_body = false;
        for i in 0..n {
            let osc = &mut self.oscillation[i];
            if osc.frequency != 0.0 {
                osc.phase = (osc.phase + osc.frequency * h) % TAU;
            }
            let body = self.body[i];
            any_body |= body.is_some();
            if matches!(body, Some((_, BodyKind::Dynamic | BodyKind::Fixed))) {
                continue;
            }
            let a = self.acceleration[i];
            if a != Vec3::ZERO {
                self.velocity[i] += a * h;
            }
            let v = self.velocity[i];
            if v != Vec3::ZERO && self.parent[i] == NO_ENTITY {
                let mut p = self.position[i] + v * h;
                if let Some((lo, hi)) = self.bounds {
                    p.x = p.x.clamp(lo.x, hi.x);
                    p.z = p.z.clamp(lo.z, hi.z);
                }
                self.position[i] = p;
            }
            let w = self.angular_velocity[i];
            if w != Vec3::ZERO {
                self.rotation[i] = (Quat::from_scaled_axis(w * h) * self.rotation[i]).normalize();
            }
            if let Some((handle, BodyKind::Kinematic)) = body
                && let Some(b) = self.physics.bodies.get_mut(handle)
            {
                b.set_next_kinematic_translation(self.position[i]);
                b.set_next_kinematic_rotation(self.rotation[i]);
            }
        }
        if any_body {
            // Contacts are resolved inside the step, so velocities read afterwards understate how hard
            // things hit. Remember the approach velocities first.
            self.pre_velocity.clear();
            for i in 0..self.len() {
                self.pre_velocity.push(match self.body[i] {
                    Some((h, BodyKind::Dynamic)) => self.physics.bodies.get(h).map_or(Vec3::ZERO, |b| b.linvel()),
                    Some((_, BodyKind::Kinematic)) | None => self.velocity[i],
                    Some((_, BodyKind::Fixed)) => Vec3::ZERO,
                });
            }
            self.physics.step_with_events(&(), &self.sink);
            self.sync_dynamic_bodies();
            self.collect_events();
        }
        self.expire(h);
    }

    /// Despawns entities whose lifetime ran out.
    pub(super) fn expire(&mut self, h: f32) {
        let mut i = 0;
        while i < self.len() {
            self.lifetime[i] -= h;
            if self.lifetime[i] <= 0.0 {
                let e = self.entity_at(i);
                self.despawn(e); // swap-remove: re-check index i
            } else {
                i += 1;
            }
        }
    }

    pub(super) fn sync_dynamic_bodies(&mut self) {
        // Physics owns dynamic bodies: copy their pose back.
        for i in 0..self.len() {
            if let Some((h, BodyKind::Dynamic)) = self.body[i]
                && let Some(b) = self.physics.bodies.get(h)
            {
                self.position[i] = b.translation();
                self.rotation[i] = *b.rotation();
            }
        }
    }

    pub(super) fn collect_events(&mut self) {
        let mut pending: Vec<(u32, u32, f32)> = Vec::new();
        let raw = match self.sink.0.lock() {
            Ok(mut events) => std::mem::take(&mut *events),
            Err(_) => return,
        };
        for event in raw {
            if self.events.len() + EVENT_STRIDE > MAX_EVENTS * EVENT_STRIDE {
                break;
            }
            let colliders = &self.physics.colliders;
            let (Some(c1), Some(c2)) = (colliders.get(event.collider1()), colliders.get(event.collider2())) else {
                continue;
            };
            let approach = |c: &Collider| {
                self.dense(Entity(c.user_data as u32))
                    .and_then(|i| self.pre_velocity.get(i).copied())
                    .unwrap_or(Vec3::ZERO)
            };
            let speed = if event.started() { (approach(c1) - approach(c2)).length() } else { 0.0 };
            let flags = (event.started() as u32 * EVENT_STARTED) | (event.sensor() as u32 * EVENT_SENSOR);
            let (a, b) = (c1.user_data as u32, c2.user_data as u32);
            self.events.extend_from_slice(&[a, b, flags, speed.to_bits()]);
            if event.started() && !event.sensor() {
                pending.push((a, b, speed)); // sensors (pickups, triggers) aren't physical impacts
            }
        }
        for (a, b, speed) in pending {
            self.impact_feedback(Entity(a), Entity(b), speed);
        }
    }
}
