import { clearedAssetStorage, flushAssetStorage, prepareEngine, readSavedAsset } from '../native/NativeNayanEngine.web';
import * as shared from './storage.shared';
// Browser platform I/O is asynchronous; Rust still owns record validation and cache policy.
import type { ProceduralStorage } from './types';

export function proceduralStorage(revision: string): ProceduralStorage | undefined {
  const storage = shared.proceduralStorage(revision);
  if (!storage) return;
  return {
    verified: storage.verified,
    read: storage.read,
    write(key, bytes) {
      storage.write(key, bytes);
      return flushAssetStorage();
    }
  };
}
export async function readPersistentAsset(key: string): Promise<ArrayBuffer | null> {
  return readSavedAsset(`source:${key}`);
}
export async function writePersistentAsset(key: string, bytes: ArrayBuffer): Promise<void> {
  const writing = shared.writePersistentAsset(key, bytes);
  const saved = flushAssetStorage();
  await Promise.all([writing, saved]);
}
export async function removePersistentAsset(key: string): Promise<void> {
  const removing = shared.removePersistentAsset(key);
  const saved = flushAssetStorage();
  await Promise.all([removing, saved]);
}
export async function clearPersistentStorage(): Promise<void> {
  await prepareEngine();
  const clearing = shared.clearPersistentStorage();
  const saved = clearedAssetStorage();
  await Promise.all([clearing, saved]);
}
