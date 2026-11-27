#[cfg(feature = "components")]
use std::ffi::CString;
use std::ffi::c_char;
/// # Safety
/// `data` is readable for `len` bytes. Free the result with engine_drawing_result_free.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_safe_area_request(data: *const u8, len: usize) -> *mut c_char {
    #[cfg(not(feature = "components"))]
    {
        let _ = (data, len);
        c"{\"ok\":false,\"error\":\"UI was disabled in this engine build\"}".to_owned().into_raw()
    }
    #[cfg(feature = "components")]
    {
        let value = if data.is_null() || len > 65536 {
            None
        } else {
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(data, len) }).ok()
        };
        let result = value.as_ref().ok_or("Invalid safe-area command").and_then(crate::safe_area::request);
        let envelope = match result {
            Ok(value) => serde_json::json!({"ok":true,"value":value}),
            Err(error) => serde_json::json!({"ok":false,"error":error}),
        };
        CString::new(envelope.to_string()).unwrap().into_raw()
    }
}
