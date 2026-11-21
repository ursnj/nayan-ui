//! C ABI used by the native (JSI) layer. See `include/engine_core.h`.
//!
//! Safety contract for callers: a `World*` comes from `engine_world_new`, is used from one
//! thread at a time, and is released exactly once with `engine_world_free`. Capacity is fixed,
//! so every pointer returned by an `engine_world_*` getter stays valid until `engine_world_free`.
//!
//! - `world.rs` worlds, entities, physics, impact feedback
//! - `media.rs` audio and haptics (global)
//! - `worldgen.rs` data-driven procedural worlds and procedural meshes (global handles)

#[cfg(not(target_arch = "wasm32"))]
pub mod app_services;

#[cfg(target_os = "android")]
pub mod android;
pub mod media;
#[path = "../../../games/rust/ffi/model.rs"]
pub mod model;
#[path = "../../../games/rust/ffi/modelling.rs"]
pub mod modelling;
#[cfg(not(feature = "games"))]
#[path = "../../../games/rust/ffi/no_games.rs"]
mod no_games;
pub mod render;
#[path = "../../../components/rust/ffi/safe_area.rs"]
pub mod safe_area;
#[cfg(not(target_arch = "wasm32"))]
#[path = "../../../sqlite/rust/ffi/sqlite.rs"]
pub mod sqlite;
#[cfg(not(target_arch = "wasm32"))]
#[path = "../../../storage/rust/ffi/storage.rs"]
pub mod storage;
#[path = "../../../components/rust/ffi/system_bars.rs"]
pub mod system_bars;
#[path = "../../../uuid/rust/ffi/utils.rs"]
pub mod utils;
#[cfg(feature = "games")]
#[path = "../../../games/rust/ffi/world.rs"]
pub mod world;
#[cfg(feature = "games")]
#[path = "../../../games/rust/ffi/worldgen.rs"]
pub mod worldgen;

#[path = "../../../components/rust/ffi/blur.rs"]
mod blur;
#[path = "../../../games/rust/ffi/cache.rs"]
pub mod cache;

#[cfg(feature = "components")]
#[path = "../../../components/rust/ffi/drawer.rs"]
pub mod drawer;
#[cfg(not(feature = "components"))]
#[path = "../../../components/rust/ffi/no_drawer.rs"]
pub mod drawer;
#[path = "../../../drawing/rust/ffi/drawing.rs"]
pub mod drawing;
