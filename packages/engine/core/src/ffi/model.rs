//! C ABI: 3D models (global; shared by every world and renderer).

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

use crate::model::{self, LoadOptions};

/// Parses a glTF/GLB file (copied) and registers it. Returns its mesh id, or -1 if it can't be loaded.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_model_load(data: *const u8, len: usize, center: i32, fit: f32) -> i32 {
    if data.is_null() || len == 0 {
        return -1;
    }
    // SAFETY: caller passes a readable buffer of `len` bytes, used only during this call.
    let bytes = unsafe { std::slice::from_raw_parts(data, len) };
    let options = LoadOptions {
        center: center != 0,
        fit: if fit.is_finite() { fit } else { 0.0 },
    };
    model::load(bytes, options).map_or(-1, i32::from)
}

/// Vertex data: `engine_model_vertex_count` vertices of 9 floats (position, normal, color).
/// Valid for the life of the process. Null for an unknown mesh id.
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_vertices(mesh: u32) -> *const f32 {
    u8::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(std::ptr::null(), |m| m.vertices.as_ptr())
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_model_vertex_count(mesh: u32) -> u32 {
    u8::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(0, |m| (m.vertices.len() / model::VERTEX_FLOATS) as u32)
}

/// Triangle indices (u32). Valid for the life of the process. Null for an unknown mesh id.
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_indices(mesh: u32) -> *const u32 {
    u8::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(std::ptr::null(), |m| m.indices.as_ptr())
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_model_index_count(mesh: u32) -> u32 {
    u8::try_from(mesh).ok().and_then(model::get).map_or(0, |m| m.indices.len() as u32)
}

/// Writes the model's size (full width, height, depth) to `out[0..3]`. Returns 1 for a known model.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_model_size(mesh: u32, out: *mut f32) -> i32 {
    let Some(model) = u8::try_from(mesh).ok().and_then(model::get) else {
        return 0;
    };
    if out.is_null() {
        return 0;
    }
    let size = model.half_extents * 2.0;
    // SAFETY: caller passes room for 3 floats.
    unsafe { std::ptr::copy_nonoverlapping(size.to_array().as_ptr(), out, 3) };
    1
}
