//! Memory-cached preferences with a checksummed, append-only memory-mapped file.
//! One process owns the file. Buffered sets avoid per-write fsync; flush, remove and clear are durable.
mod encryption;
mod log;
#[cfg(test)]
mod tests;
use encryption::{Algorithm, Metadata, Protection};
use log::{CLEAR, HEADER, Log, PROTECT, REMOVE, SET, record_size};
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
struct Namespace {
    entries: HashMap<String, Entry>,
    encryption: Option<Metadata>,
    bytes: usize,
    next_order: u64,
}
impl Namespace {
    fn set(&mut self, id: &str, key: String, value: Vec<u8>) {
        let order = if let Some(old) = self.entries.get(&key) {
            self.bytes -= record_size(id, &key, &old.value);
            old.order
        } else {
            self.next_order += 1;
            self.next_order
        };
        self.bytes += record_size(id, &key, &value);
        self.entries.insert(key, Entry { value, order });
    }

    fn apply(&mut self, op: u8, id: &str, key: &str, value: &[u8]) {
        match op {
            SET => self.set(id, key.to_owned(), value.to_vec()),
            REMOVE => {
                if let Some(old) = self.entries.remove(key) {
                    self.bytes -= record_size(id, key, &old.value);
                }
            }
            CLEAR => {
                self.entries.clear();
                self.bytes = 0;
            }
            _ => unreachable!(),
        }
    }
    fn ordered(&self) -> Vec<(&String, &Entry)> {
        let mut entries: Vec<_> = self.entries.iter().collect();
        entries.sort_unstable_by_key(|(_, entry)| entry.order);
        entries
    }

    fn size(&self, id: &str) -> usize {
        self.bytes + self.encryption.as_ref().map_or(0, |metadata| record_size(id, "", metadata.bytes()))
    }
}

#[derive(Default)]
struct Cache {
    stores: HashMap<String, Namespace>,
    bytes: usize,
}
impl Cache {
    fn apply(&mut self, op: u8, id: &str, key: &str, value: &[u8]) {
        let namespace = self.stores.entry(id.to_owned()).or_default();
        let previous_size = namespace.size(id);
        if op == PROTECT {
            namespace.encryption = Metadata::parse(value);
        } else {
            namespace.apply(op, id, key, value);
        }
        self.bytes = self.bytes - previous_size + namespace.size(id);
    }
}

const MAX_NAME: usize = 1_000_000;
const MAX_VALUE: usize = 512 * 1024 * 1024;
fn valid_name(name: &str) -> bool {
    !name.is_empty() && name.len() <= MAX_NAME
}
fn valid_value(value: &[u8]) -> bool {
    value.len() <= MAX_VALUE
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
    unlocked: HashMap<String, Protection>,
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
        // A process can exit during a rewrite. Only the renamed snapshot is authoritative.
        for file in io(std::fs::read_dir(directory))? {
            let file = io(file)?;
            let name = file.file_name();
            let snapshot_id = name.to_str().and_then(|name| name.strip_prefix(".preferences-")?.strip_suffix(".tmp"));
            if snapshot_id.is_some_and(|id| uuid::Uuid::parse_str(id).is_ok()) && io(file.file_type())?.is_file() {
                io(std::fs::remove_file(file.path()))?;
            }
        }
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
            unlocked: HashMap::new(),
            directory: directory.into(),
            _owner: owner,
        })
    }
    fn snapshot(directory: &Path, cache: &Cache) -> Result<(Log, PathBuf)> {
        let temporary = directory.join(format!(".preferences-{}.tmp", uuid::Uuid::new_v4()));
        let result = (|| {
            let mut log = Log::create(&temporary)?;
            for (id, namespace) in &cache.stores {
                if let Some(encryption) = &namespace.encryption {
                    log.append(PROTECT, id, "", encryption.bytes())?;
                }
                for (key, entry) in namespace.ordered() {
                    log.append(SET, id, key, &entry.value)?;
                }
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
    fn replace_log(&mut self) -> Result<()> {
        let (log, temporary) = Self::snapshot(&self.directory, &self.cache)?;
        if let Err(error) = std::fs::rename(&temporary, self.directory.join("preferences.kv")) {
            drop(log);
            let _ = std::fs::remove_file(temporary);
            return Err(error.to_string());
        }
        // Rename commits the new map. Callers adopt matching in-memory state before directory sync.
        self.log = log;
        Ok(())
    }
    fn append(&mut self, op: u8, id: &str, key: &str, value: &[u8]) -> Result<()> {
        if self.log.end > 1024 * 1024 && self.log.end.saturating_sub(HEADER) > self.cache.bytes.saturating_mul(3).saturating_add(1024 * 1024) {
            self.replace_log()?;
            sync_directory(&self.directory)?;
        }
        self.log.append(op, id, key, value)?;
        self.cache.apply(op, id, key, value);
        Ok(())
    }

    fn metadata(&self, id: &str) -> Option<&Metadata> {
        self.cache.stores.get(id)?.encryption.as_ref()
    }

    fn change_encryption(&mut self, id: &str, encryption: Option<(Metadata, Protection)>) -> Result<()> {
        let mut updated = Namespace::default();
        if let Some(current) = self.cache.stores.get(id) {
            let active = self.unlocked.get(id);
            for (index, entry) in current.ordered() {
                let transform = |key: &str, value: &[u8]| match &encryption {
                    Some((_, protection)) => protection.seal(key, value),
                    None => Ok((key.to_owned(), value.to_vec())),
                };
                let (key, value) = match active {
                    Some(active) => active.unseal(index, &entry.value, transform)?,
                    None => transform(index, &entry.value),
                }?;
                updated.set(id, key, value);
            }
        }
        let protection = encryption.map(|(metadata, protection)| {
            updated.encryption = Some(metadata);
            protection
        });
        let updated_size = updated.size(id);
        let previous = self.cache.stores.insert(id.to_owned(), updated);
        if let Err(error) = self.replace_log() {
            if let Some(previous) = previous {
                self.cache.stores.insert(id.to_owned(), previous);
            } else {
                self.cache.stores.remove(id);
            }
            return Err(error);
        }
        self.cache.bytes = self.cache.bytes - previous.as_ref().map_or(0, |ns| ns.size(id)) + updated_size;
        if let Some(protection) = protection {
            self.unlocked.insert(id.to_owned(), protection);
        } else {
            self.unlocked.remove(id);
        }
        sync_directory(&self.directory)
    }

    fn index<'a>(&self, id: &str, key: &'a str) -> std::borrow::Cow<'a, str> {
        match self.unlocked.get(id) {
            Some(protection) => protection.index(key).into(),
            None => key.into(),
        }
    }

    fn entry(&self, id: &str, index: &str) -> Option<&Entry> {
        self.cache.stores.get(id)?.entries.get(index)
    }

    fn keys(&self, id: &str) -> Result<Vec<String>> {
        let Some(namespace) = self.cache.stores.get(id) else {
            return Ok(Vec::new());
        };
        let protection = self.unlocked.get(id);
        namespace
            .ordered()
            .into_iter()
            .map(|(index, entry)| match protection {
                Some(protection) => protection.unseal(index, &entry.value, |key, _| key.to_owned()),
                None => Ok(index.clone()),
            })
            .collect()
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
    fn open(&mut self, id: &str, key: Option<&str>, algorithm: Option<Algorithm>) -> Result<u32> {
        if !valid_name(id) {
            return Err("invalid store id".into());
        }
        let database = self.database()?;
        match (database.metadata(id), key) {
            (Some(metadata), Some(key)) => {
                if algorithm.is_some_and(|algorithm| algorithm != metadata.algorithm()) {
                    return Err("storage encryption type does not match the encrypted store".into());
                }
                let protection = metadata.unlock(id, key)?;
                database.unlocked.insert(id.to_owned(), protection);
            }
            (Some(_), None) => {
                return Err("an encryption key is required to open this store".into());
            }
            (None, Some(key)) => database.change_encryption(id, Some(Protection::create(id, key, algorithm.unwrap_or(Algorithm::Aes128))?))?,
            (None, None) => {}
        }
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
        let database = self.database.as_ref().ok_or("storage has not been opened")?;
        let index = database.index(id, key);
        let Some(entry) = database.entry(id, &index) else {
            return Ok(Vec::new());
        };
        match database.unlocked.get(id) {
            Some(protection) => protection.unseal(&index, &entry.value, |_, value| value.to_vec()),
            None => Ok(entry.value.clone()),
        }
    }
    fn write(&mut self, handle: u32, key: &str, value: &[u8]) -> Result<()> {
        if !valid_name(key) || !valid_value(value) {
            return Err("invalid storage key or value".into());
        }
        let id = self.id(handle)?.to_owned();
        let database = self.database()?;
        if let Some(protection) = database.unlocked.get(&id) {
            let (index, encrypted) = protection.seal(key, value)?;
            return database.append(SET, &id, &index, &encrypted);
        }
        database.append(SET, &id, key, value)
    }
    fn command(&mut self, command: &str) -> Result<Value> {
        let c: Value = serde_json::from_str(command).map_err(|e| e.to_string())?;
        let op = c["op"].as_str().ok_or("missing storage operation")?;
        let encryption_key = || c["encryptionKey"].as_str().ok_or("storage encryption key must be a string");
        let encryption_type = || {
            c.get("encryptionType")
                .map(|value| Algorithm::parse(value.as_str().ok_or("storage encryption type must be a string")?))
                .transpose()
        };
        if matches!(op, "open" | "openEncrypted") {
            let id = c["id"].as_str().ok_or("missing id")?;
            let (key, algorithm) = if op == "openEncrypted" {
                (Some(encryption_key()?), encryption_type()?)
            } else {
                (None, None)
            };
            return Ok(json!(self.open(id, key, algorithm)?));
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
            "isEncrypted" => Ok(json!(database.metadata(&id).is_some())),
            "encrypt" => {
                let algorithm = encryption_type()?.unwrap_or(Algorithm::Aes128);
                database.change_encryption(&id, Some(Protection::create(&id, encryption_key()?, algorithm)?))?;
                Ok(Value::Null)
            }
            "decrypt" => {
                if database.metadata(&id).is_some() {
                    database.change_encryption(&id, None)?;
                }
                Ok(Value::Null)
            }
            "contains" => Ok(json!(database.entry(&id, &database.index(&id, key)).is_some())),
            "keys" => Ok(json!(database.keys(&id)?)),
            "remove" => {
                let index = database.index(&id, key);
                let exists = database.entry(&id, &index).is_some();
                if exists {
                    database.append(REMOVE, &id, &index, &[])?;
                }
                database.log.flush()?;
                Ok(json!(exists))
            }
            "clear" => {
                let keys = database.keys(&id)?;
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
