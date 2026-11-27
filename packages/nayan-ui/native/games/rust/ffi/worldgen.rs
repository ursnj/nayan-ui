//! C ABI for data-driven procedural worlds (see `worldgen`). Handles are u32 (0 = none). Building
//! is reentrant and may run on any thread; queries on one world may come from any thread.
#![allow(clippy::missing_safety_doc)]

use super::modelling::{EngineGeometry, result};
use crate::worldgen::{self, mesh};

unsafe fn text<'a>(data: *const u8, len: usize) -> Option<&'a str> {
    if len == 0 {
        return Some("");
    }
    if data.is_null() {
        return None;
    }
    std::str::from_utf8(unsafe { std::slice::from_raw_parts(data, len) }).ok()
}

/// Copies `value` (NUL-terminated) into `out` when it has room; returns its length either way.
unsafe fn copy_out(value: &[u8], out: *mut u8, capacity: usize) -> usize {
    if !out.is_null() && capacity > value.len() {
        unsafe {
            std::ptr::copy_nonoverlapping(value.as_ptr(), out, value.len());
            *out.add(value.len()) = 0;
        }
    }
    value.len()
}

/// Copies up to `capacity` doubles into `out`; returns how many there are.
unsafe fn copy_f64(values: &[f64], out: *mut f64, capacity: usize) -> usize {
    if !out.is_null() && capacity >= values.len() {
        unsafe { std::ptr::copy_nonoverlapping(values.as_ptr(), out, values.len()) };
    }
    values.len()
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_build(recipe: *const u8, len: usize, key: *const u8, key_len: usize, prepare_terrain: i32) -> u32 {
    let (Some(recipe), Some(key)) = (unsafe { text(recipe, len) }, unsafe { text(key, key_len) }) else {
        return 0;
    };
    worldgen::build(recipe, key, prepare_terrain != 0)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_error(out: *mut u8, capacity: usize) -> usize {
    unsafe { copy_out(worldgen::last_error().as_bytes(), out, capacity) }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_kept(key: *const u8, len: usize) -> i32 {
    unsafe { text(key, len) }.is_some_and(worldgen::kept) as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_free(world: u32) {
    worldgen::free(world);
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_info(world: u32, out: *mut u8, capacity: usize) -> usize {
    let info = worldgen::with(world, worldgen::info).unwrap_or_default();
    unsafe { copy_out(info.as_bytes(), out, capacity) }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_layer(world: u32, name: *const u8, len: usize, out: *mut f64, capacity: usize) -> usize {
    let Some(name) = (unsafe { text(name, len) }) else { return 0 };
    worldgen::with(world, |w| {
        let data = w.generated.layers.iter().find(|l| l.name == name).map_or(&[][..], |l| &l.data[..]);
        unsafe { copy_f64(data, out, capacity) }
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_reachable(world: u32, out: *mut f64, capacity: usize) -> usize {
    worldgen::with(world, |w| {
        let flat: Vec<f64> = w.generated.reachable.iter().flatten().copied().collect();
        unsafe { copy_f64(&flat, out, capacity) }
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_overview(world: u32, out: *mut u8, capacity: usize) -> usize {
    worldgen::with(world, |w| {
        let cells = &w.generated.overview;
        if !out.is_null() && capacity >= cells.len() {
            unsafe { std::ptr::copy_nonoverlapping(cells.as_ptr(), out, cells.len()) };
        }
        cells.len()
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_pick(world: u32, run: u32) -> i32 {
    worldgen::with_mut(world, |w| w.repick(run)).unwrap_or(false) as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_terrain(world: u32, material: u32) -> *mut EngineGeometry {
    result(
        worldgen::with(world, |w| w.take_terrain(material))
            .flatten()
            .ok_or_else(|| "unknown world or terrain material".to_string()),
    )
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_mesh(recipe: *const u8, len: usize) -> *mut EngineGeometry {
    let Some(recipe) = (unsafe { text(recipe, len) }) else {
        return result(Err("invalid mesh recipe text".into()));
    };
    result(
        serde_json::from_str::<mesh::MeshSpec>(recipe)
            .map_err(|e| format!("mesh recipe: {e}"))
            .and_then(|spec| mesh::build(&spec)),
    )
}

/// Recolors `vertex_count` vertices (11 floats each) in place by a field function of their surface
/// point (inputs u, v, x, y, z, nx, ny, nz; three outputs). Returns 0 on failure (see `engine_worldgen_error`).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_paint(vertices: *mut f32, vertex_count: usize, recipe: *const u8, len: usize) -> i32 {
    let Some(recipe) = (unsafe { text(recipe, len) }) else { return 0 };
    if vertices.is_null() || vertex_count > 50_000_000 {
        return 0;
    }
    // SAFETY: the caller passes vertex_count * 11 writable floats, used only during the call.
    let v = unsafe { std::slice::from_raw_parts_mut(vertices, vertex_count * crate::assets::geometry::VERTEX_FLOATS) };
    let result = serde_json::from_str::<worldgen::paint::FieldFn>(recipe)
        .map_err(|e| format!("paint recipe: {e}"))
        .and_then(|color| worldgen::paint::paint_surface(v, 0..vertex_count, &color));
    match result {
        Ok(()) => 1,
        Err(e) => {
            worldgen::set_error(e);
            0
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_ground(world: u32, x: f64, z: f64) -> f64 {
    worldgen::with(world, |w| w.ground(x, z)).unwrap_or(f64::NAN)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_surface(world: u32, x: f64, z: f64) -> i32 {
    worldgen::with(world, |w| w.surface(x, z) as i32).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_platform(world: u32, x: f64, z: f64) -> i32 {
    worldgen::with(world, |w| w.platform(x, z).map_or(-1, |i| i as i32)).unwrap_or(-1)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_walkable(world: u32, x: f64, z: f64, radius: f64) -> i32 {
    worldgen::with(world, |w| w.walkable(x, z, radius) as i32).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_clearance(world: u32, x: f64, z: f64, radius: f64) -> f64 {
    worldgen::with(world, |w| w.clearance(x, z, radius)).unwrap_or(f64::NEG_INFINITY)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_solid_clearance(world: u32, x: f64, z: f64, radius: f64, bottom: f64, top: f64) -> f64 {
    worldgen::with(world, |w| w.solid_clearance(x, z, radius, bottom, top)).unwrap_or(f64::INFINITY)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_field_index(world: u32, name: *const u8, len: usize) -> i32 {
    let Some(name) = (unsafe { text(name, len) }) else { return -1 };
    worldgen::with(world, |w| w.field_index(name).map_or(-1, |i| i as i32)).unwrap_or(-1)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_worldgen_field(world: u32, field: u32, x: f64, z: f64) -> f64 {
    worldgen::with(world, |w| w.field(field, x, z)).unwrap_or(f64::NAN)
}

/// Writes the ground tilt quaternion [x, y, z, w] to `out` (4 doubles).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_tilt(world: u32, x: f64, z: f64, yaw: f64, out: *mut f64) {
    let q = worldgen::with(world, |w| w.tilt(x, z, yaw)).unwrap_or([0.0, 0.0, 0.0, 1.0]);
    if !out.is_null() {
        unsafe { std::ptr::copy_nonoverlapping(q.as_ptr(), out, 4) };
    }
}

#[unsafe(no_mangle)]
#[allow(clippy::too_many_arguments)]
pub extern "C" fn engine_worldgen_sight(world: u32, ax: f64, az: f64, bx: f64, bz: f64, radius: f64, step: f64, rise: f64) -> i32 {
    worldgen::with(world, |w| w.sight([ax, az], [bx, bz], radius, step, rise) as i32).unwrap_or(0)
}

/// Moves a walker from `point` (2 doubles, updated in place); `bodies` holds `count` × [x, z, radius].
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_move(world: u32, point: *mut f64, dx: f64, dz: f64, radius: f64, bodies: *const f64, count: usize) {
    if point.is_null() || count > 100_000 || (count > 0 && bodies.is_null()) {
        return;
    }
    let start = unsafe { [*point, *point.add(1)] };
    let list: Vec<[f64; 3]> = if count == 0 {
        Vec::new()
    } else {
        unsafe { std::slice::from_raw_parts(bodies, count * 3) }
            .chunks(3)
            .map(|b| [b[0], b[1], b[2]])
            .collect()
    };
    if let Some(end) = worldgen::with(world, |w| w.move_walker(start, dx, dz, radius, &list)) {
        unsafe {
            *point = end[0];
            *point.add(1) = end[1];
        }
    }
}
