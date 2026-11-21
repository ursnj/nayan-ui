//! Browser startup, shared canvas attachment and aligned buffers for the C ABI.

#[path = "../../../assets/rust/web.rs"]
mod asset_storage;
#[cfg(feature = "audio")]
#[path = "../../../audio/rust/web.rs"]
mod audio;
#[path = "../../../components/rust/web.rs"]
mod components;
#[path = "../../../location/rust/web.rs"]
mod location;
#[path = "../../../markdown/rust/web.rs"]
mod markdown;
#[cfg(feature = "games")]
#[path = "../../../games/rust/assets/wasm_alloc.rs"]
mod mesh_allocator;
#[path = "../../../permissions/rust/web.rs"]
mod permissions;
#[cfg(not(feature = "tts"))]
#[path = "../../../tts/rust/web_disabled.rs"]
mod speech_disabled;
#[path = "../../../sqlite/rust/web.rs"]
mod sqlite;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(inline_js = "export function report_engine_panic(message) { console.error(message); }")]
extern "C" {
    fn report_engine_panic(message: &str);
}

#[wasm_bindgen(start)]
pub fn start() {
    std::panic::set_hook(Box::new(|panic| report_engine_panic(&format!("Nayan engine: {panic}"))));
}

#[wasm_bindgen]
pub async fn attach_canvas(id: i32, canvas: web_sys::HtmlCanvasElement) -> Result<(), JsValue> {
    crate::render::attach_canvas(id, canvas).await.map_err(|e| JsValue::from_str(&e))
}

/// Browser component frames pass numeric arguments directly and skip the JSON command path.
#[cfg(feature = "components")]
#[unsafe(no_mangle)]
pub extern "C" fn engine_web_component_present(id: i32, width: f32, height: f32, pixel_width: u32, pixel_height: u32) -> i32 {
    crate::render::resize_art_target(id, pixel_width, pixel_height);
    match crate::render::document::present(id, id, width, height, 0) {
        Ok(value) => value as i32,
        Err(error) => {
            crate::render::set_error(error);
            -1
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_web_alloc(bytes: usize) -> *mut u64 {
    Box::into_raw(vec![0u64; bytes.div_ceil(8).max(1)].into_boxed_slice()).cast()
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_web_free(ptr: *mut u64, bytes: usize) {
    if !ptr.is_null() {
        unsafe { drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, bytes.div_ceil(8).max(1)))) };
    }
}
