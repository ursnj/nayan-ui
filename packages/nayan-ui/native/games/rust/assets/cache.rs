//! Durable engine-owned records with no TTL or capacity eviction. Rust owns keys and validation.
//! Native uses app-private files; WASM delegates asynchronous IndexedDB I/O to the browser host.
pub use crate::fingerprint::fingerprint;
use sha2::{Digest, Sha256};
#[cfg(not(target_arch = "wasm32"))]
use std::{
    path::{Path, PathBuf},
    sync::Mutex,
};

const MAGIC: &[u8; 8] = b"NAYANC01";
const MAX_RECORD: usize = 512 * 1024 * 1024;
#[cfg(not(target_arch = "wasm32"))]
static DIRECTORY: Mutex<Option<PathBuf>> = Mutex::new(None);

pub(super) fn encode(key: &str, bytes: &[u8]) -> Result<Vec<u8>, String> {
    if key.len() > 1_000_000 || bytes.len() > MAX_RECORD {
        return Err("engine cache record is too large".into());
    }
    let mut out = Vec::with_capacity(52 + key.len() + bytes.len());
    out.extend_from_slice(MAGIC);
    out.extend_from_slice(&(key.len() as u32).to_le_bytes());
    out.extend_from_slice(&(bytes.len() as u64).to_le_bytes());
    let mut checksum = Sha256::new();
    checksum.update(key.as_bytes());
    checksum.update(bytes);
    out.extend_from_slice(&checksum.finalize());
    out.extend_from_slice(key.as_bytes());
    out.extend_from_slice(bytes);
    Ok(out)
}
pub(super) fn decode(key: &str, raw: &[u8]) -> Option<Vec<u8>> {
    if raw.len() < 52 || &raw[..8] != MAGIC {
        return None;
    }
    let key_len = u32::from_le_bytes(raw[8..12].try_into().ok()?) as usize;
    let size = usize::try_from(u64::from_le_bytes(raw[12..20].try_into().ok()?)).ok()?;
    let offset = 52usize.checked_add(key_len)?;
    if size > MAX_RECORD || offset.checked_add(size)? != raw.len() || raw.get(52..offset)? != key.as_bytes() {
        return None;
    }
    let mut checksum = Sha256::new();
    checksum.update(key.as_bytes());
    checksum.update(&raw[offset..]);
    if checksum.finalize().as_slice() != &raw[20..52] {
        return None;
    }
    Some(raw[offset..].to_vec())
}
#[cfg(not(target_arch = "wasm32"))]
pub fn set_directory(path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("engine cache directory is empty".into());
    }
    let root = PathBuf::from(path).join("nayan-engine-assets-v1");
    std::fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    *DIRECTORY.lock().map_err(|_| "engine cache lock")? = Some(root);
    Ok(())
}
#[cfg(target_arch = "wasm32")]
pub fn set_directory(_path: &str) -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_arch = "wasm32"))]
fn disk_read(root: &Path, key: &str) -> Option<Vec<u8>> {
    let file = root.join(format!("{}.asset", fingerprint(&[key.as_bytes()])));
    let size = std::fs::metadata(&file).ok()?.len();
    if size > (MAX_RECORD + 1_000_052) as u64 {
        return None;
    }
    decode(key, &std::fs::read(file).ok()?)
}
#[cfg(not(target_arch = "wasm32"))]
fn disk_write(root: &Path, key: &str, bytes: &[u8]) -> Result<(), String> {
    use std::io::Write;
    let name = fingerprint(&[key.as_bytes()]);
    let temporary = root.join(format!("{name}.asset.tmp"));
    let target = root.join(format!("{name}.asset"));
    let result = (|| {
        let mut file = std::fs::File::create(&temporary)?;
        file.write_all(&encode(key, bytes).map_err(std::io::Error::other)?)?;
        // No fsync: this runs on the JS thread, and records are a rebuildable cache. A file torn
        // or emptied by a crash fails `decode`'s length and SHA-256 checks and reads as a miss.
        std::fs::rename(&temporary, &target)
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(temporary);
    }
    result.map_err(|e| e.to_string())
}

#[cfg(not(target_arch = "wasm32"))]
pub fn read(key: &str) -> Option<Vec<u8>> {
    let directory = DIRECTORY.lock().ok()?;
    disk_read(directory.as_ref()?, key)
}
#[cfg(not(target_arch = "wasm32"))]
pub fn write(key: &str, bytes: &[u8]) -> Result<(), String> {
    let directory = DIRECTORY.lock().map_err(|_| "engine cache lock")?;
    let root = directory.as_ref().ok_or("engine persistent storage is not configured")?;
    disk_write(root, key, bytes)
}
#[cfg(not(target_arch = "wasm32"))]
pub fn remove(key: &str) -> Result<(), String> {
    let directory = DIRECTORY.lock().map_err(|_| "engine cache lock")?;
    if let Some(root) = directory.as_ref() {
        let path = root.join(format!("{}.asset", fingerprint(&[key.as_bytes()])));
        match std::fs::remove_file(path) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(e.to_string()),
        }
    }
    Ok(())
}
#[cfg(not(target_arch = "wasm32"))]
pub fn clear() -> Result<(), String> {
    let directory = DIRECTORY.lock().map_err(|_| "engine cache lock")?;
    if let Some(root) = directory.as_ref() {
        // Explicit user action only. Never touch files outside this engine's private directory.
        for entry in std::fs::read_dir(root).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name.ends_with(".asset") || name.ends_with(".asset.tmp") {
                std::fs::remove_file(entry.path()).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

#[cfg(target_arch = "wasm32")]
pub use super::cache_browser::{clear, read, remove, write};

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn records_validate_full_keys_length_and_checksum() {
        let bytes = encode("模型:key", &[0, 128, 255]).unwrap();
        assert_eq!(decode("模型:key", &bytes), Some(vec![0, 128, 255]));
        assert!(decode("another key", &bytes).is_none());
        for index in [0, 8, 12, 20, bytes.len() - 1] {
            let mut bad = bytes.clone();
            bad[index] ^= 1;
            assert!(decode("模型:key", &bad).is_none());
        }
        assert!(decode("模型:key", &bytes[..bytes.len() - 1]).is_none());
    }
    #[cfg(not(target_arch = "wasm32"))]
    #[test]
    fn files_survive_new_readers_and_do_not_evict_previous_records() {
        let root = std::env::temp_dir().join(format!("nayan-cache-test-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        for i in 0..150 {
            disk_write(&root, &format!("key:{i}"), &[i as u8]).unwrap();
        }
        assert_eq!(std::fs::read_dir(&root).unwrap().count(), 150);
        for i in 0..150 {
            assert_eq!(disk_read(&root, &format!("key:{i}")), Some(vec![i as u8]));
        }
        let file = root.join(format!("{}.asset", fingerprint(&[b"key:0"])));
        std::fs::write(file, b"corrupt").unwrap();
        assert!(disk_read(&root, "key:0").is_none());
        disk_write(&root, "key:0", b"rebuilt").unwrap();
        assert_eq!(disk_read(&root, "key:0"), Some(b"rebuilt".to_vec()));
        std::fs::remove_dir_all(root).unwrap();
    }
}
