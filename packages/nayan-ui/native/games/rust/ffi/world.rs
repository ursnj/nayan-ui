//! C ABI: worlds and entities. Entities are created and changed with one call each, from an
//! encoded `EntityDesc` (see `world/desc.rs` and `include/engine_core.h`).

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

use crate::{ANIM_HEADER, Animation, BURST_LEN, Burst, DESC_LEN, Entity, EntityDesc, NO_ENTITY, Vec3, World};

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

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_transforms(w: *mut World, data: *const f64, len: usize, count: usize) -> u32 {
    let (Some(w), Some(data)) = (unsafe { world(w) }, unsafe { doubles(data, len, 0) }) else {
        return 0;
    };
    let mut desc = [0.0; DESC_LEN];
    let mut applied = 0;
    for row in data.chunks_exact(16).take(count) {
        if !row[0].is_finite()
            || row[0] < 0.0
            || row[0] >= NO_ENTITY as f64
            || row[0].fract() != 0.0
            || !row[1].is_finite()
            || row[1] < 0.0
            || row[1] > 30.0
            || row[1].fract() != 0.0
            || row[1] as u32 & !30 != 0
        {
            continue;
        }
        desc[0] = row[1];
        desc[2..16].copy_from_slice(&row[2..16]);
        if EntityDesc::decode(&desc).is_some_and(|d| w.apply(Entity(row[0] as u32), &d)) {
            applied += 1;
        }
    }
    applied
}

#[cfg(test)]
mod transform_tests {
    use super::*;

    #[test]
    fn batches_match_sequential_updates_and_reject_bad_records() {
        let mut batch = World::new(4);
        let mut scalar = World::new(4);
        let a = batch.spawn(0, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        let b = scalar.spawn(0, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        let records = [
            a.0 as f64, 30., 1., 2., 3., 0., 0., 0., 1., 2., 3., 4., 0.2, 0.4, 0.6, 1., a.0 as f64, 2., 7., 8., 9., 0., 0., 0., 0., 0., 0., 0., 0.,
            0., 0., 0.,
        ];
        let mut desc = [0.0; DESC_LEN];
        for row in records.chunks_exact(16) {
            desc[0] = row[1];
            desc[2..16].copy_from_slice(&row[2..16]);
            assert!(scalar.apply(b, &EntityDesc::decode(&desc).unwrap()));
        }
        assert_eq!(
            unsafe { engine_world_set_transforms(&mut batch, records.as_ptr(), records.len(), 1000) },
            2
        );
        batch.update(0.0);
        scalar.update(0.0);
        assert_eq!(batch.matrices(), scalar.matrices());
        assert_eq!(batch.colors(), scalar.colors());
        let invalid = [f64::NAN; 16];
        assert_eq!(unsafe { engine_world_set_transforms(&mut batch, invalid.as_ptr(), 16, 1) }, 0);
        assert_eq!(unsafe { engine_world_set_transforms(&mut batch, std::ptr::null(), 16, 1) }, 0);
        assert_eq!(batch.position(a), Some(Vec3::new(7., 8., 9.)));
    }
}

unsafe fn doubles<'a>(data: *const f64, len: usize, min: usize) -> Option<&'a [f64]> {
    // SAFETY: caller passes `len` readable f64s, used only during the call.
    (!data.is_null() && len >= min).then(|| unsafe { std::slice::from_raw_parts(data, len) })
}

/// Starts an animation from an encoded description (header, entity ids, keyframes; see the header
/// file). Returns its id (reported by `engine_world_done` when it ends), or 0 if nothing started.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_animate(w: *mut World, data: *const f64, len: usize) -> u32 {
    let (Some(w), Some(d)) = (unsafe { world(w) }, unsafe { doubles(data, len, ANIM_HEADER) }) else {
        return 0;
    };
    Animation::decode(d).and_then(|a| w.animate(&a)).unwrap_or(0)
}

/// Stops every animation on the entity where it is. Returns 1 if it had any.
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

/// Starts a timer firing `seconds` from now; its id is reported in `done`. Returns the id, or 0.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_after(w: *mut World, seconds: f32) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.after(seconds))
}

/// Drops every pending timer. Returns how many were dropped.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_cancel_timers(w: *mut World) -> u32 {
    unsafe { world(w) }.map_or(0, |w| w.cancel_timers() as u32)
}

/// Score / lives / clock operation (see `scoreboard::op`). Returns the score after it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_scoreboard(w: *mut World, op: u32, a: f64, b: f64) -> f64 {
    unsafe { world(w) }.map_or(0.0, |w| w.scoreboard.apply(op, a, b))
}

/// The scoreboard state (ENGINE_SCOREBOARD_LEN doubles), valid until engine_world_free. JS may
/// clear the flags slot after reading it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_scoreboard_state(w: *mut World) -> *mut f64 {
    unsafe { world(w) }.map_or(std::ptr::null_mut(), |w| w.scoreboard.state.as_mut_ptr())
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

/// Ids of animations that ended since the last update began (room for `capacity * 5 + 64` u32s).
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

// ── Camera math ──────────────────────────────────────────────────────────

/// Stores the view-projection matrix (16 column-major floats) and view size in points.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_set_view(w: *mut World, view_proj: *const f32, width: f32, height: f32) {
    if let (Some(w), false) = (unsafe { world(w) }, view_proj.is_null()) {
        let vp = unsafe { &*(view_proj as *const [f32; 16]) };
        w.set_view(vp, width, height);
    }
}

/// World-space ray through a view point. Writes origin xyz + direction xyz into scratch[0..6].
/// Returns 1 on success, 0 if no view has been set.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_screen_ray(w: *mut World, x: f32, y: f32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.screen_ray(x, y)) as i32
}

/// Where a view point lands on a plane. Writes the world point into scratch[0..3].
/// Returns 1 on success, 0 if behind camera, edge-on or no view.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_screen_to_world(
    w: *mut World,
    x: f32,
    y: f32,
    ppx: f32,
    ppy: f32,
    ppz: f32,
    pnx: f32,
    pny: f32,
    pnz: f32,
) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.screen_to_world(x, y, Vec3::new(ppx, ppy, ppz), Vec3::new(pnx, pny, pnz))) as i32
}

/// Where a world position appears on screen (points from top-left). Writes into scratch[0..2].
/// Returns 1 on success, 0 if behind the camera or no view.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_to_screen(w: *mut World, x: f32, y: f32, z: f32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.to_screen(Vec3::new(x, y, z))) as i32
}

/// Like pick, but takes a screen point (in points) instead of a world ray.
/// Returns the hit entity or `UINT32_MAX`; on a hit scratch[0..4] = distance, point xyz.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_pick_screen(w: *mut World, x: f32, y: f32) -> u32 {
    unsafe { world(w) }.and_then(|w| w.pick_screen(x, y)).map_or(NO_ENTITY, |e| e.0)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_play_clip(
    w: *mut World,
    entity: u32,
    name: *const u8,
    name_len: usize,
    looping: i32,
    speed: f32,
    fade: f32,
    time: f32,
) -> i32 {
    let Some(w) = (unsafe { world(w) }) else { return 0 };
    if name.is_null() {
        return 0;
    }
    let Ok(name) = std::str::from_utf8(unsafe { std::slice::from_raw_parts(name, name_len) }) else {
        return 0;
    };
    w.play_clip(Entity(entity), name, looping != 0, speed, fade, time) as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_stop_clip(w: *mut World, entity: u32, reset: i32) -> i32 {
    unsafe { world(w) }.is_some_and(|w| w.stop_clip(Entity(entity), reset != 0)) as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_world_skin_points(w: *mut World, entity: u32, indices: *const u32, count: usize, out: *mut f32, after: f32) -> i32 {
    let Some(w) = (unsafe { world(w) }) else { return 0 };
    if indices.is_null() || out.is_null() || count > 1_000_000 {
        return 0;
    }
    let (indices, out) = unsafe { (std::slice::from_raw_parts(indices, count), std::slice::from_raw_parts_mut(out, count * 3)) };
    w.skin_points(Entity(entity), indices, out, after) as i32
}
