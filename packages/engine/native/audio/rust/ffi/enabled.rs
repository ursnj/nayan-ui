use crate::audio;

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
pub extern "C" fn engine_audio_control(voice: u64, action: u32, value: f64, pan: f32) -> i32 {
    audio::control(voice, action, value, pan) as i32
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

/// Frees a sound's samples (a played recording); its id then plays nothing.
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_release(sound: u32) {
    audio::release(sound);
}

/// A sound's length in seconds (0 if unknown or released).
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_duration(sound: u32) -> f32 {
    audio::duration(sound)
}

/// A new sound id: `sound` `pitch` times higher and `tempo` times faster (0.25..4 each); `clean`
/// (non-zero) turns rumble and the room between words down, and `loudness` > 0 levels the speech to
/// that RMS. -1 if it can't be made. Free it with `engine_audio_release`.
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_shift(sound: u32, pitch: f32, tempo: f32, loudness: f32, clean: i32) -> i32 {
    audio::shift(sound, pitch, tempo, loudness, clean != 0).map_or(-1, |id| id as i32)
}

/// Writes up to `capacity` loudness values (one per `1 / per_second` s) into `out` and returns how
/// many the sound has; pass a null `out` to ask for the count.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_audio_levels(sound: u32, per_second: f32, out: *mut f32, capacity: usize) -> usize {
    let levels = audio::levels(sound, per_second);
    if !out.is_null() {
        let n = levels.len().min(capacity);
        // SAFETY: caller passes `capacity` writable floats, used only during this call.
        unsafe { std::ptr::copy_nonoverlapping(levels.as_ptr(), out, n) };
    }
    levels.len()
}
