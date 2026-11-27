//! Audio mixer entry point for the browser worklet.

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_web_audio_render(ptr: *mut f32, floats: usize) {
    if ptr.is_null() || floats > 16384 {
        return;
    }
    crate::audio::web_render(unsafe { std::slice::from_raw_parts_mut(ptr, floats) });
}
