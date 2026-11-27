//! Append-only mapped records. A process-wide owner lock is held for every map's lifetime.
//! Two commit slots publish buffered appends; two separate checkpoints identify fully flushed data.
//! Recovery may discard a torn buffered tail, but never silently discards a durable record.
use super::{Cache, Result, encryption, valid_name, valid_value};
use memmap2::MmapMut;
use std::{
    fs::{File, OpenOptions},
    path::Path,
};

pub(super) const HEADER: usize = 192;
const MAGIC: &[u8; 8] = b"NAYANK02";
const INITIAL: usize = 64 * 1024;
const MAX_FILE: usize = 1024 * 1024 * 1024;
const RECORD: usize = 20;
pub(super) const SET: u8 = 1;
pub(super) const REMOVE: u8 = 2;
pub(super) const CLEAR: u8 = 3;
pub(super) const PROTECT: u8 = 4;
#[derive(Clone, Copy, Debug)]
struct Commit {
    generation: u64,
    sequence: u64,
    end: usize,
}
pub(super) struct Log {
    map: MmapMut,
    file: File,
    pub end: usize,
    sequence: u64,
    checkpoint: u64,
    dirty: bool,
}
fn io<T>(result: std::io::Result<T>) -> Result<T> {
    result.map_err(|e| e.to_string())
}
fn u32_at(bytes: &[u8], at: usize) -> u32 {
    u32::from_le_bytes(bytes[at..at + 4].try_into().unwrap())
}
fn u64_at(bytes: &[u8], at: usize) -> u64 {
    u64::from_le_bytes(bytes[at..at + 8].try_into().unwrap())
}
fn slot(bytes: &[u8], at: usize) -> Option<Commit> {
    let s = bytes.get(at..at + 32)?;
    if crc32fast::hash(&s[..24]) != u32_at(s, 24) {
        return None;
    }
    let end = usize::try_from(u64_at(s, 16)).ok()?;
    (HEADER..=bytes.len()).contains(&end).then_some(Commit {
        generation: u64_at(s, 0),
        sequence: u64_at(s, 8),
        end,
    })
}
fn put_slot(map: &mut [u8], at: usize, c: Commit) {
    let bytes = &mut map[at..at + 32];
    bytes[..8].copy_from_slice(&c.generation.to_le_bytes());
    bytes[8..16].copy_from_slice(&c.sequence.to_le_bytes());
    bytes[16..24].copy_from_slice(&(c.end as u64).to_le_bytes());
    let crc = crc32fast::hash(&bytes[..24]);
    bytes[24..28].copy_from_slice(&crc.to_le_bytes());
}
pub(super) fn record_size(id: &str, key: &str, value: &[u8]) -> usize {
    RECORD + id.len() + key.len() + value.len()
}
fn replay(map: &[u8], from: usize, to: usize, mut sequence: u64, cache: &mut Cache) -> (usize, u64) {
    let mut at = from;
    while at < to {
        let Some(head) = map.get(at..to).filter(|b| b.len() >= RECORD) else {
            break;
        };
        let size = u32_at(head, 0) as usize;
        if size < RECORD || size > head.len() {
            break;
        }
        let bytes = &head[..size];
        if crc32fast::hash(&bytes[8..]) != u32_at(bytes, 4) {
            break;
        }
        let id_end = RECORD.checked_add(u32_at(bytes, 12) as usize);
        let key_end = id_end.and_then(|n| n.checked_add(u32_at(bytes, 16) as usize));
        let Some((id_end, key_end)) = id_end.zip(key_end).filter(|(_, n)| *n <= size) else {
            break;
        };
        let (Ok(id), Ok(key)) = (std::str::from_utf8(&bytes[RECORD..id_end]), std::str::from_utf8(&bytes[id_end..key_end])) else {
            break;
        };
        let op = bytes[8];
        let value = &bytes[key_end..];
        if !valid_name(id) || bytes[9..12] != [0, 0, 0] {
            break;
        }
        let namespace = cache.stores.get(id);
        let encrypted = namespace.is_some_and(|namespace| namespace.encryption.is_some());
        if !match op {
            SET if encrypted => encryption::valid_record(key, value),
            SET => valid_name(key) && valid_value(value),
            REMOVE if encrypted => encryption::valid_index(key) && value.is_empty(),
            REMOVE => valid_name(key) && value.is_empty(),
            CLEAR => key.is_empty() && value.is_empty(),
            PROTECT => namespace.is_none() && key.is_empty() && encryption::Metadata::parse(value).is_some(),
            _ => false,
        } {
            break;
        }
        let Some(next) = sequence.checked_add(1) else {
            break;
        };
        sequence = next;
        cache.apply(op, id, key, value);
        at += size;
    }
    (at, sequence)
}
impl Log {
    pub fn create(path: &Path) -> Result<Self> {
        let mut options = OpenOptions::new();
        options.read(true).write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let file = io(options.open(path))?;
        io(file.set_len(INITIAL as u64))?;
        // SAFETY: the owning Database holds an exclusive process lock. Files are private, never
        // truncated while mapped, and compaction replaces the inode rather than modifying it.
        let mut map = io(unsafe { MmapMut::map_mut(&file) })?;
        map[..8].copy_from_slice(MAGIC);
        let c = Commit {
            generation: 0,
            sequence: 0,
            end: HEADER,
        };
        for at in [16, 48, 80, 112] {
            put_slot(&mut map, at, c);
        }
        Ok(Self {
            map,
            file,
            end: HEADER,
            sequence: 0,
            checkpoint: 0,
            dirty: true,
        })
    }
    pub fn open(path: &Path) -> Result<(Self, Cache)> {
        let file = io(OpenOptions::new().read(true).write(true).open(path))?;
        let len = io(file.metadata())?.len();
        if len < HEADER as u64 || len > MAX_FILE as u64 {
            return Err("invalid mapped storage size".into());
        }
        // SAFETY: same exclusive ownership and no-truncation contract as create().
        let map = io(unsafe { MmapMut::map_mut(&file) })?;
        if &map[..8] != MAGIC {
            return Err("invalid mapped storage format".into());
        }
        let checkpoint = [80, 112]
            .into_iter()
            .filter_map(|at| slot(&map, at))
            .max_by_key(|c| c.generation)
            .ok_or("damaged durable storage checkpoint")?;
        let mut cache = Cache::default();
        if replay(&map, HEADER, checkpoint.end, 0, &mut cache) != (checkpoint.end, checkpoint.sequence) {
            return Err("corrupt durable storage records; original file preserved".into());
        }
        let commit = [16, 48]
            .into_iter()
            .filter_map(|at| slot(&map, at))
            .filter(|c| c.generation == c.sequence && c.sequence >= checkpoint.sequence && c.end >= checkpoint.end)
            .max_by_key(|c| c.sequence)
            .unwrap_or(checkpoint);
        let (end, sequence) = replay(&map, checkpoint.end, commit.end, checkpoint.sequence, &mut cache);
        if end == commit.end && sequence != commit.sequence {
            return Err("invalid mapped storage sequence".into());
        }
        let mut log = Self {
            map,
            file,
            end,
            sequence,
            checkpoint: checkpoint.generation,
            dirty: end != checkpoint.end,
        };
        if end != commit.end || commit.sequence < checkpoint.sequence {
            let recovered = Commit {
                generation: sequence,
                sequence,
                end,
            };
            for at in [16, 48] {
                put_slot(&mut log.map, at, recovered);
            }
            log.dirty = true;
            log.flush()?;
        }
        Ok((log, cache))
    }
    pub fn append(&mut self, op: u8, id: &str, key: &str, value: &[u8]) -> Result<u64> {
        let size = record_size(id, key, value);
        let end = self
            .end
            .checked_add(size)
            .filter(|n| *n <= MAX_FILE)
            .ok_or("mapped storage is too large")?;
        let sequence = self.sequence.checked_add(1).ok_or("storage sequence exhausted")?;
        if end > self.map.len() {
            let capacity = end
                .checked_next_power_of_two()
                .filter(|n| *n <= MAX_FILE)
                .ok_or("mapped storage is too large")?;
            io(self.file.set_len(capacity as u64))?;
            // SAFETY: the file only grows, no slices escape this object, and the owner lock
            // prevents a second process from changing or truncating the mapping.
            self.map = io(unsafe { MmapMut::map_mut(&self.file) })?;
        }
        let bytes = &mut self.map[self.end..end];
        bytes[..4].copy_from_slice(&(size as u32).to_le_bytes());
        bytes[8] = op;
        bytes[9..12].fill(0);
        bytes[12..16].copy_from_slice(&(id.len() as u32).to_le_bytes());
        bytes[16..20].copy_from_slice(&(key.len() as u32).to_le_bytes());
        let split = RECORD + id.len();
        let tail = split + key.len();
        bytes[RECORD..split].copy_from_slice(id.as_bytes());
        bytes[split..tail].copy_from_slice(key.as_bytes());
        bytes[tail..].copy_from_slice(value);
        let crc = crc32fast::hash(&bytes[8..]);
        bytes[4..8].copy_from_slice(&crc.to_le_bytes());
        put_slot(
            &mut self.map,
            16 + (sequence as usize & 1) * 32,
            Commit {
                generation: sequence,
                sequence,
                end,
            },
        );
        self.end = end;
        self.sequence = sequence;
        self.dirty = true;
        Ok(sequence)
    }
    pub fn flush(&mut self) -> Result<()> {
        if !self.dirty {
            return Ok(());
        }
        let generation = self.checkpoint.checked_add(1).ok_or("storage checkpoint exhausted")?;
        // First persist records and their commit, then publish the durable boundary. Recovery
        // never treats an incompletely persisted body as a successful durable transaction.
        io(self.map.flush())?;
        io(self.file.sync_all())?;
        put_slot(
            &mut self.map,
            80 + (generation as usize & 1) * 32,
            Commit {
                generation,
                sequence: self.sequence,
                end: self.end,
            },
        );
        io(self.map.flush_range(0, HEADER))?;
        io(self.file.sync_all())?;
        self.checkpoint = generation;
        self.dirty = false;
        Ok(())
    }
    #[cfg(test)]
    pub fn capacity(&self) -> usize {
        self.map.len()
    }
}
