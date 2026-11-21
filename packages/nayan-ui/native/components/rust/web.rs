//! Browser insets and the build-time style compiler.

use wasm_bindgen::prelude::*;

/// Compile engine utility classes for browser hosts/build tools, without GPU initialization.
#[wasm_bindgen]
pub fn compile_utilities(source: &str) -> Result<String, JsValue> {
    #[cfg(feature = "components")]
    return crate::components::utilities::compile(source).map_err(|e| JsValue::from_str(&e));
    #[cfg(not(feature = "components"))]
    {
        let _ = source;
        Err(JsValue::from_str("Rebuild the engine with UI support"))
    }
}

/// Insets measured by the browser, normalized by the same core as native providers.
#[wasm_bindgen]
pub fn safe_area_request(command: &str) -> Result<String, JsValue> {
    #[cfg(not(feature = "components"))]
    {
        let _ = command;
        Err(JsValue::from_str("UI was disabled in this engine build"))
    }
    #[cfg(feature = "components")]
    {
        let value = serde_json::from_str(command).map_err(|e| JsValue::from_str(&e.to_string()))?;
        crate::safe_area::request(&value).map(|v| v.to_string()).map_err(JsValue::from_str)
    }
}
