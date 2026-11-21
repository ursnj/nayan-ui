use crate::audio;

/// 1 granted, 0 not asked yet, -1 denied (iOS; 1 elsewhere, where the host asks).
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_permission() -> i32 {
    audio::mic_permission()
}

/// Asks for the microphone and calls `done(context, granted)` once, possibly on another thread
/// (iOS; elsewhere it calls back at once with 1).
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_request(done: extern "C" fn(*mut std::ffi::c_void, i32), context: *mut std::ffi::c_void) {
    // The context pointer only travels back to the caller's callback.
    let context = context as usize;
    audio::mic_request(move |granted| done(context as *mut std::ffi::c_void, granted as i32));
}

/// Starts listening, keeping the last `max_seconds` of input. 1 if it's opening.
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_start(max_seconds: f32) -> i32 {
    audio::mic_start(max_seconds) as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_stop() {
    audio::mic_stop();
}

/// 0 off, 1 opening, 2 listening, -1 failed (no device or permission).
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_state() -> i32 {
    audio::mic_state()
}

/// How loud the input is now, 0 (-60 dBFS or quieter) .. 1 (full scale).
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_level() -> f32 {
    audio::mic_level()
}

/// Seconds of input held.
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_held() -> f32 {
    audio::mic_held()
}

/// A sound of the `seconds` of input that ended `skip_end` seconds ago; forgets what was heard.
/// Returns its sound id, or -1 if nothing was heard.
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_take(seconds: f32, skip_end: f32) -> i32 {
    audio::mic_take(seconds, skip_end).map_or(-1, |id| id as i32)
}

/// Input from the page's microphone (browser): `count` mono samples at `rate`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_audio_mic_push(samples: *const f32, count: usize, rate: u32) {
    if samples.is_null() || count == 0 || count > 1 << 20 {
        return;
    }
    // SAFETY: caller passes `count` readable floats, used only during this call.
    audio::mic_push(unsafe { std::slice::from_raw_parts(samples, count) }, rate);
}
