#[cfg(not(target_arch = "wasm32"))]
use std::ffi::c_char;

/// # Safety
/// The input is readable for length bytes. Free the result with engine_drawing_result_free.
#[unsafe(no_mangle)]
#[cfg(not(target_arch = "wasm32"))]
pub unsafe extern "C" fn engine_auth_request(data: *const u8, length: usize) -> *mut c_char {
    #[cfg(feature = "auth")]
    {
        if data.is_null() || length > crate::auth::MAX_COMMAND_BYTES {
            return c"{\"ok\":false,\"error\":\"Invalid sign-in request size\"}"
                .to_owned()
                .into_raw();
        }
        let result = crate::auth::request(unsafe { std::slice::from_raw_parts(data, length) });
        std::ffi::CString::new(result)
            .expect("JSON escapes NUL bytes")
            .into_raw()
    }
    #[cfg(not(feature = "auth"))]
    {
        let _ = (data, length);
        c"{\"ok\":false,\"error\":\"Sign-in was disabled in this engine build\"}"
            .to_owned()
            .into_raw()
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen]
pub fn auth_request(command: &str) -> String {
    #[cfg(feature = "auth")]
    return crate::auth::request(command.as_bytes());
    #[cfg(not(feature = "auth"))]
    {
        let _ = command;
        "{\"ok\":false,\"error\":\"Sign-in was disabled in this engine build\"}".to_owned()
    }
}
