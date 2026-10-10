//! C ABI: worlds and entities. Entities are created and changed with one call each, from an
//! encoded `EntityDesc` (see `world/desc.rs` and `include/engine_core.h`).

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

use crate::{ANIM_LEN, Animation, BURST_LEN, Burst, DESC_LEN, Entity, EntityDesc, NO_ENTITY, Vec3, World};

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

/// Spawns an entity from an encoded description (`desc` = `len` f64 values, see `EntityDesc`).
/// Returns the entity id, or `UINT32_MAX` if the world is full or the description is rejected.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_spawn_desc(w: *mut World, desc: *const f64, len: usize) -> u32 {
    let (Some(w), Some(d)) = (unsafe { world(w) }, unsafe { desc_slice(desc, len) }) else {
        return NO_ENTITY;
    };
    EntityDesc::decode(d).and_then(|d| w.spawn_with(&d)).map_or(NO_ENTITY, |e| e.0)
}

/// Changes an entity from an encoded description. Returns 1 if everything was applied, 0 if the
/// entity is gone, the description is malformed, or a field was rejected (the rest still apply).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_desc(w: *mut World, id: u32, desc: *const f64, len: usize) -> i32 {
    let (Some(w), Some(d)) = (unsafe { world(w) }, unsafe { desc_slice(desc, len) }) else {
        return 0;
    };
    EntityDesc::decode(d).is_some_and(|d| w.apply(Entity(id), &d)) as i32
}

unsafe fn desc_slice<'a>(desc: *const f64, len: usize) -> Option<&'a [f64]> {
    unsafe { doubles(desc, len, DESC_LEN) }
}

unsafe fn doubles<'a>(data: *const f64, len: usize, min: usize) -> Option<&'a [f64]> {
    // SAFETY: caller passes `len` readable f64s, used only during the call.
    (!data.is_null() && len >= min).then(|| unsafe { std::slice::from_raw_parts(data, len) })
}

/// Starts an animation from an encoded description (`ENGINE_ANIM_LEN` doubles). Returns 1 if it started.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_animate(w: *mut World, id: u32, data: *const f64, len: usize) -> i32 {
    let (Some(w), Some(d)) = (unsafe { world(w) }, unsafe { doubles(data, len, ANIM_LEN) }) else {
        return 0;
    };
    Animation::decode(d).is_some_and(|a| w.animate(Entity(id), &a)) as i32
}

/// Stops the entity's animation where it is. Returns 1 if it had one.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_stop_animation(w: *mut World, id: u32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.stop_animation(Entity(id))) as i32
}

/// Spawns a particle burst (`ENGINE_BURST_LEN` doubles). Returns how many particles were spawned.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_burst(w: *mut World, data: *const f64, len: usize) -> u32 {
    let (Some(w), Some(d)) = (unsafe { world(w) }, unsafe { doubles(data, len, BURST_LEN) }) else {
        return 0;
    };
    Burst::decode(d).map_or(0, |b| w.burst(&b))
}

/// Nearest pickable entity along a ray, as last drawn. Returns it or `UINT32_MAX`; on a hit
/// scratch[0..4] = distance, point xyz.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_pick(w: *mut World, ox: f32, oy: f32, oz: f32, dx: f32, dy: f32, dz: f32) -> u32 {
    unsafe { world(w) }
        .and_then(|w| w.pick(Vec3::new(ox, oy, oz), Vec3::new(dx, dy, dz)))
        .map_or(NO_ENTITY, |e| e.0)
}

/// Returns 1 if the entity existed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_despawn(w: *mut World, id: u32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.despawn(Entity(id))) as i32
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

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_bounds(w: *mut World, min_x: f32, min_z: f32, max_x: f32, max_z: f32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_bounds(Vec3::new(min_x, 0.0, min_z), Vec3::new(max_x, 0.0, max_z));
    }
}

/// Entity used to pan/attenuate impact sounds; UINT32_MAX clears it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_listener(w: *mut World, id: u32) {
    if let Some(w) = unsafe { world(w) } {
        w.set_listener((id != NO_ENTITY).then_some(Entity(id)));
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

/// Writes the entity position to the scratch buffer (`engine_world_scratch`): simulated (relative to
/// its parent), or with `rendered` != 0 where it was last drawn, in world space. Returns 1 on success.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_read_position(w: *mut World, id: u32, rendered: i32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.read_position(Entity(id), rendered != 0)) as i32
}

/// Writes the entity velocity to the scratch buffer. Returns 1 on success.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_read_velocity(w: *mut World, id: u32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.read_velocity(Entity(id))) as i32
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

/// `capacity * 4` floats: texture region (u0 v0 u1 v1), same instance order as the matrices.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_regions(w: *mut World) -> *const f32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.regions().as_ptr())
}

/// Entities whose animation ended during the last update (`capacity` u32s of room).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_done(w: *mut World) -> *const u32 {
    unsafe { world(w) }.map_or(std::ptr::null(), |w| w.done().as_ptr())
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_done_len(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.done().len() as u32)
}

/// `MAX_MESHES * 4` u32s: `[first, count]` per mesh id for opaque instances, then for transparent ones.
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
