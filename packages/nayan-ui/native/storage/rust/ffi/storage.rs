//! Owned storage results; all error paths preserve the previously committed database.
use std::ffi::{CString, c_char};

pub struct EngineStorageResult {
    bytes: Vec<u8>,
    error: CString,
}
fn result(value: Result<Vec<u8>, String>) -> *mut EngineStorageResult {
    let (bytes, error) = match value {
        Ok(bytes) => (bytes, String::new()),
        Err(error) => (vec![], error.replace('\0', " ")),
    };
    Box::into_raw(Box::new(EngineStorageResult {
        bytes,
        error: CString::new(error).unwrap(),
    }))
}
#[cfg(feature = "storage")]
mod store {
    use super::*;
    unsafe fn text<'a>(ptr: *const u8, len: usize) -> Result<&'a str, String> {
        if ptr.is_null() || len > 1_000_000 {
            return Err("invalid storage text".into());
        }
        std::str::from_utf8(unsafe { std::slice::from_raw_parts(ptr, len) }).map_err(|_| "invalid UTF-8".into())
    }
    /// # Safety
    /// `command` points to `len` readable bytes.
    #[unsafe(no_mangle)]
    pub unsafe extern "C" fn engine_storage_request(command: *const u8, len: usize) -> *mut EngineStorageResult {
        result(unsafe { text(command, len) }.map(|c| crate::storage::request(c).into_bytes()))
    }
    /// # Safety
    /// `key` points to `len` readable bytes.
    #[unsafe(no_mangle)]
    pub unsafe extern "C" fn engine_storage_read(handle: u32, key: *const u8, len: usize) -> *mut EngineStorageResult {
        result(unsafe { text(key, len) }.and_then(|key| crate::storage::read(handle, key)))
    }
    /// # Safety
    /// `key` and `value` point to their respective readable byte counts.
    #[unsafe(no_mangle)]
    pub unsafe extern "C" fn engine_storage_write(
        handle: u32,
        key: *const u8,
        len: usize,
        value: *const u8,
        count: usize,
    ) -> *mut EngineStorageResult {
        result((|| {
            let key = unsafe { text(key, len) }?;
            if value.is_null() || count == 0 || count > 512 * 1024 * 1024 {
                return Err("invalid storage value".into());
            }
            crate::storage::write(handle, key, unsafe { std::slice::from_raw_parts(value, count) })?;
            Ok(vec![])
        })())
    }
}

#[cfg(not(feature = "storage"))]
mod store {
    use super::*;
    const DISABLED: &str = "Storage was disabled in this engine build";

    #[unsafe(no_mangle)]
    pub unsafe extern "C" fn engine_storage_request(_: *const u8, _: usize) -> *mut EngineStorageResult {
        result(Err(DISABLED.into()))
    }
    #[unsafe(no_mangle)]
    pub unsafe extern "C" fn engine_storage_read(_: u32, _: *const u8, _: usize) -> *mut EngineStorageResult {
        result(Err(DISABLED.into()))
    }
    #[unsafe(no_mangle)]
    pub unsafe extern "C" fn engine_storage_write(_: u32, _: *const u8, _: usize, _: *const u8, _: usize) -> *mut EngineStorageResult {
        result(Err(DISABLED.into()))
    }
}
pub use store::*;

/// # Safety
/// `ptr` is null or an unreleased result returned by a storage operation.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_storage_data(ptr: *const EngineStorageResult) -> *const u8 {
    unsafe { ptr.as_ref() }.map_or(std::ptr::null(), |r| r.bytes.as_ptr())
}
/// # Safety
/// `ptr` is null or an unreleased storage result.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_storage_size(ptr: *const EngineStorageResult) -> usize {
    unsafe { ptr.as_ref() }.map_or(0, |r| r.bytes.len())
}
/// # Safety
/// `ptr` is null or an unreleased storage result. The error is valid until the result is freed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_storage_error(ptr: *const EngineStorageResult) -> *const c_char {
    unsafe { ptr.as_ref() }.map_or(c"invalid storage result".as_ptr(), |r| r.error.as_ptr())
}
/// # Safety
/// `ptr` is null or an unreleased storage result, and is released exactly once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_storage_free(ptr: *mut EngineStorageResult) {
    if !ptr.is_null() {
        drop(unsafe { Box::from_raw(ptr) });
    }
}
