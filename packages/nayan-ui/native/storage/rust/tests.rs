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
    let a = stores.open("playtura").unwrap();
    let b = stores.open("other").unwrap();
    assert_eq!(stores.open("playtura").unwrap(), a);
    let text = [vec![1], "hello 🌏\0".as_bytes().to_vec()].concat();
    stores.write(a, "__proto__", &text).unwrap();
    stores.write(a, "empty", &[1]).unwrap();
    stores.write(b, "keep", &[3, 0]).unwrap();
    assert!(stores.read(a, "missing").unwrap().is_empty());
    assert_eq!(stores.read(a, "empty").unwrap(), [1]);
    command(&mut stores, "flush", a, "");
    drop(stores);
    let mut stores = dir.stores();
    let a = stores.open("playtura").unwrap();
    let b = stores.open("other").unwrap();
    assert_eq!(stores.read(a, "__proto__").unwrap(), text);
    assert_eq!(command(&mut stores, "keys", a, ""), json!(["__proto__", "empty"]));
    assert_eq!(command(&mut stores, "clear", a, ""), json!(["__proto__", "empty"]));
    drop(stores);
    let mut stores = dir.stores();
    let a = stores.open("playtura").unwrap();
    let b2 = stores.open("other").unwrap();
    assert!(stores.read(a, "__proto__").unwrap().is_empty());
    assert_eq!(stores.read(b2, "keep").unwrap(), [3, 0]);
    let _ = b;
}
#[test]
fn another_owner_is_rejected_and_releasing_it_allows_a_clean_reopen() {
    let dir = Fixture::new();
    let mut left = dir.stores();
    let mut right = dir.stores();
    let handle = left.open("shared").unwrap();
    left.write(handle, "value", &[3, 1]).unwrap();
    assert!(right.open("shared").unwrap_err().contains("another process"));
    drop(left);
    let handle = right.open("shared").unwrap();
    assert_eq!(right.read(handle, "value").unwrap(), [3, 1]);
    assert_eq!(command(&mut right, "remove", handle, "value"), json!(true));
    assert_eq!(command(&mut right, "remove", handle, "value"), json!(false));
}
#[test]
fn invalid_requests_do_not_replace_committed_values() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let handle = stores.open("test").unwrap();
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
    assert!(dir.stores().open("test").is_err());
    assert_eq!(dir.bytes(), b"invalid database");
}
#[test]
fn remapping_and_compaction_preserve_values_namespaces_and_key_order() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let a = stores.open("a").unwrap();
    let b = stores.open("b").unwrap();
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
    let a = stores.open("a").unwrap();
    let b = stores.open("b").unwrap();
    assert_eq!(stores.read(a, "large").unwrap(), value);
    assert_eq!(stores.read(b, "other").unwrap(), [3, 1]);
    assert_eq!(command(&mut stores, "keys", a, ""), json!(["first", "large", "new"]));
}
#[test]
fn a_torn_buffered_tail_recovers_only_after_the_durable_boundary() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let h = stores.open("test").unwrap();
    stores.write(h, "durable", &[3, 1]).unwrap();
    command(&mut stores, "flush", h, "");
    stores.write(h, "buffered", &[3, 0]).unwrap();
    let mut crash = dir.bytes();
    let end = stores.database.as_ref().unwrap().log.end;
    crash[end - 1] ^= 0xff;
    drop(stores);
    dir.restore(&crash);
    let mut stores = dir.stores();
    let h = stores.open("test").unwrap();
    assert_eq!(stores.read(h, "durable").unwrap(), [3, 1]);
    assert!(stores.read(h, "buffered").unwrap().is_empty());
    stores.write(h, "after", &[1, b'x']).unwrap();
    drop(stores);
    let mut stores = dir.stores();
    let h = stores.open("test").unwrap();
    assert_eq!(stores.read(h, "after").unwrap(), [1, b'x']);
}
#[test]
fn corruption_inside_the_durable_prefix_is_never_rolled_back_to_resurrect_deleted_values() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let h = stores.open("session").unwrap();
    stores.write(h, "token", &[1, b'x']).unwrap();
    command(&mut stores, "remove", h, "token");
    let end = stores.database.as_ref().unwrap().log.end;
    drop(stores);
    let mut bytes = dir.bytes();
    bytes[end - 1] ^= 1;
    dir.restore(&bytes);
    assert!(dir.stores().open("session").unwrap_err().contains("corrupt durable"));
    assert_eq!(dir.bytes(), bytes);
}
#[test]
fn unpublished_bytes_and_a_torn_commit_slot_do_not_override_a_flushed_clear() {
    let dir = Fixture::new();
    let mut stores = dir.stores();
    let h = stores.open("session").unwrap();
    stores.write(h, "token", &[1, b'x']).unwrap();
    command(&mut stores, "clear", h, "");
    let end = stores.database.as_ref().unwrap().log.end;
    drop(stores);
    let mut bytes = dir.bytes();
    bytes[end..end + 64].fill(0xa5);
    bytes[16..48].fill(0xff);
    dir.restore(&bytes);
    let mut stores = dir.stores();
    let h = stores.open("session").unwrap();
    assert!(stores.read(h, "token").unwrap().is_empty());
}

#[test]
fn binary_values_survive_durable_reopen_including_empty_and_invalid_utf8() {
    let directory = Fixture::new();
    let mut stores = directory.stores();
    let handle = stores.open("documents").unwrap();
    stores.write(handle, "binary", &[4, 0, 255, 128]).unwrap();
    stores.write(handle, "empty", &[4]).unwrap();
    command(&mut stores, "flush", handle, "");
    drop(stores);
    let mut stores = directory.stores();
    let handle = stores.open("documents").unwrap();
    assert_eq!(stores.read(handle, "binary").unwrap(), [4, 0, 255, 128]);
    assert_eq!(stores.read(handle, "empty").unwrap(), [4]);
}
