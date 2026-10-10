//! Particle bursts: many short-lived entities spawned in one call (explosions, sparks, confetti,
//! dust). Particles are ordinary entities with velocity, spin, acceleration and a lifetime, so they
//! cost nothing extra to draw and clean themselves up.

use super::*;

/// Length of an encoded burst, in f64 values.
pub const BURST_LEN: usize = 30;

/// Encoded layout: position xyz, direction xyz, spread (radians), count, mesh, size, speed,
/// lifetime, gravity (added to y velocity per second), color count (1..4), colors rgba x 4.
mod slot {
    pub const POSITION: usize = 0;
    pub const DIRECTION: usize = 3;
    pub const SPREAD: usize = 6;
    pub const COUNT: usize = 7;
    pub const MESH: usize = 8;
    pub const SIZE: usize = 9;
    pub const SPEED: usize = 10;
    pub const LIFETIME: usize = 11;
    pub const GRAVITY: usize = 12;
    pub const COLOR_COUNT: usize = 13;
    pub const COLORS: usize = 14;
}

#[derive(Clone, Debug, PartialEq)]
pub struct Burst {
    pub position: Vec3,
    /// Main direction particles fly in.
    pub direction: Vec3,
    /// Half-angle of the cone around `direction`, in radians (π = every direction).
    pub spread: f32,
    pub count: u32,
    pub mesh: u8,
    /// Particle size (each one varies a little).
    pub size: f32,
    /// Top speed (each particle gets 50..100% of it).
    pub speed: f32,
    /// Seconds (each particle gets 70..100% of it).
    pub lifetime: f32,
    /// Vertical acceleration, e.g. -9.81 to fall.
    pub gravity: f32,
    /// Each particle picks one at random.
    pub colors: Vec<[f32; 4]>,
}

impl Burst {
    pub fn decode(d: &[f64]) -> Option<Burst> {
        if d.len() < BURST_LEN {
            return None;
        }
        let f = |i: usize| d[i] as f32;
        let v3 = |i: usize| Vec3::new(f(i), f(i + 1), f(i + 2));
        let colors = (0..(d[slot::COLOR_COUNT].clamp(1.0, 4.0) as usize))
            .map(|k| {
                let c = slot::COLORS + k * 4;
                [f(c), f(c + 1), f(c + 2), f(c + 3)]
            })
            .collect();
        let b = Burst {
            position: v3(slot::POSITION),
            direction: v3(slot::DIRECTION),
            spread: f(slot::SPREAD),
            count: d[slot::COUNT].clamp(0.0, 10_000.0) as u32,
            mesh: d[slot::MESH].clamp(0.0, 255.0) as u8,
            size: f(slot::SIZE),
            speed: f(slot::SPEED),
            lifetime: f(slot::LIFETIME),
            gravity: f(slot::GRAVITY),
            colors,
        };
        // A NaN color count clamps to NaN, which casts to zero colors.
        let valid = !b.colors.is_empty()
            && b.position.is_finite()
            && b.direction.is_finite()
            && [b.spread, b.size, b.speed, b.lifetime, b.gravity].iter().all(|v| v.is_finite())
            && b.colors.iter().flatten().all(|c| c.is_finite());
        valid.then_some(b)
    }
}

impl World {
    /// xorshift32: cheap randomness for effects, in 0..1.
    fn random(&mut self) -> f32 {
        let mut x = self.rng;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.rng = x;
        (x >> 8) as f32 / (1u32 << 24) as f32
    }

    /// Spawns up to `count` particles (fewer if the world fills up). Returns how many were spawned.
    pub fn burst(&mut self, b: &Burst) -> u32 {
        let axis = b.direction.try_normalize().unwrap_or(Vec3::Y);
        // Any two directions perpendicular to the axis.
        let side = if axis.y.abs() < 0.9 { Vec3::Y } else { Vec3::X }.cross(axis).normalize();
        let up = axis.cross(side);
        let cos_spread = b.spread.clamp(0.0, std::f32::consts::PI).cos();
        let mut spawned = 0;
        for _ in 0..b.count {
            // Uniform direction in the cone: cos(angle) uniform in [cos(spread), 1].
            let cos = 1.0 - self.random() * (1.0 - cos_spread);
            let sin = (1.0 - cos * cos).max(0.0).sqrt();
            let around = self.random() * std::f32::consts::TAU;
            let dir = axis * cos + (side * around.cos() + up * around.sin()) * sin;
            let speed = b.speed * (0.5 + 0.5 * self.random());
            let size = b.size * (0.7 + 0.6 * self.random());
            let color = b.colors[(self.random() * b.colors.len() as f32) as usize % b.colors.len()];
            let Some(e) = self.spawn(b.mesh, b.position, Vec3::splat(size), color) else {
                break;
            };
            let i = self.len() - 1;
            self.velocity[i] = dir * speed;
            self.acceleration[i] = Vec3::new(0.0, b.gravity, 0.0);
            let spin_axis = Vec3::new(self.random() - 0.5, self.random() - 0.5, self.random() - 0.5).normalize_or(Vec3::Y);
            self.angular_velocity[i] = spin_axis * (2.0 + 6.0 * self.random());
            self.pickable[i] = false;
            let life = b.lifetime * (0.7 + 0.3 * self.random());
            self.set_lifetime(e, life);
            spawned += 1;
        }
        spawned
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

    #[test]
    fn spawns_flying_short_lived_particles() {
        let mut w = World::new(10);
        let b = Burst {
            position: Vec3::new(0.0, 1.0, 0.0),
            direction: Vec3::Y,
            spread: 0.3,
            count: 20,
            mesh: 0,
            size: 0.1,
            speed: 5.0,
            lifetime: 0.5,
            gravity: -9.81,
            colors: vec![[1.0, 0.0, 0.0, 1.0], [1.0, 1.0, 0.0, 1.0]],
        };
        assert_eq!(w.burst(&b), 10, "capped by capacity");
        for i in 0..w.len() {
            let v = w.velocity[i];
            assert!(v.y > 0.0 && v.length() <= 5.0 + 1e-4, "upward cone: {v:?}");
        }
        run(&mut w, 0.6);
        assert_eq!(w.len(), 0, "all expired");
    }

    #[test]
    fn decode_rejects_a_nan_color_count() {
        let mut d = [0.0; BURST_LEN];
        d[slot::COUNT] = 5.0;
        d[slot::COLOR_COUNT] = f64::NAN; // clamps to NaN, casts to 0 colors: picking one divided by 0
        assert!(Burst::decode(&d).is_none());
        d[slot::COLOR_COUNT] = 1.0;
        assert_eq!(World::new(8).burst(&Burst::decode(&d).unwrap()), 5);
    }
}
