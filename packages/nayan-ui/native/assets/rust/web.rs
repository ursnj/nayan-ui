//! Game asset cache bindings for browser storage.

use wasm_bindgen::prelude::*;

// These exports bind browser I/O; public game APIs remain identical to native.
#[wasm_bindgen]
pub fn install_asset_storage(driver: JsValue) {
    #[cfg(not(feature = "games"))]
    {
        let _ = driver;
        ()
    }
    #[cfg(feature = "games")]
    {
        crate::assets::cache_browser::install(driver);
    }
}
#[wasm_bindgen]
pub fn can_warm_asset_record(bytes: usize) -> bool {
    #[cfg(not(feature = "games"))]
    {
        let _ = bytes;
        false
    }
    #[cfg(feature = "games")]
    {
        crate::assets::cache_browser::can_warm(bytes)
    }
}
#[wasm_bindgen]
pub fn restore_asset_record(name: String, bytes: Vec<u8>) -> bool {
    #[cfg(not(feature = "games"))]
    {
        let _ = (name, bytes);
        false
    }
    #[cfg(feature = "games")]
    {
        crate::assets::cache_browser::restore(name, bytes)
    }
}
#[wasm_bindgen]
pub async fn read_saved_asset(key: String) -> Result<js_sys::Uint8Array, JsValue> {
    #[cfg(not(feature = "games"))]
    {
        let _ = key;
        Ok(js_sys::Uint8Array::new_with_length(0))
    }
    #[cfg(feature = "games")]
    {
        crate::assets::cache_browser::load(key).await
    }
}
