/// Queues a system speech command. The reply buffer is valid only for the callback's duration.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_speech_request(
    data: *const u8,
    len: usize,
    done: extern "C" fn(*mut std::ffi::c_void, *const u8, usize),
    context: *mut std::ffi::c_void,
) {
    let context = context as usize;
    let reply = Box::new(move |result| {
        let value = crate::speech::envelope(result);
        done(context as *mut std::ffi::c_void, value.as_ptr(), value.len());
    });
    if data.is_null() {
        reply(Err("Missing speech command".into()));
        return;
    }
    match std::str::from_utf8(unsafe { std::slice::from_raw_parts(data, len) }) {
        Ok(command) => crate::speech::request(command, reply),
        Err(_) => reply(Err("Speech command must be UTF-8".into())),
    }
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_speech_shutdown() {
    crate::speech::shutdown();
}
