#[cfg(not(target_arch = "wasm32"))]
use std::ffi::{CString, c_char};

/// # Safety
/// Both inputs are readable for their respective lengths. Free the result with engine_drawing_result_free.
#[cfg(not(target_arch = "wasm32"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_contacts_page(
    options: *const u8,
    options_len: usize,
    rows: *const u8,
    rows_len: usize,
) -> *mut c_char {
    #[cfg(feature = "contacts")]
    let result = if options.is_null()
        || rows.is_null()
        || options_len > 65536
        || rows_len > 128 * 1024 * 1024
    {
        Err("Invalid contacts page input".into())
    } else {
        let options = unsafe { std::slice::from_raw_parts(options, options_len) };
        let rows = unsafe { std::slice::from_raw_parts(rows, rows_len) };
        let page = || {
            let query = crate::contacts::query(
                serde_json::from_slice(options).map_err(|_| "Invalid contacts query JSON")?,
            )?;
            let rows = serde_json::from_slice(rows).map_err(|_| "Invalid contacts data JSON")?;
            Ok(crate::contacts::page(rows, query))
        };
        page()
    };
    #[cfg(not(feature = "contacts"))]
    let result = {
        let _ = (options, options_len, rows, rows_len);
        Err("Contacts were disabled in this engine build".into())
    };
    CString::new(envelope(result))
        .expect("JSON escapes NUL bytes")
        .into_raw()
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen]
pub fn contacts_request(command: &str, rows: &str) -> String {
    #[cfg(feature = "contacts")]
    let result = (|| {
        if command.len() > 65536 || rows.len() > 128 * 1024 * 1024 {
            return Err("Invalid contacts request size".into());
        }
        let command = serde_json::from_str(command).map_err(|_| "Invalid contacts command JSON")?;
        let rows: Vec<serde_json::Value> =
            serde_json::from_str(rows).map_err(|_| "Invalid contacts data JSON")?;
        if rows.iter().any(|row| !row["id"].is_string()) {
            return Err("Invalid stored contact".into());
        }
        crate::contacts::local(rows, command)
    })();
    #[cfg(not(feature = "contacts"))]
    let result = {
        let _ = (command, rows);
        Err("Contacts were disabled in this engine build".into())
    };
    envelope(result)
}

fn envelope(result: Result<serde_json::Value, String>) -> String {
    match result {
        Ok(value) => serde_json::json!({"ok":true,"value":value}),
        Err(error) => serde_json::json!({"ok":false,"error":error}),
    }
    .to_string()
}
