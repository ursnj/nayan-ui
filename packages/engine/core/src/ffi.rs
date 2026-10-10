//! C ABI used by the native (JSI) layer. See `include/engine_core.h`.
//!
//! Safety contract for callers: a `World*` comes from `engine_world_new`, is used from one
//! thread at a time, and is released exactly once with `engine_world_free`. The pointer from
//! `engine_world_matrices` stays valid until `engine_world_free`, because capacity is fixed.

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, above

use crate::{Entity, World};
use glam::{Quat, Vec3};

unsafe fn world<'a>(w: *mut World) -> Option<&'a mut World> {
    // SAFETY: caller contract above; null is handled by `as_mut`.
    unsafe { w.as_mut() }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_world_new(capacity: u32) -> *mut World {
    Box::into_raw(Box::new(World::with_capacity(capacity as usize)))
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_free(w: *mut World) {
    if !w.is_null() {
        // SAFETY: produced by `Box::into_raw` in `engine_world_new`, freed once.
        drop(unsafe { Box::from_raw(w) });
    }
}

/// Capacity is fixed at `engine_world_new` so the matrix pointer never moves.
/// Returns the new entity id, or `u32::MAX` if `w` is null or the world is full.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_spawn(
    w: *mut World,
    x: f32,
    y: f32,
    z: f32,
    sx: f32,
    sy: f32,
    sz: f32,
) -> u32 {
    match unsafe { world(w) } {
        Some(w) if w.has_room() => w.spawn(Vec3::new(x, y, z), Vec3::new(sx, sy, sz)).0,
        _ => u32::MAX,
    }
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
pub unsafe extern "C" fn engine_world_update(w: *mut World, dt: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.update(dt);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_count(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.len() as u32)
}

/// Pointer to `count * 16` column-major f32s (null if `w` is null).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_matrices(w: *mut World) -> *const f32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.matrices().as_ptr())
}
