//! C ABI for game meshes and frame submission.

#![allow(clippy::missing_safety_doc)] // documented in the shared engine_core.h

use crate::render::{self, Frame, Instances, VERTEX_FLOATS};

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_mesh(
    mesh: u32,
    vertices: *const f32,
    vertex_count: usize,
    indices: *const u32,
    index_count: usize,
    texture: i32,
    shine: f32,
) {
    if vertices.is_null() || indices.is_null() || mesh >= crate::MAX_MESHES as u32 {
        return;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call.
    let (v, i) = unsafe {
        (
            std::slice::from_raw_parts(vertices, vertex_count * VERTEX_FLOATS),
            std::slice::from_raw_parts(indices, index_count),
        )
    };
    render::register_mesh(mesh as crate::MeshId, v, i, u32::try_from(texture).ok(), shine);
}

/// Hands a core model's own geometry (`engine_mesh_create`, a loaded glTF, a font glyph) to the
/// renderer, copied inside Rust: the geometry never crosses into JS. `texture` < 0 for none.
/// Returns 1, or 0 if the mesh is unknown.
#[unsafe(no_mangle)]
pub extern "C" fn engine_render_model(mesh: u32, texture: i32, shine: f32) -> i32 {
    if mesh >= crate::MAX_MESHES as u32 {
        return 0;
    }
    let Some(model) = crate::assets::model::get(mesh as crate::MeshId) else {
        return 0;
    };
    render::register_mesh(mesh as crate::MeshId, &model.vertices, &model.indices, u32::try_from(texture).ok(), shine);
    1
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_frame(
    surface: i32,
    frame: *const f64,
    frame_len: usize,
    matrices: *const f32,
    colors: *const f32,
    regions: *const f32,
    capacity: usize,
    ranges: *const u32,
    ranges_len: usize,
    count: usize,
    out_view_proj: *mut f32,
    world: *const crate::World,
) -> i32 {
    if frame.is_null() || matrices.is_null() || colors.is_null() || ranges.is_null() {
        return -1;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call.
    let (frame, instances) = unsafe {
        let frame = std::slice::from_raw_parts(frame, frame_len);
        let instances = Instances {
            skins: world.as_ref().map_or(&[], |w| w.skin_draws()),
            matrices: std::slice::from_raw_parts(matrices, capacity * 16),
            colors: std::slice::from_raw_parts(colors, capacity * 4),
            regions: (!regions.is_null()).then(|| std::slice::from_raw_parts(regions, capacity * 4)),
            ranges: std::slice::from_raw_parts(ranges, ranges_len),
            count: count.min(capacity),
        };
        (frame, instances)
    };
    let Some(frame) = Frame::from_slice(frame) else {
        render::set_error("bad frame description".into());
        return -1;
    };
    match render::render(surface, &frame, &instances) {
        Ok(Some(view_proj)) => {
            if !out_view_proj.is_null() {
                // SAFETY: caller passes room for 16 floats.
                unsafe { std::ptr::copy_nonoverlapping(view_proj.as_ptr(), out_view_proj, 16) };
            }
            1
        }
        Ok(None) => 0,
        Err(_) => -1,
    }
}

/// Like `engine_render_frame`, but hands the frame to the render thread and returns at once: the
/// instances are copied, the camera's view-projection is written to `out_view_proj` straight away.
/// Returns 1 once the surface has presented a frame, 0 before, -1 if the last frame failed.
#[cfg(not(target_arch = "wasm32"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_publish(
    surface: i32,
    frame: *const f64,
    frame_len: usize,
    matrices: *const f32,
    colors: *const f32,
    regions: *const f32,
    capacity: usize,
    ranges: *const u32,
    ranges_len: usize,
    count: usize,
    out_view_proj: *mut f32,
    world: *const crate::World,
) -> i32 {
    if frame.is_null() || matrices.is_null() || colors.is_null() || ranges.is_null() {
        return -1;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call (copied).
    let (frame, instances) = unsafe {
        let frame = std::slice::from_raw_parts(frame, frame_len);
        let instances = Instances {
            skins: world.as_ref().map_or(&[], |w| w.skin_draws()),
            matrices: std::slice::from_raw_parts(matrices, capacity * 16),
            colors: std::slice::from_raw_parts(colors, capacity * 4),
            regions: (!regions.is_null()).then(|| std::slice::from_raw_parts(regions, capacity * 4)),
            ranges: std::slice::from_raw_parts(ranges, ranges_len),
            count: count.min(capacity),
        };
        (frame, instances)
    };
    match render::thread::publish(surface, frame, &instances) {
        Ok((view_proj, status)) => {
            if !out_view_proj.is_null() {
                // SAFETY: caller passes room for 16 floats.
                unsafe { std::ptr::copy_nonoverlapping(view_proj.as_ptr(), out_view_proj, 16) };
            }
            status
        }
        Err(message) => {
            render::set_error(message);
            -1
        }
    }
}

/// Writes [frames presented, smoothed render milliseconds] for a surface drawn by the render thread.
#[cfg(not(target_arch = "wasm32"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_stats(surface: i32, out: *mut f64) {
    if out.is_null() {
        return;
    }
    let (presented, ms) = render::thread::stats(surface);
    // SAFETY: caller passes room for 2 doubles.
    unsafe {
        *out = presented as f64;
        *out.add(1) = f64::from(ms);
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_overlay(
    surface: i32,
    matrices: *const f32,
    colors: *const f32,
    regions: *const f32,
    capacity: usize,
    ranges: *const u32,
    ranges_len: usize,
    count: usize,
    width: f32,
    height: f32,
) {
    if matrices.is_null() || colors.is_null() || ranges.is_null() || count == 0 {
        render::set_overlay(surface, None, 0.0, 0.0);
        return;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call (copied).
    let instances = unsafe {
        Instances {
            skins: &[],
            matrices: std::slice::from_raw_parts(matrices, capacity * 16),
            colors: std::slice::from_raw_parts(colors, capacity * 4),
            regions: (!regions.is_null()).then(|| std::slice::from_raw_parts(regions, capacity * 4)),
            ranges: std::slice::from_raw_parts(ranges, ranges_len),
            count: count.min(capacity),
        }
    };
    render::set_overlay(surface, Some(&instances), width, height);
}

/// Sets surface `surface`'s backdrop: static instances (same layout as `engine_render_overlay`),
/// drawn into a cached texture behind the scene with each frame's camera and light, and drawn again
/// only when they or the frame's view, light, size or quality change. `count` 0 removes it. Copies only.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_backdrop(
    surface: i32,
    matrices: *const f32,
    colors: *const f32,
    regions: *const f32,
    capacity: usize,
    ranges: *const u32,
    ranges_len: usize,
    count: usize,
) {
    if matrices.is_null() || colors.is_null() || ranges.is_null() || count == 0 {
        render::set_backdrop(surface, None);
        return;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call (copied).
    let instances = unsafe {
        Instances {
            skins: &[],
            matrices: std::slice::from_raw_parts(matrices, capacity * 16),
            colors: std::slice::from_raw_parts(colors, capacity * 4),
            regions: (!regions.is_null()).then(|| std::slice::from_raw_parts(regions, capacity * 4)),
            ranges: std::slice::from_raw_parts(ranges, ranges_len),
            count: count.min(capacity),
        }
    };
    render::set_backdrop(surface, Some(&instances));
}

/// Generates and registers all built-in shape meshes (cube, sphere, etc.) with the renderer.
#[unsafe(no_mangle)]
pub extern "C" fn engine_generate_builtin_meshes() {
    crate::assets::builtin_meshes::generate_builtin_meshes();
}

/// Returns the vertex count of a registered mesh, or 0 if not found.
#[unsafe(no_mangle)]
pub extern "C" fn engine_render_mesh_vertex_count(mesh: u32) -> usize {
    render::mesh_data(mesh as crate::MeshId).map_or(0, |d| d.vertices.len() / render::VERTEX_FLOATS)
}

/// Returns the index count of a registered mesh, or 0 if not found.
#[unsafe(no_mangle)]
pub extern "C" fn engine_render_mesh_index_count(mesh: u32) -> usize {
    render::mesh_data(mesh as crate::MeshId).map_or(0, |d| d.indices.len())
}

/// Copies a registered mesh's vertices into `out` (room for `cap` floats). Returns vertex count.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_mesh_vertices(mesh: u32, out: *mut f32, cap: usize) -> usize {
    let Some(data) = render::mesh_data(mesh as crate::MeshId) else {
        return 0;
    };
    let n = data.vertices.len().min(cap);
    if !out.is_null() && n > 0 {
        unsafe { std::ptr::copy_nonoverlapping(data.vertices.as_ptr(), out, n) };
    }
    data.vertices.len() / render::VERTEX_FLOATS
}

/// Copies a registered mesh's indices into `out` (room for `cap` u32s). Returns index count.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_mesh_indices(mesh: u32, out: *mut u32, cap: usize) -> usize {
    let Some(data) = render::mesh_data(mesh as crate::MeshId) else {
        return 0;
    };
    let n = data.indices.len().min(cap);
    if !out.is_null() && n > 0 {
        unsafe { std::ptr::copy_nonoverlapping(data.indices.as_ptr(), out, n) };
    }
    data.indices.len()
}

#[cfg(test)]
mod render_model_tests {
    use super::*;

    #[test]
    fn a_core_model_reaches_the_renderer_without_a_js_copy() {
        let mut vertices = vec![0.0f32; crate::render::VERTEX_FLOATS * 3];
        for (k, v) in vertices.iter_mut().enumerate() {
            *v = (k % 7) as f32 * 0.25;
        }
        let indices = [0u32, 1, 2];
        let mesh = crate::assets::shape::create(&vertices, &indices).expect("model");
        assert_eq!(engine_render_model(mesh as u32, 3, 0.4), 1);
        let drawn = render::mesh_data(mesh).expect("registered with the renderer");
        assert_eq!(drawn.vertices, vertices);
        assert_eq!(drawn.indices, indices);
        assert_eq!(drawn.texture, Some(3));
        assert!((drawn.shine - 0.4).abs() < 1e-6);
        // Unknown and out-of-range ids register nothing.
        assert_eq!(engine_render_model(crate::MAX_MESHES as u32 + 5, -1, 0.0), 0);
        assert_eq!(engine_render_model(crate::MAX_MESHES as u32 - 1, -1, 0.0), 0);
    }
}
