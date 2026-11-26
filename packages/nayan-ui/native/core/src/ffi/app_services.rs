#[cfg(any(feature = "image-picker", feature = "document-picker", feature = "keep-awake", feature = "review", feature = "permissions"))]
use std::ffi::CString;
use std::ffi::c_char;
/// # Safety
/// data is readable for length bytes. Free result with engine_drawing_result_free.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_app_services_prepare(owner: u64, data: *const u8, length: usize) -> *mut c_char {
    #[cfg(not(any(feature = "image-picker", feature = "document-picker", feature = "keep-awake", feature = "review", feature = "permissions")))]
    {
        let _ = (owner, data, length);
        c"{\"ok\":false,\"error\":\"App services were disabled in this engine build\"}"
            .to_owned()
            .into_raw()
    }
    #[cfg(any(feature = "image-picker", feature = "document-picker", feature = "keep-awake", feature = "review", feature = "permissions"))]
    {
        let result = if data.is_null() || length > 65536 {
            Err("Invalid app service command".into())
        } else {
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(data, length) })
                .map_err(|_| "Invalid app service JSON".to_string())
                .and_then(|value| crate::app_services::prepare(owner, value))
        };
        let envelope = match result {
            Ok(value) => serde_json::json!({"ok":true,"value":value}),
            Err(error) => serde_json::json!({"ok":false,"error":error}),
        };
        CString::new(envelope.to_string()).unwrap().into_raw()
    }
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_app_services_release(owner: u64) -> *mut c_char {
    #[cfg(not(any(feature = "image-picker", feature = "document-picker", feature = "keep-awake", feature = "review", feature = "permissions")))]
    {
        let _ = owner;
        c"{}".to_owned().into_raw()
    }
    #[cfg(any(feature = "image-picker", feature = "document-picker", feature = "keep-awake", feature = "review", feature = "permissions"))]
    {
        CString::new(crate::app_services::release(owner).to_string()).unwrap().into_raw()
    }
}

/// # Safety
/// data is readable for length bytes. Free result with engine_drawing_result_free.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_permission_result(data: *const u8, length: usize) -> *mut c_char {
    #[cfg(not(feature = "permissions"))]
    {
        let _ = (data, length);
        c"{\"status\":\"unavailable\",\"canAskAgain\":false}".to_owned().into_raw()
    }
    #[cfg(feature = "permissions")]
    {
        let observation = if data.is_null() || length > 32 {
            ""
        } else {
            std::str::from_utf8(unsafe { std::slice::from_raw_parts(data, length) }).unwrap_or_default()
        };
        CString::new(crate::permissions::result(observation)).unwrap().into_raw()
    }
}

/// # Safety
/// data is readable for length bytes. Free result with engine_drawing_result_free.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_location_position(data: *const u8, length: usize) -> *mut c_char {
    #[cfg(feature = "location")]
    if !data.is_null() && length <= 4096 {
        let raw = unsafe { std::slice::from_raw_parts(data, length) };
        return CString::new(crate::location::position(raw)).unwrap().into_raw();
    }
    let _ = (data, length);
    c"{\"error\":\"unavailable\"}".to_owned().into_raw()
}
