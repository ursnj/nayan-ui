//! Owned cache reads and prepared-asset entry points for JSI and WASM.
#![allow(clippy::missing_safety_doc)]
#[cfg(feature = "games")]
use crate::assets::cache;
#[cfg(feature = "games")]
use crate::assets::prepared;
pub struct EngineCacheBlob {
    bytes: Vec<u8>,
}
unsafe fn text<'a>(data: *const u8, length: usize) -> Option<&'a [u8]> {
    if data.is_null() || length == 0 || length > 1_000_000 {
        return None;
    }
    Some(unsafe { std::slice::from_raw_parts(data, length) })
}
unsafe fn key<'a>(data: *const u8, length: usize) -> Option<&'a str> {
    std::str::from_utf8(unsafe { text(data, length) }?).ok()
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_directory(path: *const u8, length: usize) -> i32 {
    let Some(path) = (unsafe { key(path, length) }) else { return 0 };
    #[cfg(all(feature = "sqlite", not(target_arch = "wasm32")))]
    crate::sqlite::set_directory(path);
    #[cfg(feature = "games")]
    let directory = cache::set_directory(path);
    #[cfg(not(feature = "games"))]
    let directory: Result<(), String> = Ok(());
    let _ = path;
    #[cfg(all(feature = "storage", not(target_arch = "wasm32")))]
    let directory = directory.and_then(|()| crate::storage::set_directory(path));
    crate::assets::record_error(directory.map(|_| 1)).unwrap_or(0)
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_read(data: *const u8, length: usize) -> *mut EngineCacheBlob {
    #[cfg(not(feature = "games"))]
    {
        let _ = (data, length);
        std::ptr::null_mut()
    }
    #[cfg(feature = "games")]
    {
        let Some(key) = (unsafe { key(data, length) }) else {
            return std::ptr::null_mut();
        };
        cache::read(key).map_or(std::ptr::null_mut(), |bytes| Box::into_raw(Box::new(EngineCacheBlob { bytes })))
    }
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_data(blob: *const EngineCacheBlob) -> *const u8 {
    unsafe { blob.as_ref() }.map_or(std::ptr::null(), |blob| blob.bytes.as_ptr())
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_size(blob: *const EngineCacheBlob) -> usize {
    unsafe { blob.as_ref() }.map_or(0, |blob| blob.bytes.len())
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_free(blob: *mut EngineCacheBlob) {
    if !blob.is_null() {
        drop(unsafe { Box::from_raw(blob) });
    }
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_write(data: *const u8, length: usize, bytes: *const u8, count: usize) -> i32 {
    #[cfg(not(feature = "games"))]
    {
        let _ = (data, length, bytes, count);
        super::no_games::disabled_asset();
        0
    }
    #[cfg(feature = "games")]
    {
        let Some(key) = (unsafe { key(data, length) }) else { return 0 };
        if bytes.is_null() || count > 512 * 1024 * 1024 {
            return 0;
        }
        crate::assets::record_error(cache::write(key, unsafe { std::slice::from_raw_parts(bytes, count) }).map(|_| 1)).unwrap_or(0)
    }
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_cache_remove(data: *const u8, length: usize) -> i32 {
    #[cfg(not(feature = "games"))]
    {
        let _ = (data, length);
        super::no_games::disabled_asset();
        0
    }
    #[cfg(feature = "games")]
    {
        let Some(key) = (unsafe { key(data, length) }) else { return 0 };
        crate::assets::record_error(cache::remove(key).map(|_| 1)).unwrap_or(0)
    }
}
#[unsafe(no_mangle)]
pub extern "C" fn engine_cache_clear() -> i32 {
    #[cfg(not(feature = "games"))]
    {
        super::no_games::disabled_asset();
        0
    }
    #[cfg(feature = "games")]
    {
        crate::assets::record_error(cache::clear().map(|_| 1)).unwrap_or(0)
    }
}
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_shape_prepare(
    vertices: *const f32,
    floats: usize,
    indices: *const u32,
    count: usize,
    options: *const u8,
    length: usize,
) -> i32 {
    let Some(options) = (unsafe { text(options, length) }) else { return -1 };
    if vertices.is_null() || indices.is_null() || floats > 44_000_000 || count > 24_000_000 {
        return -1;
    }
    let result = prepared::shape(
        unsafe { std::slice::from_raw_parts(vertices, floats) },
        unsafe { std::slice::from_raw_parts(indices, count) },
        options,
    );
    crate::assets::record_error(result).map_or(-1, i32::from)
}
#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_solid_prepare(recipe: *const u8, count: usize, options: *const u8, length: usize) -> i32 {
    let (Some(recipe), Some(options)) = (unsafe { text(recipe, count) }, unsafe { text(options, length) }) else {
        return -1;
    };
    crate::assets::record_error(prepared::solid(recipe, options)).map_or(-1, i32::from)
}
