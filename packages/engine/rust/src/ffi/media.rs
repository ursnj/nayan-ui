//! C ABI: audio and haptics (global, independent of worlds).

#![allow(clippy::missing_safety_doc)] // the shared contract is documented once, in ffi/mod.rs

use crate::{audio, haptics};

/// Decodes a WAV file (copied). Returns its sound id, or -1 if it can't be decoded.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_audio_load_wav(data: *const u8, len: usize) -> i32 {
    if data.is_null() || len == 0 {
        return -1;
    }
    // SAFETY: caller passes a readable buffer of `len` bytes, used only during this call.
    let bytes = unsafe { std::slice::from_raw_parts(data, len) };
    audio::load_wav(bytes).map_or(-1, |id| id as i32)
}

/// Returns a voice id (> 0) for `engine_audio_stop`, or 0 if nothing was played.
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_play(sound: u32, volume: f32, pan: f32, pitch: f32, looping: i32) -> u64 {
    audio::play(sound, volume, pan, pitch, looping != 0).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_stop(voice: u64) {
    audio::stop(voice);
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_set_volume(volume: f32) {
    audio::set_volume(volume);
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_set_muted(muted: i32) {
    audio::set_muted(muted != 0);
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_is_running() -> i32 {
    audio::is_running() as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_haptics_supported() -> i32 {
    haptics::supported() as i32
}

/// Plays `count` taps given as `[time, intensity, sharpness]` triples. With `throttle`, a lone tap
/// right after another is dropped.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_haptics_play(taps: *const f32, count: u32, throttle: i32) {
    if taps.is_null() || count == 0 {
        return;
    }
    // SAFETY: caller passes `count * 3` readable floats, used only during this call.
    let raw = unsafe { std::slice::from_raw_parts(taps, count as usize * 3) };
    let taps: Vec<haptics::Tap> = raw
        .as_chunks::<3>()
        .0
        .iter()
        .map(|&[time, intensity, sharpness]| haptics::Tap { time, intensity, sharpness })
        .collect();
    haptics::play(&taps, throttle != 0);
}
