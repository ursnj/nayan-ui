//! C ABI used by the native (JSI) layer. See `include/engine_core.h`.
//!
//! Safety contract for callers: a `World*` comes from `engine_world_new`, is used from one
//! thread at a time, and is released exactly once with `engine_world_free`. Capacity is fixed,
//! so every pointer returned by an `engine_world_*` getter stays valid until `engine_world_free`.
//!
//! - `world.rs` worlds, entities, physics, impact feedback
//! - `media.rs` audio and haptics (global)

#[cfg(target_os = "android")]
pub mod android;
pub mod media;
pub mod world;
