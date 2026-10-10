//! C ABI: worlds, entities, physics, impact feedback.

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

use crate::{BodyKind, Entity, ImpactFeedback, NO_ENTITY, PhysicsDesc, Quat, Shape, Vec3, World};

unsafe fn world<'a>(w: *mut World) -> Option<&'a mut World> {
    // SAFETY: caller contract above; null is handled by `as_mut`.
    unsafe { w.as_mut() }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_world_new(capacity: u32) -> *mut World {
    Box::into_raw(Box::new(World::new(capacity as usize)))
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_free(w: *mut World) {
    if !w.is_null() {
        // SAFETY: produced by `Box::into_raw` in `engine_world_new`, freed once.
        drop(unsafe { Box::from_raw(w) });
    }
}

/// Returns the entity id, or `UINT32_MAX` if `w` is null, the world is full, or `mesh` is invalid.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_spawn(
    w: *mut World,
    mesh: u32,
    x: f32,
    y: f32,
    z: f32,
    sx: f32,
    sy: f32,
    sz: f32,
    r: f32,
    g: f32,
    b: f32,
    a: f32,
) -> u32 {
    let Some(w) = (unsafe { world(w) }) else { return NO_ENTITY };
    let Ok(mesh) = u8::try_from(mesh) else { return NO_ENTITY };
    w.spawn(mesh, Vec3::new(x, y, z), Vec3::new(sx, sy, sz), [r, g, b, a])
        .map_or(NO_ENTITY, |e| e.0)
}

/// Returns 1 if the entity existed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_despawn(w: *mut World, id: u32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.despawn(Entity(id))) as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_position(w: *mut World, id: u32, x: f32, y: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_position(Entity(id), Vec3::new(x, y, z));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_rotation(w: *mut World, id: u32, x: f32, y: f32, z: f32, rw: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_rotation(Entity(id), Quat::from_xyzw(x, y, z, rw));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_scale(w: *mut World, id: u32, x: f32, y: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_scale(Entity(id), Vec3::new(x, y, z));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_color(w: *mut World, id: u32, r: f32, g: f32, b: f32, a: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_color(Entity(id), [r, g, b, a]);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_velocity(w: *mut World, id: u32, x: f32, y: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_velocity(Entity(id), Vec3::new(x, y, z));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_angular_velocity(w: *mut World, id: u32, x: f32, y: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_angular_velocity(Entity(id), Vec3::new(x, y, z));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_oscillation(
    w: *mut World,
    id: u32,
    ax: f32,
    ay: f32,
    az: f32,
    frequency: f32,
    phase: f32,
) {
    if let Some(w) = unsafe { world(w) } {
        w.set_oscillation(Entity(id), Vec3::new(ax, ay, az), frequency, phase);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_follow(w: *mut World, id: u32, target: u32, speed: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_follow(Entity(id), Entity(target), speed);
    }
}

/// Attaches `id` to `parent` (`UINT32_MAX` detaches). Returns 1 on success.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_parent(w: *mut World, id: u32, parent: u32) -> i32 {
    let parent = (parent != NO_ENTITY).then_some(Entity(parent));
    unsafe { world(w) }.is_some_and(|w| w.set_parent(Entity(id), parent)) as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_lifetime(w: *mut World, id: u32, seconds: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_lifetime(Entity(id), seconds);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_bounds(w: *mut World, min_x: f32, min_z: f32, max_x: f32, max_z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_bounds(Vec3::new(min_x, 0.0, min_z), Vec3::new(max_x, 0.0, max_z));
    }
}

/// Physics description passed across the C ABI. Mirrors `EnginePhysicsDesc` in the header.
#[repr(C)]
pub struct EnginePhysicsDesc {
    /// 0 = remove physics, 1 = dynamic, 2 = kinematic, 3 = fixed.
    pub kind: u32,
    /// 0 = ball (size[0] = radius), 1 = box (size = half extents).
    pub shape: u32,
    pub size: [f32; 3],
    pub layer: u32,
    pub mask: u32,
    pub sensor: u32,
    pub friction: f32,
    pub restitution: f32,
    pub density: f32,
    pub linear_damping: f32,
    pub angular_damping: f32,
    pub gravity_scale: f32,
    pub lock_rotations: u32,
    pub ccd: u32,
}

/// Gives the entity a rigid body + collider (replacing any), or removes them when `kind` is 0.
/// Returns 1 on success, 0 for a stale id, null pointer or invalid description.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_physics(w: *mut World, id: u32, desc: *const EnginePhysicsDesc) -> i32 {
    let (Some(w), Some(d)) = (unsafe { world(w) }, unsafe { desc.as_ref() }) else { return 0 };
    let kind = match d.kind {
        0 => return w.set_physics(Entity(id), None) as i32,
        1 => BodyKind::Dynamic,
        2 => BodyKind::Kinematic,
        3 => BodyKind::Fixed,
        _ => return 0,
    };
    let shape = match d.shape {
        0 => Shape::Ball { radius: d.size[0] },
        1 => Shape::Cuboid { half_extents: Vec3::from_array(d.size) },
        _ => return 0,
    };
    let desc = PhysicsDesc {
        kind,
        shape,
        layer: d.layer,
        mask: d.mask,
        sensor: d.sensor != 0,
        friction: d.friction,
        restitution: d.restitution,
        density: d.density,
        linear_damping: d.linear_damping,
        angular_damping: d.angular_damping,
        gravity_scale: d.gravity_scale,
        lock_rotations: d.lock_rotations != 0,
        ccd: d.ccd != 0,
    };
    w.set_physics(Entity(id), Some(desc)) as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_planar_velocity(w: *mut World, id: u32, x: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_planar_velocity(Entity(id), x, z);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_apply_impulse(w: *mut World, id: u32, x: f32, y: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.apply_impulse(Entity(id), Vec3::new(x, y, z));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_gravity(w: *mut World, x: f32, y: f32, z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_gravity(Vec3::new(x, y, z));
    }
}

/// Returns the hit entity or `UINT32_MAX`; on a hit, scratch[0..7] = distance, normal, point.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_raycast(
    w: *mut World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
    max_distance: f32,
    mask: u32,
) -> u32 {
    unsafe { world(w) }
        .and_then(|w| w.raycast(Vec3::new(ox, oy, oz), Vec3::new(dx, dy, dz), max_distance, mask))
        .map_or(NO_ENTITY, |e| e.0)
}

/// Writes the entity velocity to the scratch buffer. Returns 1 on success.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_read_velocity(w: *mut World, id: u32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.read_velocity(Entity(id))) as i32
}

/// Writes the entity position to the scratch buffer (`engine_world_scratch`). Returns 1 on success.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_read_position(w: *mut World, id: u32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.read_position(Entity(id))) as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_update(w: *mut World, dt: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.update(dt);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_count(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.len() as u32)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_capacity(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.capacity() as u32)
}

/// `capacity * 16` column-major floats, grouped by mesh. Null if `w` is null.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_matrices(w: *mut World) -> *const f32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.matrices().as_ptr())
}

/// `capacity * 4` floats (rgba), same instance order as the matrices.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_colors(w: *mut World) -> *const f32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.colors().as_ptr())
}

/// `MAX_MESHES * 2` u32s: `[first, count]` per mesh id.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_ranges(w: *mut World) -> *const u32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.ranges().as_ptr())
}

/// Collision events from the last update, 4 u32s each: `[entity_a, entity_b, flags, speed bits]`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_events(w: *mut World) -> *const u32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.events().as_ptr())
}

/// Number of u32 values (4 per event) valid in `engine_world_events`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_event_len(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.events().len() as u32)
}

/// 16 floats written by `read_position`, `read_velocity` and `raycast`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_scratch(w: *mut World) -> *const f32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.scratch().as_ptr())
}

/// Sound and haptic the core plays when `id` starts touching something (see `ImpactFeedback`).
/// `sound` = UINT32_MAX for haptics only; `enabled` = 0 removes it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_impact_feedback(
    w: *mut World,
    id: u32,
    enabled: i32,
    sound: u32,
    min_speed: f32,
    max_speed: f32,
    volume: f32,
    haptic: f32,
) {
    if let Some(w) = unsafe { world(w) } {
        let feedback = (enabled != 0).then_some(ImpactFeedback {
            sound: (sound != NO_ENTITY).then_some(sound),
            min_speed,
            max_speed,
            volume,
            haptic,
        });
        w.set_impact_feedback(Entity(id), feedback);
    }
}

/// Entity used to pan/attenuate impact sounds; UINT32_MAX clears it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_listener(w: *mut World, id: u32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_listener((id != NO_ENTITY).then_some(Entity(id)));
    }
}
