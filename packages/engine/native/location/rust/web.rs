//! Browser location availability and validation.

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn location_available() -> bool {
    cfg!(feature = "location")
}

#[wasm_bindgen]
pub fn location_position(raw: &str) -> String {
    #[cfg(feature = "location")]
    return crate::location::position(raw.as_bytes());
    #[cfg(not(feature = "location"))]
    {
        let _ = raw;
        r#"{"error":"unavailable"}"#.to_owned()
    }
}
