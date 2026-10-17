//! C ABI: the renderer (see `crate::render`).

#![allow(clippy::missing_safety_doc)] // documented in include/engine_core.h

use std::ffi::c_void;

use crate::render::{self, Frame, Instances, NativeWindow, VERTEX_FLOATS};

fn copy_str(message: &str, out: *mut u8, cap: usize) -> usize {
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
    let (v, i) = unsafe { (std::slice::from_raw_parts(vertices, vertex_count * VERTEX_FLOATS), std::slice::from_raw_parts(indices, index_count)) };
    render::register_mesh(mesh as u8, v, i, u32::try_from(texture).ok(), shine);
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_attach(surface: i32, window: *mut c_void, width: u32, height: u32) -> i32 {
    // SAFETY: forwarded from the caller's contract (window valid until engine_render_detach).
    unsafe { render::attach(surface, NativeWindow(window), width, height) }.is_ok() as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_render_detach(surface: i32) {
    render::detach(surface);
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
) -> i32 {
    if frame.is_null() || matrices.is_null() || colors.is_null() || ranges.is_null() {
        return -1;
    }
    // SAFETY: caller passes readable buffers of the given lengths, used only during the call.
    let (frame, instances) = unsafe {
        let frame = std::slice::from_raw_parts(frame, frame_len);
        let instances = Instances {
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

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_error(out: *mut u8, cap: usize) -> usize {
    copy_str(&render::last_error(), out, cap)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_backend(out: *mut u8, cap: usize) -> usize {
    copy_str(render::backend(), out, cap)
}
