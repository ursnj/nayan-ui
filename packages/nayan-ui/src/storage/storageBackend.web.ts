import { decode, encode } from './codec';
import type { StorageBackend, StorageEncryptionType } from './types';

const PREFIX = 'nayan-engine-store-v1:';
function storage(): globalThis.Storage {
  if (typeof window === 'undefined') throw new Error('Engine storage: browser storage is unavailable during server rendering');
  return window.localStorage;
}
// A single localStorage record per namespace makes clearAll atomic and isolates other stores.
function load(name: string): Record<string, string> {
  const raw = storage().getItem(name);
  if (raw === null) return Object.create(null);
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.values(parsed).some((v) => typeof v !== 'string'))
    throw new Error('Engine storage: corrupt browser store');
  return Object.assign(Object.create(null), parsed);
}
function base64(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let result = '';
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}
export function openBackend(id: string, encryptionKey?: string, encryptionType?: StorageEncryptionType): StorageBackend {
  if (encryptionKey !== undefined || encryptionType !== undefined) throw new Error('Engine storage: encryption is only available on native');
  const name = `${PREFIX}${encodeURIComponent(id)}`;
  const save = (data: Record<string, string>) => storage().setItem(name, JSON.stringify(data));
  return {
    listen(changed) {
      if (typeof window === 'undefined') return () => {};
      const listener = (event: StorageEvent) => {
        if (event.storageArea !== window.localStorage || (event.key !== name && event.key !== null)) return;
        if (event.key === null) {
          changed([]);
          return;
        }
        try {
          const old = event.oldValue === null ? {} : (JSON.parse(event.oldValue) as Record<string, string>);
          const next = event.newValue === null ? {} : (JSON.parse(event.newValue) as Record<string, string>);
          changed([...new Set([...Object.keys(old), ...Object.keys(next)])].filter((key) => old[key] !== next[key]));
        } catch {
          changed([]);
        }
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    },
    read(key) {
      const text = load(name)[key];
      return text === undefined ? undefined : decode(Uint8Array.from(atob(text), (c) => c.charCodeAt(0)).buffer);
    },
    write(key, value) {
      const data = load(name);
      data[key] = base64(encode(value));
      save(data);
    },
    command<T>(op: string, options: Record<string, unknown> = {}): T {
      if (op === 'flush') return undefined as T;
      if (op === 'isEncrypted') return false as T;
      if (op === 'encrypt' || op === 'decrypt') throw new Error('Engine storage: encryption is only available on native');
      const data = load(name),
        key = options.key as string;
      let result: unknown;
      switch (op) {
        case 'keys':
          result = Object.keys(data);
          break;
        case 'contains':
          result = Object.hasOwn(data, key);
          break;
        case 'remove':
          result = Object.hasOwn(data, key);
          delete data[key];
          save(data);
          break;
        case 'clear':
          result = Object.keys(data);
          storage().removeItem(name);
          break;
        default:
          throw new Error(`Engine storage: unknown command ${op}`);
      }
      return result as T;
    }
  };
}
