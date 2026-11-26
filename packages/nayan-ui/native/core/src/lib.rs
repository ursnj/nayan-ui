//! Shared wgpu runtime, C ABI and feature registration. Feature implementations live under their
//! `native/<feature>/rust/` directories and compile into this crate when selected. See
//! `include/engine_core.h` for the C interface.
//! Shared renderer code lives in `render/` and platform setup in `platform/`.

#[cfg(all(target_os = "android", any(feature = "components", feature = "audio", feature = "haptics", feature = "tts")))]
#[path = "platform/android.rs"]
pub mod android;
#[cfg(all(
    not(target_arch = "wasm32"),
    any(feature = "image-picker", feature = "keep-awake", feature = "review", feature = "permissions")
))]
#[path = "platform/app_services.rs"]
pub mod app_services;
#[path = "../../assets/rust/mod.rs"]
pub mod assets;
#[cfg(feature = "audio")]
#[path = "../../audio/rust/mod.rs"]
pub mod audio;
#[cfg(feature = "drawing")]
#[path = "../../drawing/rust/mod.rs"]
pub mod drawing;
#[cfg(any(feature = "games", feature = "components"))]
#[path = "support/easing.rs"]
mod easing;
pub mod ffi;
#[cfg(feature = "auth")]
#[path = "../../auth/rust/oauth.rs"]
mod auth;
#[cfg(any(feature = "games", feature = "sqlite"))]
#[path = "support/fingerprint.rs"]
mod fingerprint;
#[cfg(feature = "haptics")]
#[path = "../../haptics/rust/haptics.rs"]
pub mod haptics;
#[cfg(feature = "location")]
#[path = "../../location/rust/location.rs"]
mod location;
#[cfg(feature = "markdown")]
#[path = "../../markdown/rust/markdown.rs"]
mod markdown;
#[cfg(feature = "permissions")]
#[path = "../../permissions/rust/permissions.rs"]
mod permissions;
pub mod render;
#[cfg(feature = "components")]
#[path = "../../components/rust/safe_area.rs"]
pub mod safe_area;
#[cfg(feature = "games")]
#[path = "../../games/rust/shapes.rs"]
pub mod shapes;
#[cfg(feature = "tts")]
#[path = "../../tts/rust/mod.rs"]
pub mod speech;
#[cfg(feature = "sqlite")]
#[path = "../../sqlite/rust/sqlite.rs"]
mod sqlite;
#[cfg(all(feature = "storage", not(target_arch = "wasm32")))]
#[path = "../../storage/rust/storage.rs"]
pub mod storage;
#[cfg(feature = "svg")]
#[path = "../../drawing/rust/svg.rs"]
mod svg;
#[cfg(feature = "components")]
#[path = "../../components/rust/mod.rs"]
pub mod components;
#[cfg(feature = "games")]
#[path = "../../games/rust/world/mod.rs"]
mod world;
#[cfg(feature = "games")]
#[path = "../../games/rust/worldgen/mod.rs"]
pub mod worldgen;

#[cfg(any(feature = "games", feature = "components"))]
pub use easing::Easing;
#[cfg(feature = "games")]
pub use glamx::{Quat, Vec3};

/// A mesh id: 0..16 built-in shapes, then models, font glyphs and textured variants.
#[cfg(feature = "games")]
pub type MeshId = u16;
/// Mesh ids there's room for. Per-frame work only walks the ids handed out so far.
#[cfg(feature = "games")]
pub const MAX_MESHES: usize = 4096;

/// Opaque game-world handle for the shared C ABI when game simulation is disabled.
#[cfg(not(feature = "games"))]
pub enum World {}

#[cfg(feature = "games")]
pub use world::{
    ANIM_HEADER, ANIM_KEY_LEN, Animation, BURST_LEN, BodyKind, Burst, DESC_LEN, DONE_PER_ENTITY, EVENT_SENSOR, EVENT_STARTED, EVENT_STRIDE, Entity,
    EntityDesc, FIXED_DT, ImpactFeedback, Keyframe, MAX_DEPTH, MAX_EVENTS, NO_ENTITY, PhysicsDesc, PhysicsRequest, Shape, ShapeSpec, Spring, World,
    desc_flag, desc_slot,
};

#[cfg(target_arch = "wasm32")]
#[path = "platform/web.rs"]
mod web;
