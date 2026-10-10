//! Entity descriptions: everything about an entity in one value, so creating or changing an entity
//! is a single call (one JS → native crossing instead of one per property).
//!
//! Across the C ABI a description is a flat `[f64; DESC_LEN]`: slot 0 holds flags saying which
//! fields are present; the rest live at fixed offsets (see `slot`). Doubles keep entity ids and
//! layer bits exact.

use super::{BodyKind, Entity, ImpactFeedback, NO_ENTITY, PhysicsDesc, Shape, World};
use rapier3d::glamx::{Quat, Vec3};

/// Length of an encoded description, in f64 values.
pub const DESC_LEN: usize = 55;

/// Which fields an encoded description carries (slot 0).
pub mod flag {
    pub const MESH: u64 = 1 << 0;
    pub const POSITION: u64 = 1 << 1;
    pub const ROTATION: u64 = 1 << 2;
    pub const SCALE: u64 = 1 << 3;
    pub const COLOR: u64 = 1 << 4;
    pub const VELOCITY: u64 = 1 << 5;
    pub const GROUND_VELOCITY: u64 = 1 << 6;
    pub const SPIN: u64 = 1 << 7;
    pub const BOB: u64 = 1 << 8;
    pub const FOLLOW: u64 = 1 << 9;
    pub const LIFETIME: u64 = 1 << 10;
    pub const PARENT: u64 = 1 << 11;
    pub const PHYSICS: u64 = 1 << 12;
    pub const IMPACT: u64 = 1 << 13;
}

/// Offsets of each field in an encoded description.
pub mod slot {
    pub const FLAGS: usize = 0;
    pub const MESH: usize = 1; // mesh id
    pub const POSITION: usize = 2; // x y z
    pub const ROTATION: usize = 5; // quaternion x y z w
    pub const SCALE: usize = 9; // x y z
    pub const COLOR: usize = 12; // r g b a
    pub const VELOCITY: usize = 16; // x y z
    pub const GROUND_VELOCITY: usize = 19; // x z
    pub const SPIN: usize = 21; // x y z (radians / second)
    pub const BOB: usize = 24; // amplitude x y z, speed, phase
    pub const FOLLOW: usize = 29; // target (-1 = stop), speed
    pub const LIFETIME: usize = 31; // seconds (<= 0 clears)
    pub const PARENT: usize = 32; // entity (-1 = detach)
    /// kind (0 remove, 1 dynamic, 2 kinematic, 3 fixed), shape (0 ball, 1 box, 2 from mesh),
    /// size x y z (radius in x for a ball, half extents for a box; <= 0 = from the entity's scale),
    /// layer, mask, sensor, friction, bounce, density, drag, angular drag, gravity scale, upright, ccd.
    pub const PHYSICS: usize = 33;
    /// enabled, sound (-1 = none), min speed, max speed, volume, haptic.
    pub const IMPACT: usize = 49;
}

/// The renderer's mesh ids (see `Mesh` in the TypeScript API): used to size default colliders.
const MESH_SPHERE: u8 = 1;
const MESH_PLANE: u8 = 2;

/// A collider shape request. `None` sizes come from the entity's scale when the body is created.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum ShapeSpec {
    /// Spheres get a ball; everything else a box (planes a thin slab).
    #[default]
    FromMesh,
    Ball(Option<f32>),
    Box(Option<Vec3>),
}

/// A rigid body request: the body settings plus a shape that may be sized from the entity.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PhysicsRequest {
    /// Body and collider settings. Its `shape` is replaced by the resolved `shape` below.
    pub desc: PhysicsDesc,
    pub shape: ShapeSpec,
}

/// Everything about an entity. `None` = leave unchanged; `Some(None)` = remove.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct EntityDesc {
    pub mesh: Option<u8>,
    pub position: Option<Vec3>,
    pub rotation: Option<Quat>,
    pub scale: Option<Vec3>,
    pub color: Option<[f32; 4]>,
    pub velocity: Option<Vec3>,
    /// Horizontal velocity that keeps the vertical one (a steered body still falls).
    pub ground_velocity: Option<(f32, f32)>,
    pub spin: Option<Vec3>,
    /// Visual bob: amplitude, speed (radians / second), phase.
    pub bob: Option<(Vec3, f32, f32)>,
    pub follow: Option<Option<(Entity, f32)>>,
    pub lifetime: Option<f32>,
    pub parent: Option<Option<Entity>>,
    pub physics: Option<Option<PhysicsRequest>>,
    pub impact: Option<Option<ImpactFeedback>>,
}

fn id(v: f64) -> Option<Entity> {
    (v >= 0.0 && v < NO_ENTITY as f64).then_some(Entity(v as u32))
}

fn bits(v: f64) -> u32 {
    if (-2147483648.0..=4294967295.0).contains(&v) {
        (v as i64 & 0xffff_ffff) as u32
    } else {
        0
    }
}

impl EntityDesc {
    /// Decodes the flat C-ABI form. Returns None if it's too short or a value is out of range.
    pub fn decode(d: &[f64]) -> Option<EntityDesc> {
        if d.len() < DESC_LEN || !(0.0..=u32::MAX as f64).contains(&d[slot::FLAGS]) {
            return None;
        }
        let flags = d[slot::FLAGS] as u64;
        let has = |f: u64| flags & f != 0;
        let f = |i: usize| d[i] as f32;
        let v3 = |i: usize| Vec3::new(f(i), f(i + 1), f(i + 2));

        let mut out = EntityDesc::default();
        if has(flag::MESH) {
            let mesh = d[slot::MESH];
            if !(0.0..256.0).contains(&mesh) {
                return None;
            }
            out.mesh = Some(mesh as u8);
        }
        if has(flag::POSITION) {
            out.position = Some(v3(slot::POSITION));
        }
        if has(flag::ROTATION) {
            let r = slot::ROTATION;
            out.rotation = Some(Quat::from_xyzw(f(r), f(r + 1), f(r + 2), f(r + 3)));
        }
        if has(flag::SCALE) {
            out.scale = Some(v3(slot::SCALE));
        }
        if has(flag::COLOR) {
            let c = slot::COLOR;
            out.color = Some([f(c), f(c + 1), f(c + 2), f(c + 3)]);
        }
        if has(flag::VELOCITY) {
            out.velocity = Some(v3(slot::VELOCITY));
        }
        if has(flag::GROUND_VELOCITY) {
            out.ground_velocity = Some((f(slot::GROUND_VELOCITY), f(slot::GROUND_VELOCITY + 1)));
        }
        if has(flag::SPIN) {
            out.spin = Some(v3(slot::SPIN));
        }
        if has(flag::BOB) {
            out.bob = Some((v3(slot::BOB), f(slot::BOB + 3), f(slot::BOB + 4)));
        }
        if has(flag::FOLLOW) {
            out.follow = Some(id(d[slot::FOLLOW]).map(|t| (t, f(slot::FOLLOW + 1))));
        }
        if has(flag::LIFETIME) {
            out.lifetime = Some(f(slot::LIFETIME));
        }
        if has(flag::PARENT) {
            out.parent = Some(id(d[slot::PARENT]));
        }
        if has(flag::PHYSICS) {
            let p = slot::PHYSICS;
            out.physics = Some(match d[p] as i64 {
                0 => None,
                kind @ 1..=3 => {
                    let kind = [BodyKind::Dynamic, BodyKind::Kinematic, BodyKind::Fixed][kind as usize - 1];
                    let size = v3(p + 2);
                    let shape = match d[p + 1] as i64 {
                        0 => ShapeSpec::Ball((size.x > 0.0).then_some(size.x)),
                        1 => ShapeSpec::Box((size.min_element() > 0.0).then_some(size)),
                        2 => ShapeSpec::FromMesh,
                        _ => return None,
                    };
                    let desc = PhysicsDesc {
                        kind,
                        shape: Shape::Ball { radius: 0.5 }, // replaced when the shape is resolved
                        layer: bits(d[p + 5]),
                        mask: bits(d[p + 6]),
                        sensor: d[p + 7] != 0.0,
                        friction: f(p + 8),
                        restitution: f(p + 9),
                        density: f(p + 10),
                        linear_damping: f(p + 11),
                        angular_damping: f(p + 12),
                        gravity_scale: f(p + 13),
                        lock_rotations: d[p + 14] != 0.0,
                        ccd: d[p + 15] != 0.0,
                    };
                    Some(PhysicsRequest { desc, shape })
                }
                _ => return None,
            });
        }
        if has(flag::IMPACT) {
            let i = slot::IMPACT;
            out.impact = Some((d[i] != 0.0).then(|| ImpactFeedback {
                sound: (d[i + 1] >= 0.0 && d[i + 1] < u32::MAX as f64).then(|| d[i + 1] as u32),
                min_speed: f(i + 2),
                max_speed: f(i + 3),
                volume: f(i + 4),
                haptic: f(i + 5),
            }));
        }
        Some(out)
    }
}

impl World {
    /// Spawns an entity from a description. Returns None (and spawns nothing) if the world is full
    /// or any part of the description is rejected.
    pub fn spawn_with(&mut self, d: &EntityDesc) -> Option<Entity> {
        let e = self.spawn(
            d.mesh.unwrap_or(0),
            d.position.unwrap_or(Vec3::ZERO),
            d.scale.unwrap_or(Vec3::ONE),
            d.color.unwrap_or([1.0; 4]),
        )?;
        let rest = EntityDesc {
            mesh: None,
            position: None,
            scale: None,
            color: None,
            ..*d
        };
        if self.apply(e, &rest) {
            Some(e)
        } else {
            self.despawn(e);
            None
        }
    }

    /// Changes an entity. Every field that is set is applied; returns false if the entity is gone
    /// or a field was rejected (the others are still applied).
    pub fn apply(&mut self, e: Entity, d: &EntityDesc) -> bool {
        if !self.is_alive(e) {
            return false;
        }
        let mut ok = true;
        if let Some(mesh) = d.mesh {
            ok &= self.set_mesh(e, mesh);
        }
        if let Some(p) = d.position {
            self.set_position(e, p);
        }
        if let Some(r) = d.rotation {
            self.set_rotation(e, r);
        }
        if let Some(s) = d.scale {
            self.set_scale(e, s);
        }
        if let Some(c) = d.color {
            self.set_color(e, c);
        }
        if let Some(v) = d.velocity {
            self.set_velocity(e, v);
        }
        if let Some(w) = d.spin {
            self.set_angular_velocity(e, w);
        }
        if let Some((amplitude, speed, phase)) = d.bob {
            self.set_oscillation(e, amplitude, speed, phase);
        }
        if let Some(seconds) = d.lifetime {
            self.set_lifetime(e, seconds);
        }
        if let Some(follow) = d.follow {
            match follow {
                Some((target, speed)) => self.set_follow(e, target, speed),
                None => self.set_follow(e, Entity(NO_ENTITY), 0.0),
            }
        }
        if let Some(parent) = d.parent {
            ok &= self.set_parent(e, parent);
        }
        // After mesh/scale/position/rotation/velocity/spin, so a new body starts from them.
        if let Some(physics) = d.physics {
            let resolved = physics.map(|r| PhysicsDesc {
                shape: self.resolve_shape(e, r.shape),
                ..r.desc
            });
            ok &= self.set_physics(e, resolved);
        }
        // After physics, so a dynamic body keeps falling while it's steered.
        if let Some((x, z)) = d.ground_velocity {
            self.set_planar_velocity(e, x, z);
        }
        if let Some(impact) = d.impact {
            self.set_impact_feedback(e, impact);
        }
        ok
    }
}

impl World {
    /// Turns a shape request into a concrete shape, sizing it from the entity's mesh and scale.
    fn resolve_shape(&self, e: Entity, spec: ShapeSpec) -> Shape {
        let Some(i) = self.dense(e) else { return Shape::Ball { radius: 0.5 } };
        let (scale, mesh) = (self.scale[i].abs(), self.mesh[i]);
        let ball = |r: Option<f32>| Shape::Ball {
            radius: r.unwrap_or(scale.max_element() / 2.0),
        };
        let cuboid = |h: Option<Vec3>| {
            let mut half = scale / 2.0;
            if mesh == MESH_PLANE {
                half.y = 0.05; // a plane gets a thin slab
            }
            Shape::Cuboid {
                half_extents: h.unwrap_or(half),
            }
        };
        match spec {
            ShapeSpec::FromMesh if mesh == MESH_SPHERE => ball(None),
            ShapeSpec::FromMesh => cuboid(None),
            ShapeSpec::Ball(r) => ball(r),
            ShapeSpec::Box(h) => cuboid(h),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn encoded(fill: impl FnOnce(&mut [f64])) -> Vec<f64> {
        let mut d = vec![0.0; DESC_LEN];
        fill(&mut d);
        d
    }

    #[test]
    fn decodes_only_flagged_fields() {
        let d = encoded(|d| {
            d[slot::FLAGS] = (flag::POSITION | flag::COLOR) as f64;
            d[slot::POSITION..slot::POSITION + 3].copy_from_slice(&[1.0, 2.0, 3.0]);
            d[slot::COLOR..slot::COLOR + 4].copy_from_slice(&[0.5, 0.25, 1.0, 1.0]);
            d[slot::VELOCITY] = 99.0; // not flagged: ignored
        });
        let desc = EntityDesc::decode(&d).unwrap();
        assert_eq!(desc.position, Some(Vec3::new(1.0, 2.0, 3.0)));
        assert_eq!(desc.color, Some([0.5, 0.25, 1.0, 1.0]));
        assert_eq!(desc.velocity, None);
        assert_eq!(
            desc,
            EntityDesc {
                position: desc.position,
                color: desc.color,
                ..Default::default()
            }
        );
    }

    #[test]
    fn decodes_removals_and_exact_ids() {
        let big = Entity((4000 << 20) | 12345); // needs more than an f32's 24 bits
        let d = encoded(|d| {
            d[slot::FLAGS] = (flag::PARENT | flag::FOLLOW | flag::PHYSICS | flag::IMPACT) as f64;
            d[slot::PARENT] = big.0 as f64;
            d[slot::FOLLOW] = -1.0;
            d[slot::PHYSICS] = 0.0;
            d[slot::IMPACT] = 0.0;
        });
        let desc = EntityDesc::decode(&d).unwrap();
        assert_eq!(desc.parent, Some(Some(big)));
        assert_eq!(desc.follow, Some(None));
        assert_eq!(desc.physics, Some(None));
        assert_eq!(desc.impact, Some(None));
    }

    #[test]
    fn rejects_malformed_input() {
        assert!(EntityDesc::decode(&[0.0; DESC_LEN - 1]).is_none(), "too short");
        assert!(EntityDesc::decode(&encoded(|d| d[0] = -1.0)).is_none(), "bad flags");
        let bad_kind = encoded(|d| {
            d[0] = flag::PHYSICS as f64;
            d[slot::PHYSICS] = 7.0;
        });
        assert!(EntityDesc::decode(&bad_kind).is_none());
        let bad_mesh = encoded(|d| {
            d[0] = flag::MESH as f64;
            d[slot::MESH] = 300.0;
        });
        assert!(EntityDesc::decode(&bad_mesh).is_none());
    }

    #[test]
    fn spawn_with_applies_everything_in_one_call() {
        let mut w = World::new(4);
        let physics = PhysicsRequest {
            desc: PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }),
            shape: ShapeSpec::FromMesh,
        };
        let e = w
            .spawn_with(&EntityDesc {
                mesh: Some(1),
                position: Some(Vec3::new(0.0, 3.0, 0.0)),
                color: Some([1.0, 0.0, 0.0, 1.0]),
                physics: Some(Some(physics)),
                lifetime: Some(5.0),
                ..Default::default()
            })
            .unwrap();
        assert_eq!(w.position(e), Some(Vec3::new(0.0, 3.0, 0.0)));
        assert_eq!(w.physics.bodies.len(), 1);
        w.update(0.0);
        assert_eq!(w.ranges()[2..4], [0, 1], "drawn as a sphere");
    }

    #[test]
    fn spawn_with_rolls_back_when_something_is_rejected() {
        let mut w = World::new(4);
        let bad = PhysicsRequest {
            desc: PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }),
            shape: ShapeSpec::Ball(Some(-1.0)),
        };
        assert!(
            w.spawn_with(&EntityDesc {
                physics: Some(Some(bad)),
                ..Default::default()
            })
            .is_none()
        );
        assert_eq!(w.len(), 0, "nothing left behind");
    }

    #[test]
    fn colliders_are_sized_from_mesh_and_scale_unless_given() {
        let mut w = World::new(4);
        let request = |shape| PhysicsRequest {
            desc: PhysicsDesc::new(BodyKind::Fixed, Shape::Ball { radius: 1.0 }),
            shape,
        };
        let ball = w
            .spawn_with(&EntityDesc {
                mesh: Some(1),
                scale: Some(Vec3::new(2.0, 3.0, 1.0)),
                ..Default::default()
            })
            .unwrap();
        assert_eq!(
            w.resolve_shape(ball, ShapeSpec::FromMesh),
            Shape::Ball { radius: 1.5 },
            "half the largest axis"
        );
        let plane = w
            .spawn_with(&EntityDesc {
                mesh: Some(2),
                scale: Some(Vec3::new(10.0, 1.0, 4.0)),
                ..Default::default()
            })
            .unwrap();
        assert_eq!(
            w.resolve_shape(plane, ShapeSpec::FromMesh),
            Shape::Cuboid {
                half_extents: Vec3::new(5.0, 0.05, 2.0)
            }
        );
        assert_eq!(
            w.resolve_shape(plane, ShapeSpec::Ball(Some(0.25))),
            Shape::Ball { radius: 0.25 },
            "explicit wins"
        );
        assert!(w.apply(
            plane,
            &EntityDesc {
                physics: Some(Some(request(ShapeSpec::FromMesh))),
                ..Default::default()
            }
        ));
        // Decoding: size <= 0 means "from scale".
        let mut d = vec![0.0; DESC_LEN];
        d[slot::FLAGS] = flag::PHYSICS as f64;
        d[slot::PHYSICS] = 1.0;
        d[slot::PHYSICS + 1] = 0.0; // ball, radius 0
        let decoded = EntityDesc::decode(&d).unwrap().physics.unwrap().unwrap();
        assert_eq!(decoded.shape, ShapeSpec::Ball(None));
    }

    #[test]
    fn apply_changes_and_removes() {
        let mut w = World::new(4);
        let e = w.spawn_with(&EntityDesc::default()).unwrap();
        let body = PhysicsRequest {
            desc: PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 }),
            shape: ShapeSpec::FromMesh,
        };
        assert!(w.apply(
            e,
            &EntityDesc {
                physics: Some(Some(body)),
                mesh: Some(2),
                ..Default::default()
            }
        ));
        assert_eq!(w.physics.bodies.len(), 1);
        assert!(w.apply(
            e,
            &EntityDesc {
                physics: Some(None),
                ..Default::default()
            }
        ));
        assert_eq!(w.physics.bodies.len(), 0);
        assert!(
            !w.apply(
                e,
                &EntityDesc {
                    mesh: Some(200),
                    ..Default::default()
                }
            ),
            "invalid mesh"
        );
        w.despawn(e);
        assert!(!w.apply(e, &EntityDesc::default()), "stale handle");
    }
}
