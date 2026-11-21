//! C ABI: the renderer (see `crate::render`).

#![allow(clippy::missing_safety_doc)] // documented in include/engine_core.h

use std::ffi::c_void;

use crate::render::{self, NativeWindow};
#[cfg(feature = "games")]
#[path = "../../../games/rust/ffi/render.rs"]
mod game;
#[cfg(feature = "games")]
pub use game::*;

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
pub unsafe extern "C" fn engine_render_attach(surface: i32, window: *mut c_void, width: u32, height: u32) -> i32 {
    // SAFETY: forwarded from the caller's contract (window valid until engine_render_detach).
    unsafe { render::attach(surface, NativeWindow(window), width, height) }.is_ok() as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_render_warm_up() {
    render::warm_up();
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_render_detach(surface: i32) {
    render::detach(surface);
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_error(out: *mut u8, cap: usize) -> usize {
    copy_str(&render::last_error(), out, cap)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_backend(out: *mut u8, cap: usize) -> usize {
    copy_str(render::backend(), out, cap)
}
