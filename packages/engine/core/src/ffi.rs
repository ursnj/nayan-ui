//! C ABI used by the native (JSI) layer. See `include/engine_core.h`.
//!
//! Safety contract for callers: a `World*` comes from `engine_world_new`, is used from one
//! thread at a time, and is released exactly once with `engine_world_free`. Capacity is fixed,
//! so every pointer returned by an `engine_world_*` getter stays valid until `engine_world_free`.

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, above

use crate::{Entity, NO_ENTITY, World};
use glam::{Quat, Vec3};

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
pub unsafe extern "C" fn engine_world_set_collider(w: *mut World, id: u32, radius: f32, layer: u32, mask: u32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_collider(Entity(id), radius, layer, mask);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_follow(w: *mut World, id: u32, target: u32, speed: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_follow(Entity(id), Entity(target), speed);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_bounds(w: *mut World, min_x: f32, min_z: f32, max_x: f32, max_z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_bounds(Vec3::new(min_x, 0.0, min_z), Vec3::new(max_x, 0.0, max_z));
    }
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

/// Collision pairs from the last update, as `[a0, b0, a1, b1, ...]` entity ids.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_events(w: *mut World) -> *const u32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.events().as_ptr())
}

/// Number of u32 values (2 per pair) valid in `engine_world_events`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_event_len(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.events().len() as u32)
}

/// 16 floats; first 3 hold the result of `engine_world_read_position`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_scratch(w: *mut World) -> *const f32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.scratch().as_ptr())
}
