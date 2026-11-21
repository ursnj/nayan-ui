import { beforeEach, expect, mock, test } from 'bun:test';

let denied = false;
const read = mock(async () => {
  if (denied) throw new Error('storage denied');
  return null;
});
const write = mock(async () => {
  if (denied) throw new Error('disk full');
});
mock.module('../storage', () => ({
  readPersistentAsset: read,
  writePersistentAsset: write,
  removePersistentAsset: async () => {}
}));
const { assetBytes, clearAssetBytes } = await import('../AssetBytesCache');
beforeEach(() => {
  clearAssetBytes();
  denied = false;
  read.mockClear();
  write.mockClear();
});

test('entry retention is bounded and hits refresh least-recently-used order', async () => {
  const loads = new Map<string, number>();
  const request = (key: string) =>
    assetBytes(key, async () => {
      loads.set(key, (loads.get(key) ?? 0) + 1);
      return new Uint8Array([Number(key)]).buffer;
    });
  for (let i = 0; i < 128; i++) await request(String(i));
  await request('0'); // Refresh the oldest entry before forcing eviction.
  await request('128');
  await request('0');
  await request('1');
  expect(loads.get('0')).toBe(1);
  expect(loads.get('1')).toBe(2);
  expect(loads.get('128')).toBe(1);
});

test('byte retention respects the 16 MiB boundary and oversized sources remain loadable', async () => {
  const a = mock(async () => new ArrayBuffer(8 * 1024 * 1024));
  const b = mock(async () => new ArrayBuffer(8 * 1024 * 1024));
  await assetBytes('a', a);
  await assetBytes('b', b);
  await assetBytes('a', a);
  expect(a).toHaveBeenCalledTimes(1);
  await assetBytes('c', async () => new ArrayBuffer(1));
  await assetBytes('a', a);
  expect(a).toHaveBeenCalledTimes(1);
  await assetBytes('b', b);
  expect(b).toHaveBeenCalledTimes(2);
  const oversized = mock(async () => new ArrayBuffer(16 * 1024 * 1024 + 1));
  expect((await assetBytes('large', oversized)).byteLength).toBe(16 * 1024 * 1024 + 1);
  await assetBytes('large', oversized);
  expect(oversized).toHaveBeenCalledTimes(2);
});

test('storage read and write failures preserve downloaded bytes and in-memory reuse', async () => {
  denied = true;
  const download = mock(async () => new Uint8Array([7, 8]).buffer);
  const first = await assetBytes('offline-storage', download);
  expect(await assetBytes('offline-storage', download)).toBe(first);
  expect(new Uint8Array(first)).toEqual(new Uint8Array([7, 8]));
  expect(download).toHaveBeenCalledTimes(1);
  expect(read).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledTimes(1);
});

test('memory-only bytes do not touch disk and reload replaces a retained value without reading old disk data', async () => {
  const original = new Uint8Array([1]).buffer;
  const fresh = new Uint8Array([2]).buffer;
  await assetBytes('variant', async () => original, { disk: false });
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  const download = mock(async () => fresh);
  expect(await assetBytes('variant', download, { reload: true })).toBe(fresh);
  expect(read).not.toHaveBeenCalled();
  expect(write).toHaveBeenCalledTimes(1);
  expect(await assetBytes('variant', download)).toBe(fresh);
  expect(download).toHaveBeenCalledTimes(1);
});

test('disk-backed callers persist existing memory-only bytes once without downloading again', async () => {
  const bytes = new Uint8Array([1, 2, 3]).buffer;
  const download = mock(async () => bytes);
  await assetBytes('image', download, { disk: false });
  expect(write).not.toHaveBeenCalled();
  expect(await Promise.all([assetBytes('image', download), assetBytes('image', download)])).toEqual([bytes, bytes]);
  expect(download).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledTimes(1);
  expect(read).not.toHaveBeenCalled();
});

test('a disk-backed caller can join an in-flight memory-only download and get a saved copy', async () => {
  const bytes = new Uint8Array([4, 5]).buffer;
  let finish!: (value: ArrayBuffer) => void;
  const download = mock(() => new Promise<ArrayBuffer>((resolve) => (finish = resolve)));
  const memory = assetBytes('image', download, { disk: false });
  await Promise.resolve();
  const disk = assetBytes('image', download);
  finish(bytes);
  expect(await Promise.all([memory, disk])).toEqual([bytes, bytes]);
  expect(download).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledTimes(1);
  expect(read).not.toHaveBeenCalled();
});
