//! Stateless utilities shared by the native and WASM bridges.

/// Writes a lowercase, hyphenated UUID v4 (36 ASCII bytes, no trailing NUL).
/// Returns 0 for a null or undersized output; leaves it untouched.
///
/// # Safety
/// `out` must be writable for `len` bytes when non-null.
#[cfg(feature = "uuid")]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_uuid(out: *mut u8, len: usize) -> u8 {
    if out.is_null() || len < 36 {
        return 0;
    }
    let mut buffer = [0u8; 36];
    uuid::Uuid::new_v4().hyphenated().encode_lower(&mut buffer);
    unsafe { std::ptr::copy_nonoverlapping(buffer.as_ptr(), out, buffer.len()) };
    1
}

#[cfg(not(feature = "uuid"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_uuid(_: *mut u8, _: usize) -> u8 {
    0
}

#[cfg(all(test, feature = "uuid"))]
mod tests {
    use super::engine_uuid;
    use std::collections::HashSet;

    #[test]
    fn generates_distinct_v4_uuids_without_touching_adjacent_memory() {
        let mut seen = HashSet::new();
        for _ in 0..4096 {
            let mut output = [0xa5; 38];
            assert_eq!(unsafe { engine_uuid(output.as_mut_ptr().add(1), 36) }, 1);
            assert_eq!(output[0], 0xa5);
            assert_eq!(output[37], 0xa5);
            let text = std::str::from_utf8(&output[1..37]).unwrap();
            let id = uuid::Uuid::parse_str(text).unwrap();
            assert_eq!(id.get_version_num(), 4);
            assert_eq!(id.get_variant(), uuid::Variant::RFC4122);
            assert_eq!(id.to_string(), text);
            assert!(seen.insert(id));
        }
    }

    #[test]
    fn rejects_invalid_outputs_without_writing() {
        assert_eq!(unsafe { engine_uuid(std::ptr::null_mut(), 36) }, 0);
        let mut output = [0xa5; 36];
        for len in [0, 35] {
            assert_eq!(unsafe { engine_uuid(output.as_mut_ptr(), len) }, 0);
            assert_eq!(output, [0xa5; 36]);
        }
    }
}
