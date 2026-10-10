use glam::{Mat4, Quat, Vec3};
use std::f32::consts::TAU;

/// Mesh ids are small integers chosen by the renderer; the core only buckets by them.
pub const MAX_MESHES: usize = 8;
/// Collision pairs reported per update (two u32 entity ids each). Extra pairs are dropped.
pub const MAX_EVENT_PAIRS: usize = 4096;
/// "No entity" in the C ABI. Never a valid handle.
pub const NO_ENTITY: u32 = u32::MAX;

const SLOT_BITS: u32 = 20;
const SLOT_MASK: u32 = (1 << SLOT_BITS) - 1;
/// Generations cycle 0..MAX_GENERATION so that `u32::MAX` is never a valid handle.
const MAX_GENERATION: u32 = (1 << (32 - SLOT_BITS)) - 1;

/// Handle to an entity: `generation << 20 | slot`. A stale handle (entity despawned, slot
/// reused) is detected by its generation and ignored.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Entity(pub u32);

#[derive(Clone, Copy, Debug, Default)]
struct Oscillation {
    amplitude: Vec3,
    frequency: f32,
    phase: f32,
}

#[derive(Clone, Copy, Debug)]
struct Collider {
    radius: f32, // 0 = no collider
    layer: u32,
    mask: u32,
}

#[derive(Clone, Copy, Debug)]
struct Follow {
    target: u32,
    speed: f32, // 0 = not following
}

#[derive(Clone, Copy)]
struct Slot {
    dense: u32,
    generation: u32,
    alive: bool,
}

/// All entity data lives in dense structure-of-arrays storage (swap-remove on despawn).
///
/// Render output (`matrices`, `colors`, `ranges`) and `events` are written into fixed-size
/// buffers that never reallocate, so pointers handed to JS stay valid for the world's life.
pub struct World {
    capacity: usize,

    // dense, indexed by dense index
    dense_slot: Vec<u32>,
    position: Vec<Vec3>,
    rotation: Vec<Quat>,
    scale: Vec<Vec3>,
    color: Vec<[f32; 4]>,
    mesh: Vec<u8>,
    velocity: Vec<Vec3>,
    angular_velocity: Vec<Vec3>,
    oscillation: Vec<Oscillation>,
    collider: Vec<Collider>,
    follow: Vec<Follow>,

    // handle table
    slots: Vec<Slot>,
    free: Vec<u32>,

    bounds: Option<(Vec3, Vec3)>,

    // outputs (fixed size)
    out_matrices: Vec<f32>,
    out_colors: Vec<f32>,
    ranges: [u32; MAX_MESHES * 2],
    events: Vec<u32>,
    scratch: Box<[f32; 16]>,
    collider_idx: Vec<u32>,
}

impl World {
    pub fn new(capacity: usize) -> Self {
        let capacity = capacity.min(SLOT_MASK as usize - 1);
        Self {
            capacity,
            dense_slot: Vec::with_capacity(capacity),
            position: Vec::with_capacity(capacity),
            rotation: Vec::with_capacity(capacity),
            scale: Vec::with_capacity(capacity),
            color: Vec::with_capacity(capacity),
            mesh: Vec::with_capacity(capacity),
            velocity: Vec::with_capacity(capacity),
            angular_velocity: Vec::with_capacity(capacity),
            oscillation: Vec::with_capacity(capacity),
            collider: Vec::with_capacity(capacity),
            follow: Vec::with_capacity(capacity),
            slots: Vec::with_capacity(capacity),
            free: Vec::new(),
            bounds: None,
            out_matrices: vec![0.0; capacity * 16],
            out_colors: vec![0.0; capacity * 4],
            ranges: [0; MAX_MESHES * 2],
            events: Vec::with_capacity(MAX_EVENT_PAIRS * 2),
            scratch: Box::new([0.0; 16]),
            collider_idx: Vec::new(),
        }
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }

    pub fn len(&self) -> usize {
        self.position.len()
    }

    pub fn is_empty(&self) -> bool {
        self.position.is_empty()
    }

    /// Adds an entity. Returns `None` if the world is full or `mesh` is out of range.
    pub fn spawn(&mut self, mesh: u8, position: Vec3, scale: Vec3, color: [f32; 4]) -> Option<Entity> {
        if self.len() >= self.capacity || mesh as usize >= MAX_MESHES {
            return None;
        }
        let dense = self.len() as u32;
        let slot = match self.free.pop() {
            Some(s) => s,
            None => {
                self.slots.push(Slot { dense: 0, generation: 0, alive: false });
                (self.slots.len() - 1) as u32
            }
        };
        let s = &mut self.slots[slot as usize];
        s.dense = dense;
        s.alive = true;
        let handle = Entity(s.generation << SLOT_BITS | slot);

        self.dense_slot.push(slot);
        self.position.push(position);
        self.rotation.push(Quat::IDENTITY);
        self.scale.push(scale);
        self.color.push(color);
        self.mesh.push(mesh);
        self.velocity.push(Vec3::ZERO);
        self.angular_velocity.push(Vec3::ZERO);
        self.oscillation.push(Oscillation::default());
        self.collider.push(Collider { radius: 0.0, layer: 0, mask: 0 });
        self.follow.push(Follow { target: NO_ENTITY, speed: 0.0 });
        Some(handle)
    }

    /// Removes an entity. Returns false for a stale or invalid handle.
    pub fn despawn(&mut self, e: Entity) -> bool {
        let Some(i) = self.dense(e) else { return false };
        let slot = e.0 & SLOT_MASK;
        let last = self.len() - 1;

        self.dense_slot.swap_remove(i);
        self.position.swap_remove(i);
        self.rotation.swap_remove(i);
        self.scale.swap_remove(i);
        self.color.swap_remove(i);
        self.mesh.swap_remove(i);
        self.velocity.swap_remove(i);
        self.angular_velocity.swap_remove(i);
        self.oscillation.swap_remove(i);
        self.collider.swap_remove(i);
        self.follow.swap_remove(i);
        if i != last {
            let moved = self.dense_slot[i];
            self.slots[moved as usize].dense = i as u32;
        }

        let s = &mut self.slots[slot as usize];
        s.alive = false;
        s.generation = (s.generation + 1) % MAX_GENERATION;
        self.free.push(slot);
        true
    }

    pub fn is_alive(&self, e: Entity) -> bool {
        self.dense(e).is_some()
    }

    pub fn set_position(&mut self, e: Entity, position: Vec3) {
        if let Some(i) = self.dense(e) {
            self.position[i] = position;
        }
    }

    /// `rotation` is a quaternion (x, y, z, w); it is normalized.
    pub fn set_rotation(&mut self, e: Entity, rotation: Quat) {
        if let Some(i) = self.dense(e) {
            self.rotation[i] = rotation.normalize();
        }
    }

    pub fn set_scale(&mut self, e: Entity, scale: Vec3) {
        if let Some(i) = self.dense(e) {
            self.scale[i] = scale;
        }
    }

    pub fn set_color(&mut self, e: Entity, color: [f32; 4]) {
        if let Some(i) = self.dense(e) {
            self.color[i] = color;
        }
    }

    /// World-space linear velocity in units per second.
    pub fn set_velocity(&mut self, e: Entity, velocity: Vec3) {
        if let Some(i) = self.dense(e) {
            self.velocity[i] = velocity;
        }
    }

    /// World-space angular velocity in radians per second (axis * speed).
    pub fn set_angular_velocity(&mut self, e: Entity, velocity: Vec3) {
        if let Some(i) = self.dense(e) {
            self.angular_velocity[i] = velocity;
        }
    }

    /// Offsets position by `amplitude * sin(phase)`; `phase` starts at `phase` and advances
    /// `frequency` radians per second.
    pub fn set_oscillation(&mut self, e: Entity, amplitude: Vec3, frequency: f32, phase: f32) {
        if let Some(i) = self.dense(e) {
            self.oscillation[i] = Oscillation { amplitude, frequency, phase };
        }
    }

    /// Sphere collider. Two entities collide when their spheres overlap and
    /// `a.mask & b.layer != 0` or `b.mask & a.layer != 0`. `radius <= 0` removes it.
    pub fn set_collider(&mut self, e: Entity, radius: f32, layer: u32, mask: u32) {
        if let Some(i) = self.dense(e) {
            self.collider[i] = Collider { radius: radius.max(0.0), layer, mask };
        }
    }

    /// Each update, move toward `target` on the XZ plane at `speed`. `speed <= 0` stops following.
    /// If the target is despawned the follower stops.
    pub fn set_follow(&mut self, e: Entity, target: Entity, speed: f32) {
        if let Some(i) = self.dense(e) {
            self.follow[i] = Follow { target: target.0, speed: speed.max(0.0) };
        }
    }

    /// Entities that move are kept inside this XZ rectangle (`min`/`max` use x and z).
    pub fn set_bounds(&mut self, min: Vec3, max: Vec3) {
        self.bounds = Some((min, max));
    }

    /// Base position (without oscillation offset).
    pub fn position(&self, e: Entity) -> Option<Vec3> {
        self.dense(e).map(|i| self.position[i])
    }

    /// Writes the entity's position into the scratch buffer. Returns false if not alive.
    pub fn read_position(&mut self, e: Entity) -> bool {
        match self.position(e) {
            Some(p) => {
                self.scratch[0] = p.x;
                self.scratch[1] = p.y;
                self.scratch[2] = p.z;
                true
            }
            None => false,
        }
    }

    pub fn update(&mut self, dt: f32) {
        let n = self.len();

        // Followers steer toward their target.
        for i in 0..n {
            let f = self.follow[i];
            if f.speed > 0.0 {
                self.velocity[i] = match self.dense(Entity(f.target)) {
                    Some(t) => {
                        let to = self.position[t] - self.position[i];
                        Vec3::new(to.x, 0.0, to.z).normalize_or_zero() * f.speed
                    }
                    None => Vec3::ZERO,
                };
            }
        }

        // Integrate motion.
        for i in 0..n {
            let v = self.velocity[i];
            if v != Vec3::ZERO {
                let mut p = self.position[i] + v * dt;
                if let Some((lo, hi)) = self.bounds {
                    p.x = p.x.clamp(lo.x, hi.x);
                    p.z = p.z.clamp(lo.z, hi.z);
                }
                self.position[i] = p;
            }
            let w = self.angular_velocity[i];
            if w != Vec3::ZERO {
                self.rotation[i] = (Quat::from_scaled_axis(w * dt) * self.rotation[i]).normalize();
            }
            let osc = &mut self.oscillation[i];
            if osc.frequency != 0.0 {
                osc.phase = (osc.phase + osc.frequency * dt) % TAU;
            }
        }

        self.detect_collisions();
        self.write_outputs();
    }

    fn detect_collisions(&mut self) {
        self.events.clear();
        let mut idx = std::mem::take(&mut self.collider_idx);
        idx.clear();
        idx.extend((0..self.len() as u32).filter(|&i| self.collider[i as usize].radius > 0.0));

        'outer: for (a, &i) in idx.iter().enumerate() {
            let ca = self.collider[i as usize];
            for &j in &idx[a + 1..] {
                let cb = self.collider[j as usize];
                if ca.mask & cb.layer == 0 && cb.mask & ca.layer == 0 {
                    continue;
                }
                let r = ca.radius + cb.radius;
                if (self.position[i as usize] - self.position[j as usize]).length_squared() <= r * r {
                    if self.events.len() + 2 > MAX_EVENT_PAIRS * 2 {
                        break 'outer;
                    }
                    let (ea, eb) = (self.entity_at(i as usize), self.entity_at(j as usize));
                    self.events.push(ea.0);
                    self.events.push(eb.0);
                }
            }
        }
        self.collider_idx = idx;
    }

    /// Writes matrices/colors bucketed by mesh so each mesh is one contiguous instance range.
    fn write_outputs(&mut self) {
        let n = self.len();
        let mut counts = [0u32; MAX_MESHES];
        for &m in &self.mesh {
            counts[m as usize] += 1;
        }
        let mut cursor = [0u32; MAX_MESHES];
        let mut first = 0;
        for m in 0..MAX_MESHES {
            cursor[m] = first;
            self.ranges[m * 2] = first;
            self.ranges[m * 2 + 1] = counts[m];
            first += counts[m];
        }

        for i in 0..n {
            let m = self.mesh[i] as usize;
            let k = cursor[m] as usize;
            cursor[m] += 1;
            let osc = self.oscillation[i];
            let position = self.position[i] + osc.amplitude * osc.phase.sin();
            let matrix = Mat4::from_scale_rotation_translation(self.scale[i], self.rotation[i], position);
            self.out_matrices[k * 16..k * 16 + 16].copy_from_slice(&matrix.to_cols_array());
            self.out_colors[k * 4..k * 4 + 4].copy_from_slice(&self.color[i]);
        }
    }

    /// Capacity-sized buffer; the first `len()` matrices are valid, grouped by mesh (see `ranges`).
    pub fn matrices(&self) -> &[f32] {
        &self.out_matrices
    }

    /// Capacity-sized buffer; 4 floats (rgba) per instance, same order as `matrices`.
    pub fn colors(&self) -> &[f32] {
        &self.out_colors
    }

    /// `[first, count]` per mesh id, in instances.
    pub fn ranges(&self) -> &[u32; MAX_MESHES * 2] {
        &self.ranges
    }

    /// Entity-id pairs from the last update: `[a0, b0, a1, b1, ...]`.
    pub fn events(&self) -> &[u32] {
        &self.events
    }

    pub fn scratch(&self) -> &[f32; 16] {
        &self.scratch
    }

    fn dense(&self, e: Entity) -> Option<usize> {
        let slot = self.slots.get((e.0 & SLOT_MASK) as usize)?;
        (slot.alive && slot.generation == e.0 >> SLOT_BITS).then_some(slot.dense as usize)
    }

    fn entity_at(&self, dense: usize) -> Entity {
        let slot = self.dense_slot[dense];
        Entity(self.slots[slot as usize].generation << SLOT_BITS | slot)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::FRAC_PI_2;

    const WHITE: [f32; 4] = [1.0; 4];

    fn close(a: f32, b: f32) -> bool {
        (a - b).abs() < 1e-4
    }

    fn spawn(w: &mut World, mesh: u8, p: Vec3) -> Entity {
        w.spawn(mesh, p, Vec3::ONE, WHITE).unwrap()
    }

    #[test]
    fn spawn_writes_transform_and_color_after_update() {
        let mut w = World::new(4);
        let e = w.spawn(0, Vec3::new(1.0, 2.0, 3.0), Vec3::splat(2.0), [0.1, 0.2, 0.3, 1.0]).unwrap();
        assert!(w.is_alive(e));
        w.update(0.0);
        let m = w.matrices();
        assert_eq!([m[0], m[5], m[10]], [2.0, 2.0, 2.0]);
        assert_eq!([m[12], m[13], m[14], m[15]], [1.0, 2.0, 3.0, 1.0]);
        assert_eq!(&w.colors()[0..4], &[0.1, 0.2, 0.3, 1.0]);
    }

    #[test]
    fn spin_rotates_about_y() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::ZERO);
        w.set_angular_velocity(e, Vec3::new(0.0, FRAC_PI_2, 0.0));
        w.update(1.0); // quarter turn about Y: +X axis maps to -Z
        let m = w.matrices();
        assert!(close(m[0], 0.0) && close(m[2], -1.0), "x axis: {:?}", &m[0..3]);
    }

    #[test]
    fn oscillation_offsets_output_but_not_base_position() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
        w.set_oscillation(e, Vec3::new(0.0, 2.0, 0.0), FRAC_PI_2, 0.0);
        w.update(1.0); // phase = pi/2 -> sin = 1
        assert!(close(w.matrices()[13], 2.0));
        assert_eq!(w.position(e), Some(Vec3::new(1.0, 0.0, 0.0)));
    }

    #[test]
    fn velocity_moves_and_bounds_clamp() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::ZERO);
        w.set_bounds(Vec3::new(-5.0, 0.0, -5.0), Vec3::new(5.0, 0.0, 5.0));
        w.set_velocity(e, Vec3::new(3.0, 0.0, 0.0));
        w.update(1.0);
        assert!(close(w.position(e).unwrap().x, 3.0));
        w.update(1.0);
        assert!(close(w.position(e).unwrap().x, 5.0), "clamped at the arena edge");
    }

    #[test]
    fn despawn_invalidates_handle_even_after_slot_reuse() {
        let mut w = World::new(4);
        let a = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
        let b = spawn(&mut w, 0, Vec3::new(2.0, 0.0, 0.0));
        assert!(w.despawn(a));
        assert!(!w.despawn(a), "double despawn is a no-op");
        assert_eq!(w.position(b), Some(Vec3::new(2.0, 0.0, 0.0)), "swap-remove keeps other handles valid");

        let c = spawn(&mut w, 0, Vec3::new(9.0, 0.0, 0.0)); // reuses a's slot
        assert_ne!(a, c);
        assert!(!w.is_alive(a), "stale handle must not alias the new entity");
        w.set_position(a, Vec3::ZERO);
        assert_eq!(w.position(c), Some(Vec3::new(9.0, 0.0, 0.0)));
        assert!(!w.is_alive(Entity(NO_ENTITY)));
    }

    #[test]
    fn output_is_bucketed_by_mesh() {
        let mut w = World::new(8);
        spawn(&mut w, 1, Vec3::new(10.0, 0.0, 0.0));
        spawn(&mut w, 0, Vec3::new(20.0, 0.0, 0.0));
        spawn(&mut w, 1, Vec3::new(11.0, 0.0, 0.0));
        spawn(&mut w, 2, Vec3::new(30.0, 0.0, 0.0));
        w.update(0.0);
        let r = w.ranges();
        assert_eq!([r[0], r[1]], [0, 1]); // mesh 0
        assert_eq!([r[2], r[3]], [1, 2]); // mesh 1
        assert_eq!([r[4], r[5]], [3, 1]); // mesh 2
        let x = |k: usize| w.matrices()[k * 16 + 12];
        assert_eq!([x(0), x(1), x(2), x(3)], [20.0, 10.0, 11.0, 30.0]);
    }

    #[test]
    fn follow_steers_toward_target_and_stops_when_it_is_gone() {
        let mut w = World::new(2);
        let chaser = spawn(&mut w, 0, Vec3::ZERO);
        let target = spawn(&mut w, 0, Vec3::new(10.0, 0.0, 0.0));
        w.set_follow(chaser, target, 2.0);
        w.update(1.0);
        assert!(close(w.position(chaser).unwrap().x, 2.0));
        w.despawn(target);
        w.update(1.0);
        assert!(close(w.position(chaser).unwrap().x, 2.0), "no target, no movement");
    }

    #[test]
    fn collisions_respect_layers_and_masks() {
        let mut w = World::new(4);
        let player = spawn(&mut w, 0, Vec3::ZERO);
        let orb = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
        let other_orb = spawn(&mut w, 0, Vec3::new(1.2, 0.0, 0.0));
        let far = spawn(&mut w, 0, Vec3::new(50.0, 0.0, 0.0));
        w.set_collider(player, 0.6, 1, 2);
        w.set_collider(orb, 0.6, 2, 0);
        w.set_collider(other_orb, 0.6, 2, 0);
        w.set_collider(far, 0.6, 2, 0);
        w.update(0.0);
        let ev = w.events();
        // player-orb and player-other_orb overlap; orb-other_orb overlap but share no mask; far is out of range
        assert_eq!(ev.len(), 4);
        assert!(ev.chunks(2).all(|p| p.contains(&player.0)));
        assert!(!ev.contains(&far.0));
    }

    #[test]
    fn buffers_never_move_under_churn() {
        let mut w = World::new(8);
        let (m, c, ev) = (w.matrices().as_ptr(), w.colors().as_ptr(), w.events().as_ptr());
        let mut live = Vec::new();
        for round in 0..200 {
            while let Some(e) = w.spawn(0, Vec3::splat(round as f32), Vec3::ONE, WHITE) {
                w.set_collider(e, 5.0, 1, 1);
                live.push(e);
            }
            for e in live.drain(..4) {
                w.despawn(e);
            }
            w.update(0.016);
        }
        assert_eq!((w.matrices().as_ptr(), w.colors().as_ptr(), w.events().as_ptr()), (m, c, ev));
    }

    #[test]
    fn spawn_refused_when_full_or_bad_mesh() {
        let mut w = World::new(1);
        assert!(w.spawn(MAX_MESHES as u8, Vec3::ZERO, Vec3::ONE, WHITE).is_none());
        assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_some());
        assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_none());
    }

    #[test]
    fn read_position_fills_scratch() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::new(4.0, 5.0, 6.0));
        assert!(w.read_position(e));
        assert_eq!(&w.scratch()[0..3], &[4.0, 5.0, 6.0]);
        w.despawn(e);
        assert!(!w.read_position(e));
    }
}
