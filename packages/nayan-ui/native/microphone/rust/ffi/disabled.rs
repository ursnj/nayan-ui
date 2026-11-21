#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_permission() -> i32 {
    -2
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_request(done: extern "C" fn(*mut std::ffi::c_void, i32), context: *mut std::ffi::c_void) {
    done(context, 0);
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_start(_: f32) -> i32 {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_stop() {}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_state() -> i32 {
    -1
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_level() -> f32 {
    0.0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_held() -> f32 {
    0.0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_take(_: f32, _: f32) -> i32 {
    -1
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_mic_push(_: *const f32, _: usize, _: u32) {}
