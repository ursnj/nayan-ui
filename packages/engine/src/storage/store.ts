import { openBackend } from './storageBackend';
import type { StorageBackend, StorageConfiguration, StorageJSON, StorageValue } from './types';

/** Synchronous namespaced storage, independent of the engine's asset cache. */
export interface Storage {
  readonly id: string;
  set(key: string, value: StorageValue | ArrayBufferView): void;
  getBuffer(key: string): ArrayBuffer | undefined;
  setJSON(key: string, value: unknown): void;
  /** Parses stored JSON; malformed JSON throws instead of silently discarding data. */
  getJSON<T = StorageJSON>(key: string): T | undefined;
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  contains(key: string): boolean;
  remove(key: string): boolean;
  /** Alias used by existing storage adapters. */
  delete(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
  /** Persist buffered native writes. Browser writes are already synchronous. */
  flush(): void;
  /** React to writes, removals and clears, including other instances of this ID. */
  subscribe(changed: (key: string) => void): () => void;
}

type Subscribers = { callbacks: Set<(key: string) => void>; stop?: () => void };
const subscribers = new Map<string, Subscribers>();
function notify(id: string, keys: string[]) {
  const callbacks = subscribers.get(id)?.callbacks;
  for (const key of keys) for (const callback of [...(callbacks ?? [])]) callback(key);
}
function subscribe(id: string, backend: StorageBackend, changed: (key: string) => void) {
  let group = subscribers.get(id);
  if (!group) {
    group = { callbacks: new Set() };
    subscribers.set(id, group);
    // An empty key is a namespace-wide invalidation (e.g. another tab clears localStorage).
    group.stop = backend.listen?.((keys) => notify(id, keys.length ? keys : ['']));
  }
  const callback = (key: string) => changed(key);
  group.callbacks.add(callback);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    group!.callbacks.delete(callback);
    if (!group!.callbacks.size) {
      group!.stop?.();
      subscribers.delete(id);
    }
  };
}

/** Native uses a Rust memory-mapped store; browsers use localStorage synchronously without engine warm-up. */
export function createStorage({ id = 'default' }: StorageConfiguration = {}): Storage {
  if (typeof id !== 'string' || !id.length) throw new Error('Engine storage: id must be a nonempty string');
  const backend = openBackend(id);
  const read = (key: string) => backend.read(key);
  const set: Storage['set'] = (key, value) => {
    if (!key.length) throw new Error('Engine storage: cannot set an empty key');
    if (ArrayBuffer.isView(value)) value = new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice().buffer;
    if (!(value instanceof ArrayBuffer) && !['string', 'number', 'boolean'].includes(typeof value))
      throw new Error('Engine storage: expected a string, number or boolean, or binary buffer');
    backend.write(key, value as StorageValue);
    notify(id, [key]);
  };
  return {
    id,
    set,
    getBuffer(key) {
      const value = read(key);
      return value instanceof ArrayBuffer ? value.slice(0) : undefined;
    },
    setJSON(key, value) {
      const text = JSON.stringify(value);
      if (text === undefined) throw new TypeError('Engine storage: expected JSON data');
      set(key, text);
    },
    getJSON(key) {
      const value = read(key);
      const text = typeof value === 'string' ? value : undefined;
      return text === undefined ? undefined : JSON.parse(text);
    },
    getString(key) {
      const value = read(key);
      return typeof value === 'string' ? value : undefined;
    },
    getNumber(key) {
      const value = read(key);
      return typeof value === 'number' ? value : undefined;
    },
    getBoolean(key) {
      const value = read(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    contains: (key) => backend.command('contains', { key }),
    remove(key) {
      const removed = backend.command<boolean>('remove', { key });
      if (removed) notify(id, [key]);
      return removed;
    },
    delete(key) {
      const removed = backend.command<boolean>('remove', { key });
      if (removed) notify(id, [key]);
    },
    getAllKeys: () => backend.command('keys'),
    flush() {
      backend.command('flush');
    },
    subscribe: (changed) => subscribe(id, backend, changed),
    clearAll() {
      const keys = backend.command<string[]>('clear');
      notify(id, keys ?? []);
    }
  };
}
