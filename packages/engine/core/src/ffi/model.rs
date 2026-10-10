//! C ABI: meshes, models, textures and fonts (global; shared by every world and renderer).

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

use crate::model::{self, LoadOptions};
use crate::{font, texture};

unsafe fn bytes<'a>(data: *const u8, len: usize) -> Option<&'a [u8]> {
    // SAFETY: caller passes a readable buffer of `len` bytes, used only during the call.
    (!data.is_null() && len > 0).then(|| unsafe { std::slice::from_raw_parts(data, len) })
}

/// Parses a glTF/GLB file (copied) and registers it. Returns its mesh id, or -1 if it can't be loaded.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_model_load(data: *const u8, len: usize, center: i32, fit: f32) -> i32 {
    let Some(bytes) = (unsafe { bytes(data, len) }) else { return -1 };
    let options = LoadOptions {
        center: center != 0,
        fit: if fit.is_finite() { fit } else { 0.0 },
    };
    model::load(bytes, options).map_or(-1, i32::from)
}

/// Vertex data: `engine_model_vertex_count` vertices of 11 floats (position, normal, color, uv).
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

/// The model's base color texture id, or -1.
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_texture(mesh: u32) -> i32 {
    u8::try_from(mesh)
        .ok()
        .and_then(model::get)
        .and_then(|m| m.texture)
        .map_or(-1, |t| t as i32)
}

/// A new mesh id that draws with `base`'s geometry (a built-in shape or registered mesh), so it can
/// have its own texture. Returns the id, or -1.
#[unsafe(no_mangle)]
pub extern "C" fn engine_mesh_alias(base: u32) -> i32 {
    u8::try_from(base).ok().map_or(-1, |b| model::alias(b).map_or(-1, i32::from))
}

/// Decodes a PNG or JPEG (copied). Returns the texture id, or -1.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_texture_load(data: *const u8, len: usize) -> i32 {
    let Some(bytes) = (unsafe { bytes(data, len) }) else { return -1 };
    texture::load(bytes).map_or(-1, |id| id as i32)
}

/// RGBA8 pixels, top row first (width * height * 4 bytes). Valid for the life of the process.
#[unsafe(no_mangle)]
pub extern "C" fn engine_texture_pixels(id: u32) -> *const u8 {
    texture::get(id).map_or(std::ptr::null(), |t| t.rgba.as_ptr())
}

/// Writes width and height to `out[0..2]`. Returns 1 for a known texture.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_texture_size(id: u32, out: *mut u32) -> i32 {
    let Some(t) = texture::get(id).filter(|_| !out.is_null()) else { return 0 };
    // SAFETY: caller passes room for 2 values.
    unsafe {
        *out = t.width;
        *out.add(1) = t.height;
    }
    1
}

/// Builds 3D glyph meshes for the UTF-8 `chars` from a TrueType/OpenType font (copied), extruded by
/// `depth` ems. Returns the font id, or -1.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_font_load(data: *const u8, len: usize, depth: f32, chars: *const u8, chars_len: usize) -> i32 {
    let (Some(bytes), Some(chars)) = (unsafe { bytes(data, len) }, unsafe { bytes(chars, chars_len) }) else {
        return -1;
    };
    let Ok(chars) = std::str::from_utf8(chars) else { return -1 };
    font::load(bytes, depth, chars).map_or(-1, |id| id as i32)
}

/// `[codepoint, mesh id (-1 = nothing drawn), advance in ems]` per glyph, as floats. Valid for the life
/// of the process. `engine_font_glyph_floats` gives the length.
#[unsafe(no_mangle)]
pub extern "C" fn engine_font_glyphs(font: u32) -> *const f32 {
    font::get(font).map_or(std::ptr::null(), |f| f.glyphs.as_ptr())
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_font_glyph_floats(font: u32) -> u32 {
    font::get(font).map_or(0, |f| f.glyphs.len() as u32)
}

/// Height of capital letters, in ems.
#[unsafe(no_mangle)]
pub extern "C" fn engine_font_cap_height(font: u32) -> f32 {
    font::get(font).map_or(0.7, |f| f.cap_height)
}

/// Copies the reason the last model, texture, font or alias load failed (NUL-terminated, truncated
/// to `cap`) into `out`. Returns the full message length in bytes (0 after a success).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_load_error(out: *mut u8, cap: usize) -> usize {
    let message = model::last_error();
    if !out.is_null() && cap > 0 {
        let n = message.len().min(cap - 1);
        // SAFETY: caller passes room for `cap` bytes.
        unsafe {
            std::ptr::copy_nonoverlapping(message.as_ptr(), out, n);
            *out.add(n) = 0;
        }
    }
    message.len()
}
