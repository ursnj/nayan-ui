// Persistence is implemented by the shared Rust core, not an application filesystem dependency.
import NativeEngine from '../native/NativeNayanEngine';
import type { ProceduralStorage } from './types';

export function proceduralStorage(revision: string): ProceduralStorage | undefined {
  const native = NativeEngine;
  return {
    // The Rust store checksums every record (SHA-256) and rejects any that don't match.
    verified: true,
    read(key) {
      if (typeof native?.cacheRead !== 'function') return null;
      const data = native.cacheRead(`procedural:${revision}:${key}`);
      return data.byteLength ? new Uint8Array(data) : null;
    },
    write(key, bytes) {
      if (typeof native?.cacheWrite !== 'function') return;
      const data = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? bytes.buffer : bytes.slice().buffer;
      if (!native.cacheWrite(`procedural:${revision}:${key}`, data)) throw new Error(native.loadError() || 'Engine cache write failed');
    }
  };
}
export async function readPersistentAsset(key: string): Promise<ArrayBuffer | null> {
  if (typeof NativeEngine?.cacheRead !== 'function') return null;
  const bytes = NativeEngine.cacheRead(`source:${key}`);
  return bytes.byteLength ? bytes : null;
}
export async function writePersistentAsset(key: string, bytes: ArrayBuffer): Promise<void> {
  // Keep the async loader contract; writes themselves are serialized by the Rust storage lock.
  if (typeof NativeEngine?.cacheWrite === 'function' && !NativeEngine.cacheWrite(`source:${key}`, bytes))
    throw new Error(NativeEngine.loadError() || 'Engine cache write failed');
}
export async function removePersistentAsset(key: string): Promise<void> {
  if (typeof NativeEngine?.cacheRemove === 'function') NativeEngine.cacheRemove(`source:${key}`);
}
export async function clearPersistentStorage(): Promise<void> {
  if (typeof NativeEngine?.cacheClear !== 'function') throw new Error('Rebuild the app with engine cache support');
  if (!NativeEngine.cacheClear()) throw new Error(NativeEngine.loadError() || 'Engine cache clear failed');
}
