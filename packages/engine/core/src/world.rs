use rapier3d::glamx::{Mat4, Quat, Vec3};
use rapier3d::prelude::{
    ActiveCollisionTypes, ActiveEvents, Collider, ColliderBuilder, ColliderSet, CollisionEvent, ContactPair,
    EventHandler, Group, InteractionGroups, InteractionTestMode, PhysicsWorld, QueryFilter, Ray, Real,
    RigidBodyBuilder, RigidBodyHandle, RigidBodySet, SoftBodySet, SoftBodyTearEvent,
};
use std::f32::consts::TAU;
use std::sync::Mutex;

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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BodyKind {
    /// Moved by physics: gravity, contacts, impulses.
    Dynamic,
    /// Moved by you (position, velocity, follow); pushes dynamic bodies, is not pushed back.
    Kinematic,
    /// Never moves (floors, walls).
    Fixed,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Shape {
    Ball { radius: f32 },
    Cuboid { half_extents: Vec3 },
}

/// Rigid body + collider for an entity. Validated by `World::set_physics`.
#[derive(Clone, Copy, Debug)]
pub struct PhysicsDesc {
    pub kind: BodyKind,
    pub shape: Shape,
    /// Collision layer bits this collider belongs to.
    pub layer: u32,
    /// Layers it interacts with. A pair interacts if either side's mask matches the other's layer.
    pub mask: u32,
    /// Sensors report events but don't push or get pushed.
    pub sensor: bool,
    pub friction: f32,
    pub restitution: f32,
    pub density: f32,
    pub linear_damping: f32,
    pub angular_damping: f32,
    pub gravity_scale: f32,
    pub lock_rotations: bool,
    /// Continuous collision detection, for fast small bodies that could tunnel through walls.
    pub ccd: bool,
}

impl PhysicsDesc {
    pub fn new(kind: BodyKind, shape: Shape) -> Self {
        Self {
            kind,
            shape,
            layer: 1,
            mask: u32::MAX,
            sensor: false,
            friction: 0.5,
            restitution: 0.0,
            density: 1.0,
            linear_damping: 0.0,
            angular_damping: 0.05,
            gravity_scale: 1.0,
            lock_rotations: false,
            ccd: false,
        }
    }

    /// Rejects values that would make the physics engine misbehave (or panic, which aborts the app).
    fn is_valid(&self) -> bool {
        let positive = |v: f32| v.is_finite() && v > 0.0;
        let non_negative = |v: f32| v.is_finite() && v >= 0.0;
        let shape_ok = match self.shape {
            Shape::Ball { radius } => positive(radius),
            Shape::Cuboid { half_extents: h } => positive(h.x) && positive(h.y) && positive(h.z),
        };
        shape_ok
            && non_negative(self.friction)
            && non_negative(self.restitution)
            && positive(self.density)
            && non_negative(self.linear_damping)
            && non_negative(self.angular_damping)
            && self.gravity_scale.is_finite()
    }
}

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

/// Collects Rapier collision events during a step.
#[derive(Default)]
struct EventSink(Mutex<Vec<CollisionEvent>>);

impl EventHandler for EventSink {
    fn handle_collision_event(
        &self,
        _bodies: &RigidBodySet,
        _colliders: &ColliderSet,
        event: CollisionEvent,
        _contact_pair: Option<&ContactPair>,
    ) {
        if let Ok(mut events) = self.0.lock() {
            events.push(event);
        }
    }

    fn handle_contact_force_event(
        &self,
        _dt: Real,
        _bodies: &RigidBodySet,
        _colliders: &ColliderSet,
        _contact_pair: &ContactPair,
        _total_force_magnitude: Real,
    ) {
    }

    fn handle_soft_body_tear_event(&self, _soft_bodies: &SoftBodySet, _event: &SoftBodyTearEvent) {}
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

    // handle table
    slots: Vec<Slot>,
    free: Vec<u32>,

    bounds: Option<(Vec3, Vec3)>,
    physics: PhysicsWorld,
    sink: EventSink,
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
            slots: Vec::with_capacity(capacity),
            free: Vec::new(),
            bounds: None,
            physics,
            sink: EventSink::default(),
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
        self.prev_position.push(position);
        self.prev_rotation.push(Quat::IDENTITY);
        self.scale.push(scale);
        self.color.push(color);
        self.mesh.push(mesh);
        self.velocity.push(Vec3::ZERO);
        self.angular_velocity.push(Vec3::ZERO);
        self.oscillation.push(Oscillation::default());
        self.follow.push(Follow { target: NO_ENTITY, speed: 0.0 });
        self.body.push(None);
        self.lifetime.push(f32::INFINITY);
        Some(handle)
    }

    /// Removes an entity (and its rigid body). Returns false for a stale or invalid handle.
    pub fn despawn(&mut self, e: Entity) -> bool {
        let Some(i) = self.dense(e) else { return false };
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

    /// Instant change in momentum (dynamic bodies only).
    pub fn apply_impulse(&mut self, e: Entity, impulse: Vec3) {
        if !impulse.is_finite() {
            return;
        }
        if let Some(i) = self.dense(e)
            && let Some((h, BodyKind::Dynamic)) = self.body[i]
            && let Some(b) = self.physics.bodies.get_mut(h)
        {
            b.apply_impulse(impulse, true);
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

    /// Despawns the entity automatically after `seconds` (it shrinks away over the last 0.2 s).
    /// Handy for particles, projectiles and effects. Non-positive or non-finite clears it.
    pub fn set_lifetime(&mut self, e: Entity, seconds: f32) {
        if let Some(i) = self.dense(e) {
            self.lifetime[i] = if seconds.is_finite() && seconds > 0.0 { seconds } else { f32::INFINITY };
        }
    }

    // ── Physics ──────────────────────────────────────────────────────────

    /// Gives the entity a rigid body and collider (replacing any existing ones), or removes
    /// them with `None`. Returns false for a stale handle or an invalid description.
    pub fn set_physics(&mut self, e: Entity, desc: Option<PhysicsDesc>) -> bool {
        let Some(i) = self.dense(e) else { return false };
        if desc.is_some_and(|d| !d.is_valid()) {
            return false;
        }
        if let Some((h, _)) = self.body[i].take() {
            self.physics.remove_body(h);
        }
        let Some(d) = desc else { return true };

        let builder = match d.kind {
            BodyKind::Dynamic => RigidBodyBuilder::dynamic().linvel(self.velocity[i]).angvel(self.angular_velocity[i]),
            BodyKind::Kinematic => RigidBodyBuilder::kinematic_position_based(),
            BodyKind::Fixed => RigidBodyBuilder::fixed(),
        };
        let mut builder = builder
            .translation(self.position[i])
            .rotation(self.rotation[i].to_scaled_axis())
            .linear_damping(d.linear_damping)
            .angular_damping(d.angular_damping)
            .gravity_scale(d.gravity_scale)
            .ccd_enabled(d.ccd)
            .user_data(e.0 as u128);
        if d.lock_rotations {
            builder = builder.lock_rotations();
        }

        let collider = match d.shape {
            Shape::Ball { radius } => ColliderBuilder::ball(radius),
            Shape::Cuboid { half_extents: h } => ColliderBuilder::cuboid(h.x, h.y, h.z),
        }
        .sensor(d.sensor)
        .friction(d.friction)
        .restitution(d.restitution)
        .density(d.density)
        .collision_groups(InteractionGroups::new(
            Group::from_bits_retain(d.layer),
            Group::from_bits_retain(d.mask),
            InteractionTestMode::Or,
        ))
        .active_events(ActiveEvents::COLLISION_EVENTS)
        .active_collision_types(ActiveCollisionTypes::all())
        .user_data(e.0 as u128);

        let (handle, _) = self.physics.insert(builder, collider);
        self.body[i] = Some((handle, d.kind));
        true
    }

    pub fn set_gravity(&mut self, gravity: Vec3) {
        if gravity.is_finite() {
            self.physics.gravity = gravity;
        }
    }

    /// Casts a ray against non-sensor colliders whose layer intersects `mask`, as of the last
    /// update. Returns the hit entity and fills the scratch buffer with
    /// `[distance, nx, ny, nz, px, py, pz]`.
    pub fn raycast(&mut self, origin: Vec3, direction: Vec3, max_distance: f32, mask: u32) -> Option<Entity> {
        if !(origin.is_finite() && direction.is_finite() && max_distance.is_finite()) || max_distance <= 0.0 {
            return None;
        }
        let dir = direction.try_normalize()?;
        let ray = Ray::new(origin, dir);
        let layer_matches = |_, c: &Collider| c.collision_groups().memberships.bits() & mask != 0;
        let filter = QueryFilter::default().exclude_sensors().predicate(&layer_matches);
        let (handle, hit) = self.physics.cast_ray_and_get_normal(&ray, max_distance, true, filter)?;
        let entity = Entity(self.physics.colliders.get(handle)?.user_data as u32);
        let point = origin + dir * hit.time_of_impact;
        self.scratch[..7].copy_from_slice(&[
            hit.time_of_impact,
            hit.normal.x,
            hit.normal.y,
            hit.normal.z,
            point.x,
            point.y,
            point.z,
        ]);
        Some(entity)
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

    // ── Simulation ───────────────────────────────────────────────────────

    /// Advances by `dt` seconds: runs whole `FIXED_DT` steps (at most 5; a longer stall is dropped
    /// rather than spiralling), then interpolates the render output between the last two steps.
    /// Collision events from all steps run this call are available from `events()`.
    pub fn update(&mut self, dt: f32) {
        self.events.clear();
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

    fn step(&mut self, h: f32) {
        let n = self.len();
        self.prev_position.copy_from_slice(&self.position);
        self.prev_rotation.copy_from_slice(&self.rotation);

        // Followers steer toward their target.
        for i in 0..n {
            let f = self.follow[i];
            if f.speed <= 0.0 {
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
                        b.set_linvel(Vec3::new(dir.x * f.speed, y, dir.z * f.speed), true);
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
            let v = self.velocity[i];
            if v != Vec3::ZERO {
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
            self.physics.step_with_events(&(), &self.sink);
            self.sync_dynamic_bodies();
            self.collect_events();
        }
        self.expire(h);
    }

    /// Despawns entities whose lifetime ran out.
    fn expire(&mut self, h: f32) {
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

    fn sync_dynamic_bodies(&mut self) {

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

    fn collect_events(&mut self) {
        let Ok(mut raw) = self.sink.0.lock() else { return };
        for event in raw.drain(..) {
            if self.events.len() + EVENT_STRIDE > MAX_EVENTS * EVENT_STRIDE {
                break;
            }
            let colliders = &self.physics.colliders;
            let (Some(c1), Some(c2)) = (colliders.get(event.collider1()), colliders.get(event.collider2())) else {
                continue;
            };
            let velocity = |c: &Collider| {
                c.parent()
                    .and_then(|h| self.physics.bodies.get(h))
                    .map_or(Vec3::ZERO, |b| b.linvel())
            };
            let speed = if event.started() { (velocity(c1) - velocity(c2)).length() } else { 0.0 };
            let flags = (event.started() as u32 * EVENT_STARTED) | (event.sensor() as u32 * EVENT_SENSOR);
            self.events
                .extend_from_slice(&[c1.user_data as u32, c2.user_data as u32, flags, speed.to_bits()]);
        }
    }

    /// Writes matrices/colors bucketed by mesh so each mesh is one contiguous instance range.
    /// `alpha` in 0..1 blends from the previous step's transform to the current one.
    fn write_outputs(&mut self, alpha: f32) {
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
            let position = self.prev_position[i].lerp(self.position[i], alpha) + osc.amplitude * osc.phase.sin();
            let rotation = self.prev_rotation[i].lerp(self.rotation[i], alpha);
            let fade = (self.lifetime[i] / 0.2).min(1.0); // shrink away at the end of a lifetime
            let matrix = Mat4::from_scale_rotation_translation(self.scale[i] * fade, rotation, position);
            self.out_matrices[k * 16..k * 16 + 16].copy_from_slice(&matrix.to_cols_array());
            self.out_colors[k * 4..k * 4 + 4].copy_from_slice(&self.color[i]);
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::FRAC_PI_2;

    const WHITE: [f32; 4] = [1.0; 4];

    fn close(a: f32, b: f32, eps: f32) -> bool {
        (a - b).abs() < eps
    }

    fn spawn(w: &mut World, mesh: u8, p: Vec3) -> Entity {
        w.spawn(mesh, p, Vec3::ONE, WHITE).unwrap()
    }

    /// Runs whole fixed steps covering `seconds`.
    fn run(w: &mut World, seconds: f32) {
        for _ in 0..(seconds / FIXED_DT).round() as usize {
            w.update(FIXED_DT);
        }
    }

    fn events(w: &World) -> Vec<(u32, u32, u32, f32)> {
        w.events()
            .chunks(EVENT_STRIDE)
            .map(|e| (e[0], e[1], e[2], f32::from_bits(e[3])))
            .collect()
    }

    fn floor(w: &mut World) -> Entity {
        let f = spawn(w, 2, Vec3::new(0.0, -0.5, 0.0));
        assert!(w.set_physics(
            f,
            Some(PhysicsDesc::new(BodyKind::Fixed, Shape::Cuboid { half_extents: Vec3::new(50.0, 0.5, 50.0) }))
        ));
        f
    }

    // ── entities & rendering ──

    #[test]
    fn spawn_writes_transform_and_color() {
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
    fn spawn_rejects_full_world_bad_mesh_and_non_finite_input() {
        let mut w = World::new(2);
        assert!(w.spawn(MAX_MESHES as u8, Vec3::ZERO, Vec3::ONE, WHITE).is_none());
        assert!(w.spawn(0, Vec3::new(f32::NAN, 0.0, 0.0), Vec3::ONE, WHITE).is_none());
        assert!(w.spawn(0, Vec3::ZERO, Vec3::splat(f32::INFINITY), WHITE).is_none());
        assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_some());
        assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_some());
        assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_none());
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
        assert_eq!([r[0], r[1], r[2], r[3], r[4], r[5]], [0, 1, 1, 2, 3, 1]);
        let x = |k: usize| w.matrices()[k * 16 + 12];
        assert_eq!([x(0), x(1), x(2), x(3)], [20.0, 10.0, 11.0, 30.0]);
    }

    #[test]
    fn buffers_never_move_under_churn() {
        let mut w = World::new(8);
        floor(&mut w);
        let (m, c, ev) = (w.matrices().as_ptr(), w.colors().as_ptr(), w.events().as_ptr());
        let mut live = Vec::new();
        for round in 0..100 {
            while let Some(e) = w.spawn(1, Vec3::new(0.0, 1.0 + round as f32 * 0.01, 0.0), Vec3::ONE, WHITE) {
                w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
                live.push(e);
            }
            for e in live.drain(..3) {
                w.despawn(e);
            }
            w.update(FIXED_DT);
        }
        assert_eq!((w.matrices().as_ptr(), w.colors().as_ptr(), w.events().as_ptr()), (m, c, ev));
    }

    // ── kinematic motion ──

    #[test]
    fn spin_rotates_about_y() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::ZERO);
        w.set_angular_velocity(e, Vec3::new(0.0, FRAC_PI_2, 0.0));
        // Rendering trails the simulation by one step (it blends previous -> current), so run one
        // extra step for the drawn transform to show a full second: a quarter turn, +X maps to -Z.
        run(&mut w, 1.0 + FIXED_DT);
        let m = w.matrices();
        assert!(close(m[0], 0.0, 1e-3) && close(m[2], -1.0, 1e-3), "x axis: {:?}", &m[0..3]);
    }

    #[test]
    fn oscillation_offsets_output_but_not_position() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
        w.set_oscillation(e, Vec3::new(0.0, 2.0, 0.0), FRAC_PI_2, 0.0);
        run(&mut w, 1.0); // phase = pi/2 -> sin = 1
        assert!(close(w.matrices()[13], 2.0, 1e-3));
        assert_eq!(w.position(e), Some(Vec3::new(1.0, 0.0, 0.0)));
    }

    #[test]
    fn velocity_moves_and_bounds_clamp() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::ZERO);
        w.set_bounds(Vec3::new(-5.0, 0.0, -5.0), Vec3::new(5.0, 0.0, 5.0));
        w.set_velocity(e, Vec3::new(3.0, 0.0, 0.0));
        run(&mut w, 1.0);
        assert!(close(w.position(e).unwrap().x, 3.0, 1e-3));
        run(&mut w, 1.0);
        assert!(close(w.position(e).unwrap().x, 5.0, 1e-3), "clamped at the arena edge");
    }

    #[test]
    fn follow_steers_toward_target_and_stops_when_it_is_gone() {
        let mut w = World::new(2);
        let chaser = spawn(&mut w, 0, Vec3::ZERO);
        let target = spawn(&mut w, 0, Vec3::new(10.0, 0.0, 0.0));
        w.set_follow(chaser, target, 2.0);
        run(&mut w, 1.0);
        assert!(close(w.position(chaser).unwrap().x, 2.0, 1e-3));
        w.despawn(target);
        run(&mut w, 1.0);
        assert!(close(w.position(chaser).unwrap().x, 2.0, 1e-3), "no target, no movement");
    }

    #[test]
    fn render_output_interpolates_between_steps() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::ZERO);
        w.set_velocity(e, Vec3::new(60.0, 0.0, 0.0)); // 1 unit per step
        w.update(FIXED_DT); // one step: prev = 0, current = 1
        w.update(FIXED_DT * 0.5); // no new step: drawn half way between prev (0) and current (1)
        assert!(close(w.matrices()[12], 0.5, 1e-3), "{}", w.matrices()[12]);
        assert!(close(w.position(e).unwrap().x, 1.0, 1e-3), "simulation state is not interpolated");
    }

    #[test]
    fn non_finite_dt_and_inputs_are_ignored() {
        let mut w = World::new(1);
        let e = spawn(&mut w, 0, Vec3::ZERO);
        w.set_velocity(e, Vec3::new(f32::NAN, 0.0, 0.0));
        w.set_position(e, Vec3::new(f32::INFINITY, 0.0, 0.0));
        w.update(f32::NAN);
        w.update(-1.0);
        assert_eq!(w.position(e), Some(Vec3::ZERO));
    }

    #[test]
    fn lifetime_despawns_and_shrinks() {
        let mut w = World::new(4);
        let keep = spawn(&mut w, 0, Vec3::ZERO);
        let short = spawn(&mut w, 0, Vec3::X);
        let with_body = spawn(&mut w, 1, Vec3::Y);
        w.set_physics(with_body, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
        w.set_lifetime(short, 0.5);
        w.set_lifetime(with_body, 0.5);
        run(&mut w, 0.4);
        assert!(w.is_alive(short));
        let short_scale = w.matrices()[16]; // entity 1 (mesh 0, second instance): x scale
        assert!(short_scale < 1.0 && short_scale > 0.0, "shrinking: {short_scale}");
        run(&mut w, 0.2);
        assert!(!w.is_alive(short) && !w.is_alive(with_body));
        assert!(w.is_alive(keep));
        assert_eq!(w.physics.bodies.len(), 0, "expired bodies are removed from physics");
    }

    // ── physics ──

    #[test]
    fn dynamic_ball_falls_and_rests_on_the_floor() {
        let mut w = World::new(4);
        floor(&mut w);
        let ball = spawn(&mut w, 1, Vec3::new(0.0, 5.0, 0.0));
        assert!(w.set_physics(ball, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }))));
        run(&mut w, 0.5);
        let y = w.position(ball).unwrap().y;
        assert!(y < 4.0, "gravity pulls it down: {y}");
        run(&mut w, 3.0);
        let y = w.position(ball).unwrap().y;
        assert!(close(y, 0.5, 0.05), "rests on the floor surface: {y}");
    }

    #[test]
    fn impulse_and_planar_velocity_move_dynamic_bodies() {
        let mut w = World::new(4);
        floor(&mut w);
        let ball = spawn(&mut w, 1, Vec3::new(0.0, 0.5, 0.0));
        let mut desc = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 });
        desc.friction = 0.0;
        w.set_physics(ball, Some(desc));
        w.apply_impulse(ball, Vec3::new(0.0, 5.0, 0.0));
        assert!(w.read_velocity(ball));
        assert!(w.scratch()[1] > 1.0, "impulse launched it upward: {:?}", &w.scratch()[0..3]);

        w.set_planar_velocity(ball, 2.0, 0.0);
        assert!(w.read_velocity(ball));
        assert!(close(w.scratch()[0], 2.0, 1e-3) && w.scratch()[1] > 1.0, "x set, y kept");
    }

    #[test]
    fn collision_events_report_start_stop_sensor_and_speed() {
        let mut w = World::new(4);
        let player = spawn(&mut w, 1, Vec3::new(-3.0, 0.0, 0.0));
        let orb = spawn(&mut w, 1, Vec3::ZERO);
        let mut p = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
        p.layer = 1;
        p.mask = 2;
        let mut o = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
        o.layer = 2;
        o.mask = 0; // relies on the player's mask: "either side" semantics
        o.sensor = true;
        w.set_physics(player, Some(p));
        w.set_physics(orb, Some(o));
        w.set_velocity(player, Vec3::new(6.0, 0.0, 0.0));

        let mut started = None;
        for _ in 0..120 {
            w.update(FIXED_DT);
            if let Some(&e) = events(&w).iter().find(|e| e.2 & EVENT_STARTED != 0) {
                started = Some(e);
                break;
            }
        }
        let (a, b, flags, speed) = started.expect("touch should start");
        assert!([a, b].contains(&player.0) && [a, b].contains(&orb.0));
        assert!(flags & EVENT_SENSOR != 0);
        assert!(close(speed, 6.0, 0.5), "impact speed ~ relative velocity: {speed}");

        let mut stopped = false;
        for _ in 0..120 {
            w.update(FIXED_DT);
            stopped |= events(&w).iter().any(|e| e.2 & EVENT_STARTED == 0);
        }
        assert!(stopped, "passing through should end the touch");
    }

    #[test]
    fn layers_filter_collisions() {
        let mut w = World::new(4);
        let a = spawn(&mut w, 1, Vec3::ZERO);
        let b = spawn(&mut w, 1, Vec3::new(0.5, 0.0, 0.0));
        let mut d = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
        d.layer = 1;
        d.mask = 1;
        w.set_physics(a, Some(d));
        d.layer = 2;
        d.mask = 2;
        w.set_physics(b, Some(d));
        run(&mut w, 0.2);
        let mut any = false;
        for _ in 0..10 {
            w.update(FIXED_DT);
            any |= !w.events().is_empty();
        }
        assert!(!any, "no shared layer/mask, no events");
    }

    #[test]
    fn raycast_hits_solid_colliders_by_mask() {
        let mut w = World::new(4);
        let wall = spawn(&mut w, 0, Vec3::new(5.0, 0.0, 0.0));
        let mut d = PhysicsDesc::new(BodyKind::Fixed, Shape::Cuboid { half_extents: Vec3::splat(0.5) });
        d.layer = 4;
        w.set_physics(wall, Some(d));
        let sensor = spawn(&mut w, 1, Vec3::new(2.0, 0.0, 0.0));
        let mut s = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
        s.sensor = true;
        s.layer = 4;
        w.set_physics(sensor, Some(s));
        w.update(FIXED_DT); // build the query structures

        let hit = w.raycast(Vec3::ZERO, Vec3::X, 100.0, 4);
        assert_eq!(hit, Some(wall), "sensors are skipped");
        assert!(close(w.scratch()[0], 4.5, 1e-3), "distance to the near face: {}", w.scratch()[0]);
        assert!(close(w.scratch()[1], -1.0, 1e-3), "normal faces the ray");
        assert_eq!(w.raycast(Vec3::ZERO, Vec3::X, 100.0, 1), None, "mask excludes the wall");
        assert_eq!(w.raycast(Vec3::ZERO, Vec3::X, 3.0, 4), None, "out of range");
        assert_eq!(w.raycast(Vec3::ZERO, Vec3::ZERO, 3.0, 4), None, "zero direction");
    }

    #[test]
    fn invalid_physics_is_rejected_without_panicking() {
        let mut w = World::new(2);
        let e = spawn(&mut w, 1, Vec3::ZERO);
        for shape in [
            Shape::Ball { radius: 0.0 },
            Shape::Ball { radius: -1.0 },
            Shape::Ball { radius: f32::NAN },
            Shape::Cuboid { half_extents: Vec3::new(1.0, 0.0, 1.0) },
        ] {
            assert!(!w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, shape))));
        }
        let mut d = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 1.0 });
        d.density = 0.0;
        assert!(!w.set_physics(e, Some(d)));
        assert!(!w.set_physics(Entity(NO_ENTITY), Some(PhysicsDesc::new(BodyKind::Fixed, Shape::Ball { radius: 1.0 }))));
        run(&mut w, 0.1);
    }

    #[test]
    fn removing_physics_and_despawning_clean_up_bodies() {
        let mut w = World::new(4);
        let e = spawn(&mut w, 1, Vec3::ZERO);
        w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
        assert_eq!(w.physics.bodies.len(), 1);
        assert!(w.set_physics(e, None));
        assert_eq!(w.physics.bodies.len(), 0);
        w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
        w.despawn(e);
        assert_eq!(w.physics.bodies.len(), 0);
        assert_eq!(w.physics.colliders.len(), 0);
    }

    #[test]
    fn dynamic_follower_chases_while_gravity_still_applies() {
        let mut w = World::new(4);
        floor(&mut w);
        let target = spawn(&mut w, 1, Vec3::new(10.0, 0.5, 0.0));
        let chaser = spawn(&mut w, 0, Vec3::new(0.0, 3.0, 0.0));
        let mut d = PhysicsDesc::new(BodyKind::Dynamic, Shape::Cuboid { half_extents: Vec3::splat(0.5) });
        d.lock_rotations = true;
        w.set_physics(chaser, Some(d));
        w.set_follow(chaser, target, 3.0);
        run(&mut w, 2.0);
        let p = w.position(chaser).unwrap();
        assert!(p.x > 4.0, "moved toward the target: {p}");
        assert!(close(p.y, 0.5, 0.1), "landed on the floor: {p}");
    }
}
