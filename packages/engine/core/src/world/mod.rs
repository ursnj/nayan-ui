//! The game world: entities in structure-of-arrays storage with generation-checked handles.
//!
//! - `mod.rs`        entities, transforms, motion settings, attachments, queries, output buffers
//! - `physics.rs`    rigid bodies and colliders (Rapier), raycasts
//! - `simulation.rs` the fixed-step update loop and collision events
//! - `feedback.rs`   impact sounds/haptics played straight from collisions
//! - `render.rs`     interpolated instance buffers for the renderer

mod desc;
mod feedback;
mod physics;
mod render;
mod simulation;
#[cfg(test)]
mod tests;

pub use desc::{DESC_LEN, EntityDesc, PhysicsRequest, ShapeSpec, flag as desc_flag, slot as desc_slot};
pub use feedback::ImpactFeedback;
pub use physics::{BodyKind, PhysicsDesc, Shape};

use physics::EventSink;
use rapier3d::glamx::{Quat, Vec3};
use rapier3d::prelude::{PhysicsWorld, RigidBodyHandle};

/// Mesh ids are small integers chosen by the renderer; the core only buckets by them.
pub const MAX_MESHES: usize = 8;
/// Collision events kept per `update`. Extra events are dropped.
pub const MAX_EVENTS: usize = 4096;
/// u32 values per event in `events()`: `[entity_a, entity_b, flags, impact_speed (f32 bits)]`.
pub const EVENT_STRIDE: usize = 4;
/// Event flag: the pair started touching (otherwise it stopped).
pub const EVENT_STARTED: u32 = 1;
/// Event flag: at least one collider is a sensor (no physical response).
pub const EVENT_SENSOR: u32 = 2;
/// "No entity" in the C ABI. Never a valid handle.
pub const NO_ENTITY: u32 = u32::MAX;
/// Simulation step. `update(dt)` runs as many fixed steps as fit and interpolates the rest.
pub const FIXED_DT: f32 = 1.0 / 60.0;
const MAX_STEPS_PER_UPDATE: u32 = 5;
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
/// Entities with a `PhysicsDesc` also own a Rapier rigid body + collider.
///
/// Render output (`matrices`, `colors`, `ranges`) and `events` are written into fixed-size
/// buffers that never reallocate, so pointers handed to JS stay valid for the world's life.
pub struct World {
    capacity: usize,

    // dense, indexed by dense index
    dense_slot: Vec<u32>,
    position: Vec<Vec3>,
    rotation: Vec<Quat>,
    prev_position: Vec<Vec3>,
    prev_rotation: Vec<Quat>,
    scale: Vec<Vec3>,
    color: Vec<[f32; 4]>,
    mesh: Vec<u8>,
    velocity: Vec<Vec3>,
    angular_velocity: Vec<Vec3>,
    oscillation: Vec<Oscillation>,
    follow: Vec<Follow>,
    body: Vec<Option<(RigidBodyHandle, BodyKind)>>,
    /// Seconds left before automatic despawn; infinite = forever.
    lifetime: Vec<f32>,
    /// Parent entity (raw id) or NO_ENTITY. A child's position/rotation are local to the parent.
    parent: Vec<u32>,
    feedback: Vec<Option<ImpactFeedback>>,

    // handle table
    slots: Vec<Slot>,
    free: Vec<u32>,

    bounds: Option<(Vec3, Vec3)>,
    /// Entity whose position pans and attenuates impact sounds (raw id or NO_ENTITY).
    listener: u32,
    physics: PhysicsWorld,
    sink: EventSink,
    /// Per-entity velocity just before the current physics step (approach speed for impacts).
    pre_velocity: Vec<Vec3>,
    accumulator: f32,

    // outputs (fixed size)
    out_matrices: Vec<f32>,
    out_colors: Vec<f32>,
    ranges: [u32; MAX_MESHES * 2],
    events: Vec<u32>,
    scratch: Box<[f32; 16]>,
}

impl World {
    pub fn new(capacity: usize) -> Self {
        let capacity = capacity.min(SLOT_MASK as usize - 1);
        let mut physics = PhysicsWorld::new();
        physics.gravity = Vec3::new(0.0, -9.81, 0.0);
        physics.integration_parameters.dt = FIXED_DT;
        Self {
            capacity,
            dense_slot: Vec::with_capacity(capacity),
            position: Vec::with_capacity(capacity),
            rotation: Vec::with_capacity(capacity),
            prev_position: Vec::with_capacity(capacity),
            prev_rotation: Vec::with_capacity(capacity),
            scale: Vec::with_capacity(capacity),
            color: Vec::with_capacity(capacity),
            mesh: Vec::with_capacity(capacity),
            velocity: Vec::with_capacity(capacity),
            angular_velocity: Vec::with_capacity(capacity),
            oscillation: Vec::with_capacity(capacity),
            follow: Vec::with_capacity(capacity),
            body: Vec::with_capacity(capacity),
            lifetime: Vec::with_capacity(capacity),
            parent: Vec::with_capacity(capacity),
            feedback: Vec::with_capacity(capacity),
            slots: Vec::with_capacity(capacity),
            free: Vec::new(),
            bounds: None,
            listener: NO_ENTITY,
            physics,
            sink: EventSink::default(),
            pre_velocity: Vec::with_capacity(capacity),
            accumulator: 0.0,
            out_matrices: vec![0.0; capacity * 16],
            out_colors: vec![0.0; capacity * 4],
            ranges: [0; MAX_MESHES * 2],
            events: Vec::with_capacity(MAX_EVENTS * EVENT_STRIDE),
            scratch: Box::new([0.0; 16]),
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

    // ── Lifecycle ────────────────────────────────────────────────────────

    /// Adds an entity. Returns `None` if the world is full, `mesh` is out of range, or the
    /// position/scale are not finite.
    pub fn spawn(&mut self, mesh: u8, position: Vec3, scale: Vec3, color: [f32; 4]) -> Option<Entity> {
        if self.len() >= self.capacity || mesh as usize >= MAX_MESHES || !position.is_finite() || !scale.is_finite() {
            return None;
        }
        let dense = self.len() as u32;
        let slot = match self.free.pop() {
            Some(s) => s,
            None => {
                self.slots.push(Slot {
                    dense: 0,
                    generation: 0,
                    alive: false,
                });
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
        self.prev_position.push(position);
        self.prev_rotation.push(Quat::IDENTITY);
        self.scale.push(scale);
        self.color.push(color);
        self.mesh.push(mesh);
        self.velocity.push(Vec3::ZERO);
        self.angular_velocity.push(Vec3::ZERO);
        self.oscillation.push(Oscillation::default());
        self.follow.push(Follow {
            target: NO_ENTITY,
            speed: 0.0,
        });
        self.body.push(None);
        self.lifetime.push(f32::INFINITY);
        self.parent.push(NO_ENTITY);
        self.feedback.push(None);
        Some(handle)
    }

    /// Removes an entity, its rigid body and its children. Returns false for a stale or invalid handle.
    pub fn despawn(&mut self, e: Entity) -> bool {
        let Some(i) = self.dense(e) else { return false };
        let children: Vec<Entity> = (0..self.len()).filter(|&j| self.parent[j] == e.0).map(|j| self.entity_at(j)).collect();
        if let Some((h, _)) = self.body[i] {
            self.physics.remove_body(h);
        }
        let slot = e.0 & SLOT_MASK;
        let last = self.len() - 1;

        self.dense_slot.swap_remove(i);
        self.position.swap_remove(i);
        self.rotation.swap_remove(i);
        self.prev_position.swap_remove(i);
        self.prev_rotation.swap_remove(i);
        self.scale.swap_remove(i);
        self.color.swap_remove(i);
        self.mesh.swap_remove(i);
        self.velocity.swap_remove(i);
        self.angular_velocity.swap_remove(i);
        self.oscillation.swap_remove(i);
        self.follow.swap_remove(i);
        self.body.swap_remove(i);
        self.lifetime.swap_remove(i);
        self.parent.swap_remove(i);
        self.feedback.swap_remove(i);
        if i != last {
            let moved = self.dense_slot[i];
            self.slots[moved as usize].dense = i as u32;
        }

        let s = &mut self.slots[slot as usize];
        s.alive = false;
        s.generation = (s.generation + 1) % MAX_GENERATION;
        self.free.push(slot);
        for child in children {
            self.despawn(child); // children never have children (one level), so this doesn't recurse further
        }
        true
    }

    pub fn is_alive(&self, e: Entity) -> bool {
        self.dense(e).is_some()
    }

    /// Despawns the entity automatically after `seconds` (it shrinks away over the last 0.2 s).
    /// Handy for particles, projectiles and effects. Non-positive or non-finite clears it.
    pub fn set_lifetime(&mut self, e: Entity, seconds: f32) {
        if let Some(i) = self.dense(e) {
            self.lifetime[i] = if seconds.is_finite() && seconds > 0.0 { seconds } else { f32::INFINITY };
        }
    }

    /// Attaches `child` to `parent` (or detaches it with `None`). While attached, the child's
    /// position and rotation are local to the parent, are resolved from the parent's
    /// *interpolated* pose (so attached parts never lag or jitter), and the child is despawned with
    /// the parent. Spin and bobbing still apply locally; velocity and follow are ignored.
    ///
    /// One level only: a parent can't itself be attached, an entity with children can't be
    /// attached, and entities with rigid bodies can't be attached. Returns false if rejected.
    pub fn set_parent(&mut self, child: Entity, parent: Option<Entity>) -> bool {
        let Some(c) = self.dense(child) else { return false };
        let Some(parent) = parent else {
            self.parent[c] = NO_ENTITY;
            return true;
        };
        let Some(p) = self.dense(parent) else { return false };
        let child_has_children = self.parent.contains(&child.0);
        if p == c || self.body[c].is_some() || self.parent[p] != NO_ENTITY || child_has_children {
            return false;
        }
        self.parent[c] = parent.0;
        true
    }

    // ── Transform & appearance ───────────────────────────────────────────

    /// Teleports the entity (no interpolation streak, wakes its body).
    pub fn set_position(&mut self, e: Entity, position: Vec3) {
        if !position.is_finite() {
            return;
        }
        if let Some(i) = self.dense(e) {
            self.position[i] = position;
            self.prev_position[i] = position;
            if let Some((h, _)) = self.body[i]
                && let Some(b) = self.physics.bodies.get_mut(h)
            {
                b.set_translation(position, true);
            }
        }
    }

    /// `rotation` is a quaternion (x, y, z, w); it is normalized.
    pub fn set_rotation(&mut self, e: Entity, rotation: Quat) {
        if !rotation.is_finite() || rotation.length_squared() < 1e-12 {
            return;
        }
        if let Some(i) = self.dense(e) {
            let r = rotation.normalize();
            self.rotation[i] = r;
            self.prev_rotation[i] = r;
            if let Some((h, _)) = self.body[i]
                && let Some(b) = self.physics.bodies.get_mut(h)
            {
                b.set_rotation(r, true);
            }
        }
    }

    /// Visual scale only; it does not resize an existing collider.
    pub fn set_scale(&mut self, e: Entity, scale: Vec3) {
        if let Some(i) = self.dense(e).filter(|_| scale.is_finite()) {
            self.scale[i] = scale;
        }
    }

    /// Changes what the entity is drawn as. Returns false for a stale handle or a mesh id out of range.
    pub fn set_mesh(&mut self, e: Entity, mesh: u8) -> bool {
        match self.dense(e) {
            Some(i) if (mesh as usize) < MAX_MESHES => {
                self.mesh[i] = mesh;
                true
            }
            _ => false,
        }
    }

    pub fn set_color(&mut self, e: Entity, color: [f32; 4]) {
        if let Some(i) = self.dense(e) {
            self.color[i] = color;
        }
    }

    // ── Motion ───────────────────────────────────────────────────────────

    /// Units per second. For dynamic bodies this sets the body's current velocity.
    pub fn set_velocity(&mut self, e: Entity, velocity: Vec3) {
        if !velocity.is_finite() {
            return;
        }
        if let Some(i) = self.dense(e) {
            self.velocity[i] = velocity;
            if let Some((h, BodyKind::Dynamic)) = self.body[i]
                && let Some(b) = self.physics.bodies.get_mut(h)
            {
                b.set_linvel(velocity, true);
            }
        }
    }

    /// Sets X/Z velocity and keeps Y, so a dynamic body steered on the ground still falls.
    pub fn set_planar_velocity(&mut self, e: Entity, x: f32, z: f32) {
        if !(x.is_finite() && z.is_finite()) {
            return;
        }
        if let Some(i) = self.dense(e) {
            match self.body[i] {
                Some((h, BodyKind::Dynamic)) => {
                    if let Some(b) = self.physics.bodies.get_mut(h) {
                        let y = b.linvel().y;
                        b.set_linvel(Vec3::new(x, y, z), true);
                    }
                }
                _ => {
                    self.velocity[i].x = x;
                    self.velocity[i].z = z;
                }
            }
        }
    }

    /// World-space angular velocity in radians per second (axis * speed).
    pub fn set_angular_velocity(&mut self, e: Entity, velocity: Vec3) {
        if !velocity.is_finite() {
            return;
        }
        if let Some(i) = self.dense(e) {
            self.angular_velocity[i] = velocity;
            if let Some((h, BodyKind::Dynamic)) = self.body[i]
                && let Some(b) = self.physics.bodies.get_mut(h)
            {
                b.set_angvel(velocity, true);
            }
        }
    }

    /// Offsets the rendered position by `amplitude * sin(phase)`; `phase` starts at `phase` and
    /// advances `frequency` radians per second. Purely visual: colliders don't bob.
    pub fn set_oscillation(&mut self, e: Entity, amplitude: Vec3, frequency: f32, phase: f32) {
        if !(amplitude.is_finite() && frequency.is_finite() && phase.is_finite()) {
            return;
        }
        if let Some(i) = self.dense(e) {
            self.oscillation[i] = Oscillation { amplitude, frequency, phase };
        }
    }

    /// Each step, move toward `target` on the XZ plane at `speed` (dynamic bodies keep their
    /// vertical velocity). `speed <= 0` stops following; a despawned target stops the follower.
    pub fn set_follow(&mut self, e: Entity, target: Entity, speed: f32) {
        if let Some(i) = self.dense(e) {
            let speed = if speed.is_finite() { speed.max(0.0) } else { 0.0 };
            self.follow[i] = Follow { target: target.0, speed };
        }
    }

    /// Non-dynamic entities that move are kept inside this XZ rectangle. Dynamic bodies are
    /// contained by colliders (walls) instead.
    pub fn set_bounds(&mut self, min: Vec3, max: Vec3) {
        if min.is_finite() && max.is_finite() {
            self.bounds = Some((min.min(max), min.max(max)));
        }
    }

    // ── Queries ──────────────────────────────────────────────────────────

    /// Current position (not interpolated).
    pub fn position(&self, e: Entity) -> Option<Vec3> {
        self.dense(e).map(|i| self.position[i])
    }

    /// Writes the entity's position into scratch[0..3]. Returns false if not alive.
    pub fn read_position(&mut self, e: Entity) -> bool {
        let Some(p) = self.position(e) else { return false };
        self.scratch[..3].copy_from_slice(&p.to_array());
        true
    }

    /// Writes the entity's linear velocity into scratch[0..3]. Returns false if not alive.
    pub fn read_velocity(&mut self, e: Entity) -> bool {
        let Some(i) = self.dense(e) else { return false };
        let v = match self.body[i] {
            Some((h, BodyKind::Dynamic)) => self.physics.bodies.get(h).map_or(Vec3::ZERO, |b| b.linvel()),
            _ => self.velocity[i],
        };
        self.scratch[..3].copy_from_slice(&v.to_array());
        true
    }

    // ── Output buffers ───────────────────────────────────────────────────

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

    /// Events from the last update, `EVENT_STRIDE` u32s each:
    /// `[entity_a, entity_b, flags, impact_speed as f32 bits]`.
    pub fn events(&self) -> &[u32] {
        &self.events
    }

    pub fn scratch(&self) -> &[f32; 16] {
        &self.scratch
    }

    fn entity_at(&self, dense: usize) -> Entity {
        let slot = self.dense_slot[dense];
        Entity(self.slots[slot as usize].generation << SLOT_BITS | slot)
    }

    fn dense(&self, e: Entity) -> Option<usize> {
        let slot = self.slots.get((e.0 & SLOT_MASK) as usize)?;
        (slot.alive && slot.generation == e.0 >> SLOT_BITS).then_some(slot.dense as usize)
    }
}
