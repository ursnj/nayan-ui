//! Owned JSON results keep the ABI safe across native UI, JSI and WASM callers.
use serde_json::json;
use std::ffi::{CString, c_char};
// The host's surface transport is shared by UI and 2D drawing.
#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_create(width: f32, height: f32, ratio: f32) -> i32 {
    #[cfg(feature = "drawing")]
    return crate::drawing::create(width, height, ratio).unwrap_or(-1);
    #[cfg(not(feature = "drawing"))]
    {
        let _ = (width, height, ratio);
        -2
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_component_create() -> i32 {
    #[cfg(feature = "components")]
    return crate::render::document::create_component().unwrap_or(-1);
    #[cfg(not(feature = "components"))]
    {
        -2
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_destroy(id: i32) {
    crate::render::document::destroy(id);
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_drawing_command(id: i32, data: *const u8, len: usize) -> *mut c_char {
    let result = if data.is_null() || len > 32_000_000 {
        Err("Invalid surface command".to_string())
    } else {
        serde_json::from_slice(unsafe { std::slice::from_raw_parts(data, len) })
            .map_err(|e| e.to_string())
            .and_then(|value| crate::render::document::command(id, value))
    };
    let value = match result {
        Ok(value) => json!({"ok":true,"value":value}),
        Err(error) => json!({"ok":false,"error":error}),
    };
    CString::new(value.to_string()).unwrap().into_raw()
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_touch(id: i32, phase: i32, x: f32, y: f32, pressure: f32) {
    crate::render::document::touch(id, phase, x, y, pressure);
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_transform(id: i32, dx: f32, dy: f32, scale: f32) {
    crate::render::document::transform(id, dx, dy, scale);
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_invalidate(id: i32) {
    crate::render::document::invalidate(id);
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_present(id: i32, surface: i32, width: f32, height: f32, color: u32) -> i32 {
    crate::render::document::present(id, surface, width, height, color)
        .map(|value| value as i32)
        .unwrap_or(-1)
}

/// Null means there is no state change; callers do no JSON or bridge work for live samples.
#[unsafe(no_mangle)]
pub extern "C" fn engine_drawing_take_event(id: i32) -> *mut c_char {
    crate::render::document::event(id)
        .and_then(|value| CString::new(value.to_string()).ok())
        .map_or(std::ptr::null_mut(), CString::into_raw)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_drawing_result_free(result: *mut c_char) {
    if !result.is_null() {
        unsafe {
            drop(CString::from_raw(result));
        }
    }
}
/// Same owned JSON envelope/free function as drawing commands; no drawing document is required.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_icon_request(bytes: *const u8, len: usize, command: *const u8, count: usize) -> *mut c_char {
    let result: Result<serde_json::Value, String> = if bytes.is_null() || len > 8 * 1024 * 1024 || command.is_null() || count > 3_000_000 {
        Err("Invalid icon request".to_string())
    } else {
        std::str::from_utf8(unsafe { std::slice::from_raw_parts(command, count) })
            .map_err(|e| e.to_string())
            .and_then(|command| {
                #[cfg(feature = "components")]
                {
                    crate::components::icon::request(command)
                }
                #[cfg(not(feature = "components"))]
                {
                    let _ = command;
                    Err("Rebuild the engine with UI support".into())
                }
            })
    };
    let value = match result {
        Ok(value) => json!({"ok":true,"value":value}),
        Err(error) => json!({"ok":false,"error":error}),
    };
    CString::new(value.to_string()).unwrap().into_raw()
}
