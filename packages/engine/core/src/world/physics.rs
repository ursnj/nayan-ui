//! Rigid bodies and colliders, backed by Rapier.

use super::{Entity, NO_ENTITY, World};
use rapier3d::prelude::*;
use std::sync::Mutex;

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

/// Collects Rapier collision events during a step.
#[derive(Default)]
pub(super) struct EventSink(pub(super) Mutex<Vec<CollisionEvent>>);

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

impl World {
    /// Gives the entity a rigid body and collider (replacing any existing ones), or removes
    /// them with `None`. Returns false for a stale handle or an invalid description.
    pub fn set_physics(&mut self, e: Entity, desc: Option<PhysicsDesc>) -> bool {
        let Some(i) = self.dense(e) else { return false };
        if desc.is_some_and(|d| !d.is_valid() || self.parent[i] != NO_ENTITY) {
            return false;
        }
        if let Some((h, _)) = self.body[i].take() {
            self.physics.remove_body(h);
        }
        let Some(d) = desc else { return true };

        let builder = match d.kind {
            BodyKind::Dynamic => RigidBodyBuilder::dynamic()
                .linvel(self.velocity[i])
                .angvel(self.angular_velocity[i]),
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
}
