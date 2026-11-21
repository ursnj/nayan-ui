//! C ABI: meshes, models, textures and fonts (global; shared by every world and renderer).

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

#[cfg(feature = "games")]
use crate::assets::model::{self, LoadOptions};
#[cfg(any(feature = "image-codecs", feature = "drawing"))]
use crate::assets::texture;
#[cfg(feature = "games")]
use crate::assets::{font, geometry, shape};
#[cfg(feature = "games")]
use std::sync::Mutex;

#[cfg(feature = "image-codecs")]
unsafe fn bytes<'a>(data: *const u8, len: usize) -> Option<&'a [u8]> {
    // SAFETY: caller passes a readable buffer of `len` bytes, used only during the call.
    (!data.is_null() && len > 0).then(|| unsafe { std::slice::from_raw_parts(data, len) })
}

/// Parses a glTF/GLB file (copied) and registers it. Returns its mesh id, or -1 if it can't be loaded.
#[cfg(feature = "games")]
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
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_vertices(mesh: u32) -> *const f32 {
    crate::MeshId::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(std::ptr::null(), |m| m.vertices.as_ptr())
}

#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_vertex_count(mesh: u32) -> u32 {
    crate::MeshId::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(0, |m| (m.vertices.len() / model::VERTEX_FLOATS) as u32)
}

/// Triangle indices (u32). Valid for the life of the process. Null for an unknown mesh id.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_indices(mesh: u32) -> *const u32 {
    crate::MeshId::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(std::ptr::null(), |m| m.indices.as_ptr())
}

#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_index_count(mesh: u32) -> u32 {
    crate::MeshId::try_from(mesh)
        .ok()
        .and_then(model::get)
        .map_or(0, |m| m.indices.len() as u32)
}

/// Bakes model `mesh` into a new texture, shaded as the renderer would under `spec` (`BakeSpec`
/// JSON: size, light, ambient, lightColor, sky, shine, supersample, padding). Writes [texture id,
/// center x, center y, extent] to `out` (4 floats). Returns 1, or 0 (see `engine_load_error`).
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_model_bake(mesh: u32, spec: *const u8, len: usize, out: *mut f32) -> i32 {
    let (Some(spec), false) = (unsafe { bytes(spec, len) }, out.is_null()) else {
        return 0;
    };
    let result = std::str::from_utf8(spec)
        .map_err(|_| "bake: spec is not UTF-8".to_string())
        .and_then(|text| serde_json::from_str::<crate::assets::bake::BakeSpec>(text).map_err(|e| format!("bake: {e}")))
        .and_then(|spec| {
            let mesh = crate::MeshId::try_from(mesh).map_err(|_| "bake: bad mesh id".to_string())?;
            crate::assets::bake::bake(mesh, &spec)
        });
    match crate::assets::record_error(result) {
        Ok(baked) => {
            // SAFETY: the caller passes room for 4 floats.
            unsafe { std::ptr::copy_nonoverlapping([baked.texture as f32, baked.center[0], baked.center[1], baked.extent].as_ptr(), out, 4) };
            1
        }
        Err(_) => 0,
    }
}
/// Whether a baked picture is kept in the engine's cache under `key` (see `BakeSpec::key`).
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_bake_kept(key: *const u8, len: usize) -> i32 {
    unsafe { bytes(key, len) }
        .and_then(|k| std::str::from_utf8(k).ok())
        .is_some_and(crate::assets::bake::kept) as i32
}
/// Writes the model's size (full width, height, depth) to `out[0..3]`. Returns 1 for a known model.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_model_size(mesh: u32, out: *mut f32) -> i32 {
    let Some(model) = crate::MeshId::try_from(mesh).ok().and_then(model::get) else {
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
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_model_texture(mesh: u32) -> i32 {
    crate::MeshId::try_from(mesh)
        .ok()
        .and_then(model::get)
        .and_then(|m| m.texture)
        .map_or(-1, |t| t as i32)
}

/// A new mesh id that draws with `base`'s geometry (a built-in shape or registered mesh), so it can
/// have its own texture. Returns the id, or -1.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_mesh_alias(base: u32) -> i32 {
    crate::MeshId::try_from(base).ok().map_or(-1, |b| model::alias(b).map_or(-1, i32::from))
}

/// Registers geometry (copied): `vertex_count` vertices of 11 floats (position, normal, color, uv) and
/// `index_count` u32 triangle indices. Returns its mesh id, or -1 (see `engine_load_error`).
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_mesh_create(vertices: *const f32, vertex_count: usize, indices: *const u32, index_count: usize) -> i32 {
    if vertices.is_null() || indices.is_null() {
        return -1;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call.
    let (v, i) = unsafe {
        (
            std::slice::from_raw_parts(vertices, vertex_count * model::VERTEX_FLOATS),
            std::slice::from_raw_parts(indices, index_count),
        )
    };
    shape::create(v, i).map_or(-1, i32::from)
}

/// The vertices of the last `engine_path_extrude`, until the next one.
#[cfg(feature = "games")]
static EXTRUDED: Mutex<Vec<f32>> = Mutex::new(Vec::new());

/// Fills and extrudes 2D contours: `points` holds [x, y] pairs, `counts[k]` points per contour.
/// Returns the number of floats made (11 per vertex, unindexed triangles; 0 = nothing to fill),
/// which `engine_path_extrude_copy` then copies out.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_path_extrude(points: *const f32, counts: *const u32, contour_count: usize, depth: f32, even_odd: i32) -> usize {
    if points.is_null() || counts.is_null() {
        return 0;
    }
    // SAFETY: caller passes `contour_count` counts and as many points as they add up to.
    let counts = unsafe { std::slice::from_raw_parts(counts, contour_count) };
    let total: usize = counts.iter().map(|&c| c as usize).sum();
    let flat = unsafe { std::slice::from_raw_parts(points, total * 2) };
    let mut contours = Vec::with_capacity(counts.len());
    let mut at = 0;
    for &c in counts {
        let c = c as usize;
        contours.push(flat[at * 2..(at + c) * 2].as_chunks::<2>().0.to_vec());
        at += c;
    }
    let made = shape::extrude(&contours, depth, even_odd != 0).unwrap_or_default();
    let len = made.len();
    if let Ok(mut out) = EXTRUDED.lock() {
        *out = made;
    }
    len
}

/// Copies up to `cap` floats of the last extrusion into `out`. Returns how many were copied.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_path_extrude_copy(out: *mut f32, cap: usize) -> usize {
    let Ok(made) = EXTRUDED.lock() else { return 0 };
    let n = made.len().min(cap);
    if !out.is_null() && n > 0 {
        // SAFETY: caller passes room for `cap` floats.
        unsafe { std::ptr::copy_nonoverlapping(made.as_ptr(), out, n) };
    }
    n
}

/// Recomputes normals in place (11 floats per vertex), averaged across vertices at the same place.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_smooth_normals(vertices: *mut f32, vertex_count: usize, indices: *const u32, index_count: usize) {
    if vertices.is_null() || (indices.is_null() && index_count > 0) {
        return;
    }
    // SAFETY: caller passes vertex_count * 11 floats and index_count indices, not overlapping.
    let v = unsafe { std::slice::from_raw_parts_mut(vertices, vertex_count * geometry::VERTEX_FLOATS) };
    let i = if index_count == 0 {
        &[][..]
    } else {
        unsafe { std::slice::from_raw_parts(indices, index_count) }
    };
    geometry::smooth_normals(v, i);
}

/// Flips triangles (in place) whose winding disagrees with their vertex normals.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_face_outward(vertices: *const f32, vertex_count: usize, indices: *mut u32, index_count: usize) {
    if vertices.is_null() || indices.is_null() {
        return;
    }
    // SAFETY: as above.
    let v = unsafe { std::slice::from_raw_parts(vertices, vertex_count * geometry::VERTEX_FLOATS) };
    let i = unsafe { std::slice::from_raw_parts_mut(indices, index_count) };
    geometry::face_outward(v, i);
}

/// Bakes a part into merged buffers. `placement` = [position xyz, rotation quat xyzw, scale xyz,
/// color rgb] (13 floats). Writes vertex_count vertices to `out_vertices` and index_count indices
/// (offset by `first`) to `out_indices`.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_place(
    vertices: *const f32,
    vertex_count: usize,
    indices: *const u32,
    index_count: usize,
    placement: *const f32,
    first: u32,
    out_vertices: *mut f32,
    out_indices: *mut u32,
) {
    if vertices.is_null() || placement.is_null() || out_vertices.is_null() || (index_count > 0 && (indices.is_null() || out_indices.is_null())) {
        return;
    }
    // SAFETY: caller passes the sizes given, outputs not overlapping inputs.
    let p = unsafe { std::slice::from_raw_parts(placement, 13) };
    let placement = geometry::Placement {
        position: [p[0], p[1], p[2]],
        rotation: [p[3], p[4], p[5], p[6]],
        scale: [p[7], p[8], p[9]],
        color: [p[10], p[11], p[12]],
    };
    let floats = vertex_count * geometry::VERTEX_FLOATS;
    let sv = unsafe { std::slice::from_raw_parts(vertices, floats) };
    let ov = unsafe { std::slice::from_raw_parts_mut(out_vertices, floats) };
    let (si, oi): (&[u32], &mut [u32]) = if index_count == 0 {
        (&[], &mut [])
    } else {
        unsafe {
            (
                std::slice::from_raw_parts(indices, index_count),
                std::slice::from_raw_parts_mut(out_indices, index_count),
            )
        }
    };
    geometry::place_part(sv, si, &placement, first, ov, oi);
}

/// Decodes a PNG or JPEG (copied). Returns the texture id, or -1.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_texture_load(data: *const u8, len: usize) -> i32 {
    #[cfg(not(feature = "image-codecs"))]
    {
        let _ = (data, len);
        -1
    }
    #[cfg(feature = "image-codecs")]
    {
        let Some(bytes) = (unsafe { bytes(data, len) }) else { return -1 };
        texture::load(bytes).map_or(-1, |id| id as i32)
    }
}

/// UI-only thumbnail decoding. Fit: 0 cover, 1 contain, 2 fill, 3 original.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_texture_load_sized(data: *const u8, len: usize, width: u32, height: u32, fit: u32) -> i32 {
    #[cfg(feature = "components")]
    {
        let Some(bytes) = (unsafe { bytes(data, len) }) else { return -1 };
        crate::assets::record_error(crate::components::image_decode::decode(bytes, width, height, fit).and_then(texture::register_temporary))
            .map_or(-1, |id| id as i32)
    }
    #[cfg(not(feature = "components"))]
    {
        let _ = (data, len, width, height, fit);
        -1
    }
}

/// RGBA8 pixels, top row first (width * height * 4 bytes). Valid for the life of the process.
/// Null for unknown and dynamic textures (their pixels change; read them from their producer).
#[unsafe(no_mangle)]
pub extern "C" fn engine_texture_pixels(id: u32) -> *const u8 {
    #[cfg(not(any(feature = "image-codecs", feature = "drawing")))]
    {
        let _ = id;
        std::ptr::null()
    }
    #[cfg(any(feature = "image-codecs", feature = "drawing"))]
    {
        texture::get(id)
            .filter(|t| t.rgba.len() == t.width as usize * t.height as usize * 4)
            .map_or(std::ptr::null(), |t| t.rgba.as_ptr())
    }
}

/// Writes width and height to `out[0..2]`. Returns 1 for a known texture.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_texture_size(id: u32, out: *mut u32) -> i32 {
    #[cfg(not(any(feature = "image-codecs", feature = "drawing")))]
    {
        let _ = (id, out);
        0
    }
    #[cfg(any(feature = "image-codecs", feature = "drawing"))]
    {
        let Some(t) = texture::get(id).filter(|_| !out.is_null()) else {
            return 0;
        };
        // SAFETY: caller passes room for 2 values.
        unsafe {
            *out = t.width;
            *out.add(1) = t.height;
        }
        1
    }
}

/// Builds 3D glyph meshes for the UTF-8 `chars` from a TrueType/OpenType font (copied), extruded by
/// `depth` ems, at `weight` for a variable font (0 = its default). Returns the font id, or -1.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_font_load(data: *const u8, len: usize, depth: f32, chars: *const u8, chars_len: usize, weight: f32) -> i32 {
    let (Some(bytes), Some(chars)) = (unsafe { bytes(data, len) }, unsafe { bytes(chars, chars_len) }) else {
        return -1;
    };
    let Ok(chars) = std::str::from_utf8(chars) else { return -1 };
    font::load(bytes, depth, chars, weight).map_or(-1, |id| id as i32)
}

/// `[codepoint, mesh id (-1 = nothing drawn), advance in ems]` per glyph, as floats. Valid for the life
/// of the process. `engine_font_glyph_floats` gives the length.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_font_glyphs(font: u32) -> *const f32 {
    font::get(font).map_or(std::ptr::null(), |f| f.glyphs.as_ptr())
}

#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_font_glyph_floats(font: u32) -> u32 {
    font::get(font).map_or(0, |f| f.glyphs.len() as u32)
}

/// Height of capital letters, in ems.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_font_cap_height(font: u32) -> f32 {
    font::get(font).map_or(0.7, |f| f.cap_height)
}

/// Copies the reason the last model, texture, font or alias load failed (NUL-terminated, truncated
/// to `cap`) into `out`. Returns the full message length in bytes (0 after a success).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_load_error(out: *mut u8, cap: usize) -> usize {
    let message = crate::assets::last_error();
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

/// JSON metadata: joint count and animation names/durations. Uses the usual length/copy ABI.
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_model_rig(mesh: u32, out: *mut u8, capacity: usize) -> usize {
    let rig = crate::MeshId::try_from(mesh).ok().and_then(model::get).and_then(|m| m.skeleton.clone());
    let clips: Vec<_> = rig
        .as_ref()
        .map(|r| {
            r.clips
                .iter()
                .map(|c| serde_json::json!({"name": c.name, "duration": c.duration}))
                .collect()
        })
        .unwrap_or_default();
    let value = serde_json::json!({"joints": rig.as_ref().map_or(0, |r| r.joints.len()), "clips": clips}).to_string();
    if !out.is_null() && capacity > 0 {
        let length = value.len().min(capacity - 1);
        unsafe {
            std::ptr::copy_nonoverlapping(value.as_ptr(), out, length);
            *out.add(length) = 0;
        }
    }
    value.len()
}
