#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_load_wav(_: *const u8, _: usize) -> i32 {
    -1
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_play(_: u32, _: f32, _: f32, _: f32, _: i32) -> u64 {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_stop(_: u64) {}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_control(_: u64, _: u32, _: f64, _: f32) -> i32 {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_voice_status(_: u64, _: *mut f32) -> i32 {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_encode_wav(_: u32, _: *mut u8, _: usize) -> usize {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_set_volume(_: f32) {}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_set_muted(_: i32) {}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_is_running() -> i32 {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_release(_: u32) {}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_duration(_: u32) -> f32 {
    0.0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_shift(_: u32, _: f32, _: f32, _: f32, _: i32) -> i32 {
    -1
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_audio_levels(_: u32, _: f32, _: *mut f32, _: usize) -> usize {
    0
}
