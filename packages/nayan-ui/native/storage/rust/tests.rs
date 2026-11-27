use super::*;
struct Fixture(PathBuf);
impl Fixture {
    fn new() -> Self {
        Self(std::env::temp_dir().join(format!("nayan-store-test-{}", uuid::Uuid::new_v4())))
    }
    fn stores(&self) -> Stores {
        Stores {
            directory: Some(self.0.clone()),
            ..Stores::default()
        }
    }
    fn bytes(&self) -> Vec<u8> {
        std::fs::read(self.0.join("preferences.kv")).unwrap()
    }
    fn restore(&self, bytes: &[u8]) {
        std::fs::write(self.0.join("preferences.kv"), bytes).unwrap();
    }
}

const KEY: &str = "encrypted-storage-test-key-material";
const NEW_KEY: &str = "rotated-storage-test-key-material";

fn contains_bytes(file: &[u8], data: &[u8]) -> bool {
    file.windows(data.len()).any(|part| part == data)
}

#[test]
fn encryption_migrates_existing_data_and_checks_credentials_on_each_open() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let plain = stores.open("preferences", None, None).unwrap();
    stores.write(plain, "public-name", b"\x01public-value").unwrap();
    let handle = stores.open("private", None, None).unwrap();
    stores.write(handle, "private-key-name", b"\x01private-value").unwrap();
    drop(stores);
    let abandoned = dir.0.join(format!(".preferences-{}.tmp", uuid::Uuid::new_v4()));
    std::fs::copy(dir.0.join("preferences.kv"), &abandoned).unwrap();
    let mut stores = dir.stores();
    let plain = stores.open("preferences", None, None).unwrap();
    assert!(!abandoned.exists());
    assert_eq!(stores.read(plain, "public-name").unwrap(), b"\x01public-value");
    let handle = stores.open("private", None, None).unwrap();
    assert_eq!(stores.open("private", Some(KEY), Some(Algorithm::Aes256)).unwrap(), handle);
    assert_eq!(command(&mut stores, "isEncrypted", handle, ""), json!(true));
    assert!(stores.open("private", None, None).is_err());
    assert!(stores.open("private", Some(NEW_KEY), None).is_err());
    assert!(stores.open("private", Some(KEY), Some(Algorithm::Aes128)).is_err());
    stores.write(handle, "binary", &[4, 0, 255]).unwrap();
    command(&mut stores, "flush", handle, "");
    let bytes = dir.bytes();
    assert!(contains_bytes(&bytes, b"public-value"));
    for secret in [b"private-key-name".as_slice(), b"private-value", KEY.as_bytes()] {
        assert!(!contains_bytes(&bytes, secret));
    }
    drop(stores);
    let mut stores = dir.stores();
    assert!(stores.open("private", Some(NEW_KEY), None).is_err());
    assert_eq!(dir.bytes(), bytes);
    let handle = stores.open("private", Some(KEY), None).unwrap();
    assert_eq!(stores.read(handle, "private-key-name").unwrap(), b"\x01private-value");
    assert_eq!(stores.read(handle, "binary").unwrap(), [4, 0, 255]);
    assert_eq!(command(&mut stores, "contains", handle, "binary"), json!(true));
    assert_eq!(command(&mut stores, "remove", handle, "binary"), json!(true));
    assert_eq!(command(&mut stores, "keys", handle, ""), json!(["private-key-name"]));
}

#[test]
fn rotation_and_decryption_keep_values_and_update_shared_handles() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let handle = stores.open("session", Some(KEY), None).unwrap();
    assert_eq!(stores.open("session", Some(KEY), None).unwrap(), handle);
    stores.write(handle, "token", b"\x01session-value").unwrap();
    let rotate = |key| json!({"op":"encrypt", "handle":handle, "encryptionKey":key, "encryptionType":"AES-256"}).to_string();
    assert!(stores.command(&rotate("short")).is_err());
    assert!(stores.open("session", Some(KEY), None).is_ok());
    stores.command(&rotate(NEW_KEY)).unwrap();
    assert!(stores.open("session", Some(KEY), None).is_err());
    assert_eq!(stores.read(handle, "token").unwrap(), b"\x01session-value");
    drop(stores);
    let mut stores = dir.stores();
    let handle = stores.open("session", Some(NEW_KEY), Some(Algorithm::Aes256)).unwrap();
    assert_eq!(command(&mut stores, "isEncrypted", handle, ""), json!(true));
    command(&mut stores, "decrypt", handle, "");
    assert_eq!(command(&mut stores, "isEncrypted", handle, ""), json!(false));
    assert!(contains_bytes(&dir.bytes(), b"session-value"));
    drop(stores);
    let stores = &mut dir.stores();
    let handle = stores.open("session", None, None).unwrap();
    assert_eq!(stores.read(handle, "token").unwrap(), b"\x01session-value");
}

#[test]
fn compaction_preserves_locked_namespaces_and_empty_encrypted_stores() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let handle = stores.open("private", Some(KEY), None).unwrap();
    stores.write(handle, "keep", &[3, 1]).unwrap();
    drop(stores);
    let mut stores = dir.stores();
    let plain = stores.open("preferences", None, None).unwrap();
    let mut value = vec![1; 150_000];
    for i in 0..50 {
        value[1] = i;
        stores.write(plain, "temporary", &value).unwrap();
    }
    assert!(stores.database().unwrap().log.end < 3 * 1024 * 1024);
    let handle = stores.open("private", Some(KEY), None).unwrap();
    assert_eq!(stores.read(handle, "keep").unwrap(), [3, 1]);
    assert_eq!(command(&mut stores, "clear", handle, ""), json!(["keep"]));
    drop(stores);
    let mut stores = dir.stores();
    assert!(stores.open("private", None, None).is_err());
    let handle = stores.open("private", Some(KEY), None).unwrap();
    assert_eq!(command(&mut stores, "keys", handle, ""), json!([]));
}

#[test]
fn authentication_rejects_a_modified_ciphertext_even_with_a_valid_record_checksum() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let handle = stores.open("session", Some(KEY), None).unwrap();
    let start = stores.database().unwrap().log.end;
    stores.write(handle, "token", b"\x01private-value").unwrap();
    command(&mut stores, "flush", handle, "");
    let end = stores.database().unwrap().log.end;
    drop(stores);
    let mut bytes = dir.bytes();
    bytes[end - 1] ^= 1;
    let checksum = crc32fast::hash(&bytes[start + 8..end]);
    bytes[start + 4..start + 8].copy_from_slice(&checksum.to_le_bytes());
    dir.restore(&bytes);
    let mut stores = dir.stores();
    let handle = stores.open("session", Some(KEY), None).unwrap();
    assert!(stores.read(handle, "token").unwrap_err().contains("authentication"));
    assert!(stores.command(&json!({"op":"decrypt", "handle":handle}).to_string()).is_err());
    assert_eq!(dir.bytes(), bytes);
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
fn command(stores: &mut Stores, op: &str, handle: u32, key: &str) -> Value {
    stores.command(&json!({ "op":op, "handle":handle, "key":key }).to_string()).unwrap()
}
#[test]
fn values_survive_reopening_and_clear_is_scoped() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let a = stores.open("playtura", None, None).unwrap();
    let b = stores.open("other", None, None).unwrap();
    assert_eq!(stores.open("playtura", None, None).unwrap(), a);
    let text = [vec![1], "hello 🌏\0".as_bytes().to_vec()].concat();
    stores.write(a, "__proto__", &text).unwrap();
    stores.write(a, "empty", &[1]).unwrap();
    stores.write(b, "keep", &[3, 0]).unwrap();
    assert!(stores.read(a, "missing").unwrap().is_empty());
    assert_eq!(stores.read(a, "empty").unwrap(), [1]);
    command(&mut stores, "flush", a, "");
    drop(stores);
    let mut stores = dir.stores();
    let a = stores.open("playtura", None, None).unwrap();
    let b = stores.open("other", None, None).unwrap();
    assert_eq!(stores.read(a, "__proto__").unwrap(), text);
    assert_eq!(command(&mut stores, "keys", a, ""), json!(["__proto__", "empty"]));
    assert_eq!(command(&mut stores, "clear", a, ""), json!(["__proto__", "empty"]));
    drop(stores);
    let mut stores = dir.stores();
    let a = stores.open("playtura", None, None).unwrap();
    let b2 = stores.open("other", None, None).unwrap();
    assert!(stores.read(a, "__proto__").unwrap().is_empty());
    assert_eq!(stores.read(b2, "keep").unwrap(), [3, 0]);
    let _ = b;
}
#[test]
fn another_owner_is_rejected_and_releasing_it_allows_a_clean_reopen() {
    let dir = Fixture::new();
    let mut left = dir.stores();
    let mut right = dir.stores();
    let handle = left.open("shared", None, None).unwrap();
    left.write(handle, "value", &[3, 1]).unwrap();
    assert!(right.open("shared", None, None).unwrap_err().contains("another process"));
    drop(left);
    let handle = right.open("shared", None, None).unwrap();
    assert_eq!(right.read(handle, "value").unwrap(), [3, 1]);
    assert_eq!(command(&mut right, "remove", handle, "value"), json!(true));
    assert_eq!(command(&mut right, "remove", handle, "value"), json!(false));
}
#[test]
fn invalid_requests_do_not_replace_committed_values() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let handle = stores.open("test", None, None).unwrap();
    stores.write(handle, "key", &[3, 1]).unwrap();
    for bytes in [&[][..], &[0], &[2, 0], &[3, 2], &[1, 0xff]] {
        assert!(stores.write(handle, "key", bytes).is_err());
    }
    assert!(stores.write(handle, "", &[1]).is_err());
    assert!(stores.read(u32::MAX, "key").is_err());
    assert!(stores.command("{}").is_err());
    assert!(stores.command(&json!({"op":"clear", "handle":u64::MAX}).to_string()).is_err());
    assert_eq!(stores.read(handle, "key").unwrap(), [3, 1]);
}
#[test]
fn corrupt_files_are_reported_without_silently_resetting_them() {
    let dir = Fixture::new();
    std::fs::create_dir_all(&dir.0).unwrap();
    dir.restore(b"invalid database");
    assert!(dir.stores().open("test", None, None).is_err());
    assert_eq!(dir.bytes(), b"invalid database");
}
#[test]
fn remapping_and_compaction_preserve_values_namespaces_and_key_order() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let a = stores.open("a", None, None).unwrap();
    let b = stores.open("b", None, None).unwrap();
    stores.write(a, "first", &[1]).unwrap();
    stores.write(b, "other", &[3, 1]).unwrap();
    let mut value = vec![b'x'; 150_000];
    value[0] = 1;
    for i in 0..120 {
        value[1] = b'a' + i % 26;
        stores.write(a, "large", &value).unwrap();
    }
    stores.write(a, "new", &[3, 0]).unwrap();
    let database = stores.database.as_ref().unwrap();
    assert!(database.log.capacity() > 64 * 1024);
    assert!(database.log.end < 2 * 1024 * 1024);
    assert_eq!(stores.read(a, "large").unwrap(), value);
    assert_eq!(command(&mut stores, "keys", a, ""), json!(["first", "large", "new"]));
    drop(stores);
    let mut stores = dir.stores();
    let a = stores.open("a", None, None).unwrap();
    let b = stores.open("b", None, None).unwrap();
    assert_eq!(stores.read(a, "large").unwrap(), value);
    assert_eq!(stores.read(b, "other").unwrap(), [3, 1]);
    assert_eq!(command(&mut stores, "keys", a, ""), json!(["first", "large", "new"]));
}
#[test]
fn a_torn_buffered_tail_recovers_only_after_the_durable_boundary() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let h = stores.open("test", None, None).unwrap();
    stores.write(h, "durable", &[3, 1]).unwrap();
    command(&mut stores, "flush", h, "");
    stores.write(h, "buffered", &[3, 0]).unwrap();
    let mut crash = dir.bytes();
    let end = stores.database.as_ref().unwrap().log.end;
    crash[end - 1] ^= 0xff;
    drop(stores);
    dir.restore(&crash);
    let mut stores = dir.stores();
    let h = stores.open("test", None, None).unwrap();
    assert_eq!(stores.read(h, "durable").unwrap(), [3, 1]);
    assert!(stores.read(h, "buffered").unwrap().is_empty());
    stores.write(h, "after", &[1, b'x']).unwrap();
    drop(stores);
    let mut stores = dir.stores();
    let h = stores.open("test", None, None).unwrap();
    assert_eq!(stores.read(h, "after").unwrap(), [1, b'x']);
}
#[test]
fn corruption_inside_the_durable_prefix_is_never_rolled_back_to_resurrect_deleted_values() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let h = stores.open("session", None, None).unwrap();
    stores.write(h, "token", &[1, b'x']).unwrap();
    command(&mut stores, "remove", h, "token");
    let end = stores.database.as_ref().unwrap().log.end;
    drop(stores);
    let mut bytes = dir.bytes();
    bytes[end - 1] ^= 1;
    dir.restore(&bytes);
    assert!(dir.stores().open("session", None, None).unwrap_err().contains("corrupt durable"));
    assert_eq!(dir.bytes(), bytes);
}
#[test]
fn unpublished_bytes_and_a_torn_commit_slot_do_not_override_a_flushed_clear() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let h = stores.open("session", None, None).unwrap();
    stores.write(h, "token", &[1, b'x']).unwrap();
    command(&mut stores, "clear", h, "");
    let end = stores.database.as_ref().unwrap().log.end;
    drop(stores);
    let mut bytes = dir.bytes();
    bytes[end..end + 64].fill(0xa5);
    bytes[16..48].fill(0xff);
    dir.restore(&bytes);
    let mut stores = dir.stores();
    let h = stores.open("session", None, None).unwrap();
    assert!(stores.read(h, "token").unwrap().is_empty());
}

#[test]
fn binary_values_survive_durable_reopen_including_empty_and_invalid_utf8() {
    let directory = Fixture::new();
    let mut stores = directory.stores();
    let handle = stores.open("documents", None, None).unwrap();
    stores.write(handle, "binary", &[4, 0, 255, 128]).unwrap();
    stores.write(handle, "empty", &[4]).unwrap();
    command(&mut stores, "flush", handle, "");
    drop(stores);
    let mut stores = directory.stores();
    let handle = stores.open("documents", None, None).unwrap();
    assert_eq!(stores.read(handle, "binary").unwrap(), [4, 0, 255, 128]);
    assert_eq!(stores.read(handle, "empty").unwrap(), [4]);
}
