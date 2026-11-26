use serde_json::{Value, json};
use std::{
    ffi::{CStr, CString, c_char},
    fs::{self, File},
    io::{self, Read},
    os::fd::{BorrowedFd, RawFd},
    path::{Path, PathBuf},
};
use uuid::Uuid;

fn valid_extension(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 24
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"_-".contains(&byte))
}

fn cache_copy(root: &Path, name: &str, mut input: impl Read) -> io::Result<(PathBuf, u64)> {
    fs::create_dir_all(root)?;
    let mut output = root.join(Uuid::new_v4().to_string());
    if let Some(extension) = Path::new(name)
        .extension()
        .and_then(|value| value.to_str())
        .filter(|value| valid_extension(value))
    {
        output.set_extension(extension);
    }
    let mut file = File::create_new(&output)?;
    let result = io::copy(&mut input, &mut file);
    drop(file);
    match result {
        Ok(size) => Ok((output, size)),
        Err(error) => {
            let _ = fs::remove_file(output);
            Err(error)
        }
    }
}

fn cache_release(root: &Path, path: &Path) -> io::Result<()> {
    let id = path
        .file_stem()
        .and_then(|value| value.to_str())
        .and_then(|value| Uuid::parse_str(value).ok());
    if path.parent() != Some(root)
        || id.is_none_or(|id| id.get_version_num() != 4)
        || path
            .extension()
            .is_some_and(|value| !value.to_str().is_some_and(valid_extension))
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Only cached documents can be released",
        ));
    }
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error),
    }
}

fn response(result: io::Result<Value>) -> *mut c_char {
    let value = result.unwrap_or_else(|error| json!({"error":error.to_string()}));
    CString::new(value.to_string()).unwrap().into_raw()
}

/// # Safety
/// Both strings must point to NUL-terminated UTF-8. The caller keeps the descriptor open until this returns.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_document_cache_copy(
    root: *const c_char,
    name: *const c_char,
    source: RawFd,
) -> *mut c_char {
    response((|| {
        if source < 0 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid document descriptor",
            ));
        }
        let root = unsafe { CStr::from_ptr(root) }
            .to_str()
            .map_err(io::Error::other)?;
        let name = unsafe { CStr::from_ptr(name) }
            .to_str()
            .map_err(io::Error::other)?;
        let input = unsafe { BorrowedFd::borrow_raw(source) }.try_clone_to_owned()?;
        let (path, size) = cache_copy(Path::new(root), name, File::from(input))?;
        Ok(json!({"path":path,"size":size}))
    })())
}

/// # Safety
/// Both strings must point to NUL-terminated UTF-8.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_document_cache_release(
    root: *const c_char,
    path: *const c_char,
) -> *mut c_char {
    response((|| {
        let root = unsafe { CStr::from_ptr(root) }
            .to_str()
            .map_err(io::Error::other)?;
        let path = unsafe { CStr::from_ptr(path) }
            .to_str()
            .map_err(io::Error::other)?;
        cache_release(Path::new(root), Path::new(path))?;
        Ok(Value::Null)
    })())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn copies_to_unique_owned_paths_and_removes_partial_writes() {
        let dir = std::env::temp_dir().join(Uuid::new_v4().to_string());
        let (first, size) = cache_copy(&dir, "../../résumé.pdf", &b"pdf"[..]).unwrap();
        let (second, _) = cache_copy(&dir, "résumé.pdf", &b"pdf2"[..]).unwrap();
        assert_ne!(first, second);
        assert_eq!(first.extension().unwrap(), "pdf");
        assert_eq!(fs::read(&first).unwrap(), b"pdf");
        assert_eq!(size, 3);
        assert!(cache_release(&dir, &dir.join("../elsewhere.pdf")).is_err());

        struct Broken;
        impl Read for Broken {
            fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
                Err(io::Error::other("failed provider"))
            }
        }
        assert!(cache_copy(&dir, "broken.pdf", Broken).is_err());
        assert_eq!(fs::read_dir(&dir).unwrap().count(), 2);
        cache_release(&dir, &first).unwrap();
        cache_release(&dir, &first).unwrap();
        cache_release(&dir, &second).unwrap();
        fs::remove_dir(dir).unwrap();
    }
}
