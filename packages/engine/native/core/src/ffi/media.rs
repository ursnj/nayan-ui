//! C ABI registration for audio, microphone, haptics and speech.

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

// Disabled features retain the host ABI without linking their implementation.
#[cfg(feature = "audio")]
#[path = "../../../audio/rust/ffi/enabled.rs"]
mod audio;
#[cfg(not(feature = "audio"))]
#[path = "../../../audio/rust/ffi/disabled.rs"]
mod audio;
pub use audio::*;

#[cfg(feature = "microphone")]
#[path = "../../../microphone/rust/ffi/enabled.rs"]
mod microphone;
#[cfg(not(feature = "microphone"))]
#[path = "../../../microphone/rust/ffi/disabled.rs"]
mod microphone;
pub use microphone::*;

#[cfg(feature = "haptics")]
#[path = "../../../haptics/rust/ffi/enabled.rs"]
mod haptics;
#[cfg(not(feature = "haptics"))]
#[path = "../../../haptics/rust/ffi/disabled.rs"]
mod haptics;
pub use haptics::*;

#[cfg(all(feature = "tts", not(target_arch = "wasm32")))]
#[path = "../../../tts/rust/ffi/enabled.rs"]
mod tts;
#[cfg(all(not(feature = "tts"), not(target_arch = "wasm32")))]
#[path = "../../../tts/rust/ffi/disabled.rs"]
mod tts;
#[cfg(not(target_arch = "wasm32"))]
pub use tts::*;
