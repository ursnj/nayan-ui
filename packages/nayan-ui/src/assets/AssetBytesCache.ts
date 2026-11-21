import { cacheGeneration } from './CacheGeneration';
import { readPersistentAsset, removePersistentAsset, writePersistentAsset } from './storage';
// Decoded resources own their lifetime. Only temporary download bytes are evictable.
const BUDGET = 16 * 1024 * 1024;
const MAX_ENTRIES = 128;
interface Entry {
  bytes: ArrayBuffer;
  persistence?: Promise<void>;
}
const pending = new Map<string, { promise: Promise<ArrayBuffer>; disk: boolean }>();
const retained = new Map<string, Entry>();
let used = 0;

function persist(key: string, entry: Entry): Promise<void> {
  return (entry.persistence ??= writePersistentAsset(key, entry.bytes).catch(() => {
    /* Storage failure does not discard the in-memory copy. */
  }));
}

/** Share concurrent requests across loader variants; failed requests can always be retried. */
export function assetBytes(key: string, load: () => Promise<ArrayBuffer>, options: { disk?: boolean; reload?: boolean } = {}): Promise<ArrayBuffer> {
  const disk = options.disk !== false;
  if (options.reload) {
    const old = retained.get(key);
    if (old) {
      used -= old.bytes.byteLength;
      retained.delete(key);
    }
  }
  const entry = retained.get(key);
  if (entry) {
    retained.delete(key);
    retained.set(key, entry);
    return disk ? persist(key, entry).then(() => entry.bytes) : Promise.resolve(entry.bytes);
  }
  const existing = options.reload ? undefined : pending.get(key);
  if (existing) {
    existing.disk ||= disk;
    return existing.promise;
  }
  const epoch = cacheGeneration();
  const promise = Promise.resolve()
    .then(async () => {
      let saved: ArrayBuffer | null = null;
      try {
        if (request.disk && !options.reload) saved = await readPersistentAsset(key);
      } catch {
        /* Denied/corrupt storage is a miss. */
      }
      if (saved && epoch === cacheGeneration()) return { bytes: saved, persistence: Promise.resolve() };
      return { bytes: await load() };
    })
    .then(async (entry: Entry) => {
      // A disk-backed caller may have joined while the memory-only request was downloading.
      if (request.disk && epoch === cacheGeneration() && pending.get(key) === request) await persist(key, entry);
      if (epoch === cacheGeneration() && pending.get(key) === request && entry.bytes.byteLength <= BUDGET) {
        retained.set(key, entry);
        used += entry.bytes.byteLength;
        while (used > BUDGET || retained.size > MAX_ENTRIES) {
          const oldest = retained.keys().next().value!;
          used -= retained.get(oldest)!.bytes.byteLength;
          retained.delete(oldest);
        }
      }
      if (pending.get(key) === request) pending.delete(key);
      return entry.bytes;
    })
    .finally(() => {
      if (pending.get(key) === request) pending.delete(key);
    });
  const request = { promise, disk };
  pending.set(key, request);
  return promise;
}

/** A decoder rejected the payload: a later load must fetch fresh bytes, not replay bad data. */
export function forgetAssetBytes(key: string | undefined): Promise<void> {
  if (key === undefined) return Promise.resolve();
  pending.delete(key); // An evicted in-flight request must not repopulate the cache.
  const entry = retained.get(key);
  if (entry) {
    used -= entry.bytes.byteLength;
    retained.delete(key);
  }
  return removePersistentAsset(key).catch(() => {});
}

/** Clearing disk must also prevent an earlier request from retaining its old bytes. */
export function clearAssetBytes(): void {
  retained.clear();
  pending.clear();
  used = 0;
}
