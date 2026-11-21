//! Memory-cached preferences with a checksummed, append-only memory-mapped file.
//! One process owns the file. Buffered sets avoid per-write fsync; flush, remove and clear are durable.
mod log;
#[cfg(test)]
mod tests;
use log::{CLEAR, HEADER, Log, REMOVE, SET, record_size};
use serde_json::{Value, json};
use std::{
    collections::HashMap,
    fs::{File, OpenOptions},
    path::{Path, PathBuf},
    sync::{Mutex, OnceLock},
};

type Result<T> = std::result::Result<T, String>;
struct Entry {
    value: Vec<u8>,
    order: u64,
}
#[derive(Default)]
struct Cache {
    stores: HashMap<String, HashMap<String, Entry>>,
    bytes: usize,
    next_order: u64,
}
impl Cache {
    fn apply(&mut self, op: u8, id: &str, key: &str, value: &[u8], _sequence: u64) {
        let entries = self.stores.entry(id.to_owned()).or_default();
        match op {
            SET => {
                let order = if let Some(old) = entries.get(key) {
                    self.bytes -= record_size(id, key, &old.value);
                    old.order
                } else {
                    self.next_order += 1;
                    self.next_order
                };
                self.bytes += record_size(id, key, value);
                entries.insert(
                    key.to_owned(),
                    Entry {
                        value: value.to_vec(),
                        order,
                    },
                );
            }
            REMOVE => {
                if let Some(old) = entries.remove(key) {
                    self.bytes -= record_size(id, key, &old.value);
                }
            }
            CLEAR => {
                for (key, old) in entries.drain() {
                    self.bytes -= record_size(id, &key, &old.value);
                }
            }
            _ => unreachable!(),
        }
    }
    fn read(&self, id: &str, key: &str) -> Option<&[u8]> {
        self.stores.get(id)?.get(key).map(|entry| entry.value.as_slice())
    }
    fn keys(&self, id: &str) -> Vec<String> {
        let mut keys: Vec<_> = self.stores.get(id).into_iter().flatten().collect();
        keys.sort_unstable_by_key(|(_, e)| e.order);
        keys.into_iter().map(|(k, _)| k.clone()).collect()
    }
}
fn valid_value(value: &[u8]) -> bool {
    value.len() <= 512 * 1024 * 1024
        && match value.first() {
            Some(1) => std::str::from_utf8(&value[1..]).is_ok(),
            Some(2) => value.len() == 9,
            Some(4) => true, // Opaque binary data, including an empty buffer.
            Some(3) => value.len() == 2 && value[1] <= 1,
            _ => false,
        }
}
fn io<T>(result: std::io::Result<T>) -> Result<T> {
    result.map_err(|e| e.to_string())
}
fn sync_directory(root: &Path) -> Result<()> {
    #[cfg(unix)]
    {
        io(File::open(root).and_then(|f| f.sync_all()))?;
    }
    Ok(())
}
// The lock file is never renamed. It excludes other processes even while compaction atomically
// replaces the mapped data inode. Native Rust's global Stores shares this owner across JS runtimes.
struct Database {
    log: Log,
    cache: Cache,
    directory: PathBuf,
    _owner: File,
}
impl Database {
    fn open(directory: &Path) -> Result<Self> {
        io(std::fs::create_dir_all(directory))?;
        let mut options = OpenOptions::new();
        options.read(true).write(true).create(true).truncate(false);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let owner = io(options.open(directory.join("preferences.lock")))?;
        owner
            .try_lock()
            .map_err(|e| format!("storage is already owned by another process: {e}"))?;
        let path = directory.join("preferences.kv");
        let (log, cache) = if path.exists() {
            Log::open(&path)?
        } else {
            let cache = Cache::default();
            let (log, temporary) = Self::snapshot(directory, &cache)?;
            if let Err(error) = std::fs::rename(&temporary, &path) {
                drop(log);
                let _ = std::fs::remove_file(temporary);
                return Err(error.to_string());
            }
            sync_directory(directory)?;
            (log, cache)
        };
        Ok(Self {
            log,
            cache,
            directory: directory.into(),
            _owner: owner,
        })
    }
    fn snapshot(directory: &Path, cache: &Cache) -> Result<(Log, PathBuf)> {
        let temporary = directory.join(format!(".preferences-{}.tmp", uuid::Uuid::new_v4()));
        let result = (|| {
            let mut log = Log::create(&temporary)?;
            let mut records: Vec<_> = cache
                .stores
                .iter()
                .flat_map(|(id, entries)| entries.iter().map(move |(key, entry)| (id, key, entry)))
                .collect();
            records.sort_unstable_by_key(|(_, _, entry)| entry.order);
            for (id, key, entry) in records {
                log.append(SET, id, key, &entry.value)?;
            }
            log.flush()?;
            Ok(log)
        })();
        match result {
            Ok(log) => Ok((log, temporary)),
            Err(error) => {
                let _ = std::fs::remove_file(temporary);
                Err(error)
            }
        }
    }
    fn compact_if_needed(&mut self) -> Result<()> {
        if self.log.end > 1024 * 1024 && self.log.end.saturating_sub(HEADER) > self.cache.bytes.saturating_mul(3).saturating_add(1024 * 1024) {
            let (log, temporary) = Self::snapshot(&self.directory, &self.cache)?;
            if let Err(error) = std::fs::rename(&temporary, self.directory.join("preferences.kv")) {
                drop(log);
                let _ = std::fs::remove_file(temporary);
                return Err(error.to_string());
            }
            // Rename is the commit point. Adopt the new map before directory syncing, so even if
            // that sync fails, later operations cannot accidentally write to the replaced inode.
            self.log = log;
            sync_directory(&self.directory)?;
        }
        Ok(())
    }
    fn append(&mut self, op: u8, id: &str, key: &str, value: &[u8]) -> Result<()> {
        self.compact_if_needed()?;
        let sequence = self.log.append(op, id, key, value)?;
        self.cache.apply(op, id, key, value, sequence);
        Ok(())
    }
}
impl Drop for Database {
    fn drop(&mut self) {
        let _ = self.log.flush();
    }
}
#[derive(Default)]
struct Stores {
    directory: Option<PathBuf>,
    database: Option<Database>,
    next: u32,
    handles: HashMap<u32, String>,
    ids: HashMap<String, u32>,
}
fn stores() -> &'static Mutex<Stores> {
    static STORES: OnceLock<Mutex<Stores>> = OnceLock::new();
    STORES.get_or_init(|| Mutex::new(Stores::default()))
}
impl Stores {
    fn database(&mut self) -> Result<&mut Database> {
        if self.database.is_none() {
            self.database = Some(Database::open(
                self.directory.as_deref().ok_or("storage directory has not been initialized")?,
            )?);
        }
        Ok(self.database.as_mut().unwrap())
    }
    fn open(&mut self, id: &str) -> Result<u32> {
        if id.is_empty() || id.len() > 1_000_000 {
            return Err("invalid store id".into());
        }
        self.database()?;
        if let Some(handle) = self.ids.get(id) {
            return Ok(*handle);
        }
        self.next = self.next.checked_add(1).ok_or("too many storage namespaces")?;
        self.handles.insert(self.next, id.into());
        self.ids.insert(id.into(), self.next);
        Ok(self.next)
    }
    fn id(&self, handle: u32) -> Result<&str> {
        self.handles
            .get(&handle)
            .map(String::as_str)
            .ok_or_else(|| "unknown storage handle".into())
    }
    fn read(&self, handle: u32, key: &str) -> Result<Vec<u8>> {
        let id = self.id(handle)?;
        Ok(self
            .database
            .as_ref()
            .ok_or("storage has not been opened")?
            .cache
            .read(id, key)
            .unwrap_or_default()
            .to_vec())
    }
    fn write(&mut self, handle: u32, key: &str, value: &[u8]) -> Result<()> {
        if key.is_empty() || key.len() > 1_000_000 || !valid_value(value) {
            return Err("invalid storage key or value".into());
        }
        let id = self.id(handle)?.to_owned();
        self.database()?.append(SET, &id, key, value)
    }
    fn command(&mut self, command: &str) -> Result<Value> {
        let c: Value = serde_json::from_str(command).map_err(|e| e.to_string())?;
        let op = c["op"].as_str().ok_or("missing storage operation")?;
        if op == "open" {
            return Ok(json!(self.open(c["id"].as_str().ok_or("missing id")?)?));
        }
        // A lifecycle flush can run before any namespace is opened, and flushes the shared file.
        if op == "flush" {
            if let Some(database) = &mut self.database {
                database.log.flush()?;
            }
            return Ok(Value::Null);
        }
        let handle = c["handle"].as_u64().and_then(|n| u32::try_from(n).ok()).ok_or("invalid handle")?;
        let id = self.id(handle)?.to_owned();
        let key = c["key"].as_str().unwrap_or_default();
        let database = self.database()?;
        match op {
            "contains" => Ok(json!(database.cache.read(&id, key).is_some())),
            "keys" => Ok(json!(database.cache.keys(&id))),
            "remove" => {
                let exists = database.cache.read(&id, key).is_some();
                if exists {
                    database.append(REMOVE, &id, key, &[])?;
                }
                database.log.flush()?;
                Ok(json!(exists))
            }
            "clear" => {
                let keys = database.cache.keys(&id);
                if !keys.is_empty() {
                    database.append(CLEAR, &id, "", &[])?;
                }
                database.log.flush()?;
                Ok(json!(keys))
            }
            _ => Err(format!("unknown storage operation {op}")),
        }
    }
}
pub fn set_directory(path: &str) -> Result<()> {
    let directory = Path::new(path).join("nayan-engine-store-v1");
    let mut store = stores().lock().map_err(|_| "storage lock")?;
    if store.directory.as_ref().is_some_and(|old| old != &directory) && store.database.is_some() {
        return Err("cannot change an open storage directory".into());
    }
    store.directory = Some(directory);
    Ok(())
}
pub fn read(handle: u32, key: &str) -> Result<Vec<u8>> {
    stores().lock().map_err(|_| "storage lock")?.read(handle, key)
}
pub fn write(handle: u32, key: &str, value: &[u8]) -> Result<()> {
    stores().lock().map_err(|_| "storage lock")?.write(handle, key, value)
}
pub fn request(command: &str) -> String {
    let result = stores()
        .lock()
        .map_err(|_| "storage lock".to_owned())
        .and_then(|mut s| s.command(command));
    match result {
        Ok(value) => json!({ "value": value }).to_string(),
        Err(error) => json!({ "error": error }).to_string(),
    }
}
