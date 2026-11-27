//! Compatibility export for builds without speech support.

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub async fn speech_request(_: String) -> String {
    r#"{"error":"Speech was disabled in this engine build"}"#.to_owned()
}
