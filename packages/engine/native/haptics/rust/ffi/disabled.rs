#[unsafe(no_mangle)]
pub extern "C" fn engine_haptics_supported() -> i32 {
    0
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_haptics_play(_: *const f32, _: u32, _: i32) {}
