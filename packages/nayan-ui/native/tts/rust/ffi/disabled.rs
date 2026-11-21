#[unsafe(no_mangle)]
pub extern "C" fn engine_speech_request(
    _: *const u8,
    _: usize,
    done: extern "C" fn(*mut std::ffi::c_void, *const u8, usize),
    context: *mut std::ffi::c_void,
) {
    let result = br#"{"error":"Speech was disabled in this engine build"}"#;
    done(context, result.as_ptr(), result.len());
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_speech_shutdown() {}
