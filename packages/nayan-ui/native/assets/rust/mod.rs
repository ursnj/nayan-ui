//! Asset loading and geometry: 3D models (glTF), textures (PNG/JPEG), fonts (TTF/OTF), custom
//! shapes (2D paths extruded into solids), geometry post-processing, and built-in mesh generation.
//!
//! - `model.rs`          glTF/GLB parsing, the global mesh registry, aliases
//! - `texture.rs`        image decoding (PNG/JPEG), the global texture registry
//! - `font.rs`           TrueType/OpenType glyph outlines → extruded meshes
//! - `shape.rs`          custom geometry from JS (extrusion, registration)
//! - `geometry.rs`       normal generation, placement/merging and meshoptimizer preparation
//! - `modelling.rs`      constructive solids, seeded fields and Surface Nets tessellation
//! - `builtin_meshes.rs` procedural cube, sphere, cylinder, etc.

#[cfg(feature = "games")]
#[path = "../../games/rust/assets/builtin_meshes.rs"]
pub mod builtin_meshes;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/compression.rs"]
mod compression;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/font.rs"]
pub mod font;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/geometry.rs"]
pub mod geometry;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/model.rs"]
pub mod model;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/modelling.rs"]
pub mod modelling;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/shape.rs"]
pub mod shape;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/skeleton.rs"]
pub mod skeleton;
#[cfg(any(feature = "image-codecs", feature = "drawing"))]
pub mod texture;

#[cfg(feature = "games")]
#[path = "../../games/rust/assets/bake.rs"]
pub mod bake;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/cache.rs"]
pub mod cache;
#[cfg(feature = "games")]
#[path = "../../games/rust/assets/prepared.rs"]
pub mod prepared;

#[cfg(all(feature = "games", target_arch = "wasm32"))]
#[path = "../../games/rust/assets/cache_browser.rs"]
pub mod cache_browser;

use std::sync::Mutex;

static LAST_ERROR: Mutex<String> = Mutex::new(String::new());

/// Why the last model, texture or font load failed (empty after a success).
pub fn last_error() -> String {
    LAST_ERROR.lock().map(|e| e.clone()).unwrap_or_default()
}

/// Remembers a load's error message for `last_error` (clears it on success).
pub(crate) fn record_error<T>(result: Result<T, String>) -> Result<T, String> {
    if let Ok(mut error) = LAST_ERROR.lock() {
        *error = result.as_ref().err().cloned().unwrap_or_default();
    }
    result
}
