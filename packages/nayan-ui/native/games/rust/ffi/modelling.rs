//! Owned, reentrant modelling results. The bridge copies their buffers and frees each handle.
#![allow(clippy::missing_safety_doc)]

#[cfg(feature = "games")]
use crate::assets::{
    geometry,
    modelling::{self, Geometry},
};
use std::ffi::{CString, c_char};

pub struct EngineGeometry {
    data: Vec<u32>,
    error: CString,
}

#[cfg(not(feature = "games"))]
pub(crate) fn unavailable() -> *mut EngineGeometry {
    Box::into_raw(Box::new(EngineGeometry {
        data: Vec::new(),
        error: CString::new(super::no_games::DISABLED).unwrap(),
    }))
}

#[cfg(feature = "games")]
pub(crate) fn result(value: Result<Geometry, String>) -> *mut EngineGeometry {
    let (data, error) = match value {
        Ok(g) => {
            let mut data = Vec::with_capacity(2 + g.vertices.len() + g.indices.len());
            data.push((g.vertices.len() / geometry::VERTEX_FLOATS) as u32);
            data.push(g.indices.len() as u32);
            data.extend(g.vertices.into_iter().map(f32::to_bits));
            data.extend(g.indices);
            (data, CString::default())
        }
        Err(error) => (Vec::new(), CString::new(error.replace('\0', " ")).unwrap_or_default()),
    };
    Box::into_raw(Box::new(EngineGeometry { data, error }))
}

#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_solid(recipe: *const u8, len: usize) -> *mut EngineGeometry {
    if recipe.is_null() || len == 0 || len > 1_000_000 {
        return result(Err("invalid solid recipe buffer".into()));
    }
    result(modelling::generate(unsafe { std::slice::from_raw_parts(recipe, len) }))
}

#[cfg(feature = "games")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_optimize(
    vertices: *const f32,
    floats: usize,
    indices: *const u32,
    count: usize,
    ratio: f32,
    error: f32,
    lock_borders: i32,
) -> *mut EngineGeometry {
    if floats > 44_000_000 || count > 24_000_000 || (floats > 0 && vertices.is_null()) || (count > 0 && indices.is_null()) {
        return result(Err("invalid or oversized geometry buffer".into()));
    }
    let v = if floats == 0 {
        &[]
    } else {
        unsafe { std::slice::from_raw_parts(vertices, floats) }
    };
    let i = if count == 0 {
        &[]
    } else {
        unsafe { std::slice::from_raw_parts(indices, count) }
    };
    result(geometry::optimize(v, i, ratio, error, lock_borders != 0))
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_data(result: *const EngineGeometry) -> *const u32 {
    unsafe { result.as_ref() }.map_or(std::ptr::null(), |r| r.data.as_ptr())
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_size(result: *const EngineGeometry) -> usize {
    unsafe { result.as_ref() }.map_or(0, |r| r.data.len() * 4)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_error(result: *const EngineGeometry) -> *const c_char {
    unsafe { result.as_ref() }.map_or(c"invalid geometry result".as_ptr(), |r| r.error.as_ptr())
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_geometry_free(result: *mut EngineGeometry) {
    if !result.is_null() {
        drop(unsafe { Box::from_raw(result) });
    }
}

#[cfg(all(test, feature = "games"))]
mod tests {
    use super::*;
    #[test]
    fn independent_results_survive_later_requests_and_errors() {
        unsafe {
            let json = br#"{"solid":{"kind":"sphere","radius":1},"resolution":16}"#;
            let a = engine_geometry_solid(json.as_ptr(), json.len());
            let bytes = engine_geometry_size(a);
            let b = engine_geometry_solid(std::ptr::null(), 0);
            assert!(bytes > 8);
            assert_eq!(engine_geometry_size(a), bytes);
            assert_eq!(engine_geometry_size(b), 0);
            assert_ne!(*engine_geometry_error(b), 0);
            engine_geometry_free(a);
            engine_geometry_free(b);
        }
    }
}
