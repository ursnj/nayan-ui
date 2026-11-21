//! Normalize browser permission observations.

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn permission_result(observation: &str) -> String {
    #[cfg(feature = "permissions")]
    return crate::permissions::result(observation);
    #[cfg(not(feature = "permissions"))]
    {
        let _ = observation;
        r#"{"status":"unavailable","canAskAgain":false}"#.to_owned()
    }
}
