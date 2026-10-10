//! C ABI: Android setup.

#![allow(clippy::missing_safety_doc)] // documented on `crate::android::init`

use std::ffi::c_void;

/// Gives the core the JavaVM and a global-ref'd Context (call once at startup; repeats are ignored).
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_android_init(java_vm: *mut c_void, context: *mut c_void) {
    unsafe { crate::android::init(java_vm, context) };
}
