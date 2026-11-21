//! Markdown entry point for browser and server-side JavaScript.

use wasm_bindgen::prelude::*;

/// Server-side Markdown uses the same Rust parser without initializing GPU, audio or a UI document.
#[wasm_bindgen]
pub fn parse_markdown(source: &str) -> Result<String, JsValue> {
    #[cfg(feature = "markdown")]
    return crate::markdown::parse(source)
        .and_then(|nodes| serde_json::to_string(&nodes).map_err(|error| error.to_string()))
        .map_err(|error| JsValue::from_str(&error));
    #[cfg(not(feature = "markdown"))]
    {
        let _ = source;
        Err(JsValue::from_str("Rebuild the engine with the markdown feature"))
    }
}
