//! Android: the core needs the app's JavaVM and Context before using audio (cpal's AAudio backend
//! asks Android's AudioManager about devices) or haptics (the Vibrator service). The native module
//! hands them over once at startup via `engine_android_init`.

use std::ffi::c_void;
use std::sync::Once;
use std::sync::atomic::{AtomicBool, Ordering};

static INIT: Once = Once::new();
static READY: AtomicBool = AtomicBool::new(false);

/// Stores the JavaVM and a global reference to an Android Context. Later calls are ignored
/// (ndk-context asserts it's initialized only once, and a panic would abort the app).
///
/// # Safety
/// `java_vm` must be the process's JavaVM and `context` a JNI global reference to a Context that
/// stays alive for the life of the process (e.g. the Application).
pub unsafe fn init(java_vm: *mut c_void, context: *mut c_void) {
    if java_vm.is_null() || context.is_null() {
        return;
    }
    INIT.call_once(|| {
        // SAFETY: forwarded from the caller's contract; runs at most once.
        unsafe { ndk_context::initialize_android_context(java_vm, context) };
        READY.store(true, Ordering::Release);
    });
}

/// True once `init` succeeded: audio and haptics may touch Java.
pub fn is_initialized() -> bool {
    READY.load(Ordering::Acquire)
}
