import { expect, mock, test } from 'bun:test';

const saved = new Map<string, ArrayBuffer>();
let fail = false;
const native = {
  cacheRead: (key: string) => saved.get(key) ?? new ArrayBuffer(0),
  cacheWrite(key: string, value: ArrayBuffer) {
    saved.set(key, value.slice(0));
    return true;
  },
  cacheRemove: (key: string) => saved.delete(key),
  cacheClear() {
    saved.clear();
    return true;
  }
};
const prepare = mock(async () => {});
const flush = mock(async () => {
  if (fail) throw new Error('disk full');
});
const cleared = mock(async () => {});
const read = mock(async (key: string) => saved.get(key) ?? null);
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../../native/NativeNayanEngine.web', () => ({
  prepareEngine: prepare,
  readSavedAsset: read,
  flushAssetStorage: flush,
  clearedAssetStorage: cleared
}));
const storage = await import('../storage.web');

test('browser source storage uses Rust namespaces and awaits asynchronous durability', async () => {
  const bytes = new Uint8Array([1, 2]).buffer;
  await storage.writePersistentAsset('url', bytes);
  expect(flush).toHaveBeenCalledTimes(1);
  expect(await storage.readPersistentAsset('url')).toEqual(bytes);
  expect(read).toHaveBeenCalledWith('source:url');
  await storage.removePersistentAsset('url');
  expect(flush).toHaveBeenCalledTimes(2);
  expect(await storage.readPersistentAsset('url')).toBeNull();
});

test('browser procedural records isolate revisions and copy byte subarrays exactly', async () => {
  const current = storage.proceduralStorage('v1')!,
    next = storage.proceduralStorage('v2')!;
  await current.write('mesh', new Uint8Array([99, 3, 4, 99]).subarray(1, 3));
  expect(await current.read('mesh')).toEqual(new Uint8Array([3, 4]));
  expect(await next.read('mesh')).toBeNull();
  await next.write('mesh', new Uint8Array([7]));
  expect(await current.read('mesh')).toEqual(new Uint8Array([3, 4]));
  await storage.clearPersistentStorage();
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(cleared).toHaveBeenCalledTimes(1);
  expect(await current.read('mesh')).toBeNull();
  expect(await next.read('mesh')).toBeNull();
});

test('browser durability failures propagate to callers for both source and geometry records', async () => {
  fail = true;
  try {
    await expect(storage.writePersistentAsset('failed', new ArrayBuffer(1))).rejects.toThrow('disk full');
    await expect(storage.removePersistentAsset('failed')).rejects.toThrow('disk full');
    await expect(storage.proceduralStorage('v3')!.write('failed', new Uint8Array([1]))).rejects.toThrow('disk full');
  } finally {
    fail = false;
  }
  await storage.writePersistentAsset('success', new ArrayBuffer(2));
  expect((await storage.readPersistentAsset('success'))!.byteLength).toBe(2);
});
