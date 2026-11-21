import { afterAll, beforeEach, expect, mock, test } from 'bun:test';

let hash = 'v1';
let nativeFailure = false;
const nativeRead = mock(async (_uri: string) => {
  if (nativeFailure) throw new Error('Resource is missing');
  return new Uint8Array([4, 5, 6]).buffer;
});
const bridge: { assetRead?: typeof nativeRead } = { assetRead: nativeRead };
mock.module('../../native/NativeNayanEngine', () => ({ default: bridge }));
mock.module('react-native', () => ({
  Image: {
    resolveAssetSource: (id: number) => ({
      uri: id === 1 ? 'drawable_resource' : id === 2 ? 'https://assets/native' : id === 3 ? 'file:///bundle/image%20name' : '',
      width: 10,
      height: 20,
      scale: 3
    })
  },
  AssetRegistry: { getAssetByID: () => ({ name: 'picture', type: 'png', hash }) }
}));
mock.module('../storage', () => ({
  readPersistentAsset: async () => null,
  writePersistentAsset: async () => {},
  removePersistentAsset: async () => {}
}));
const native = await import('../source');
const web = await import('../source.web');
const { assets } = await import('../assets');
const { clearAssetBytes } = await import('../AssetBytesCache');
const previousFetch = globalThis.fetch;
let ok = true;
const requested: string[] = [];
globalThis.fetch = mock(async (input: string | URL | Request) => {
  requested.push(String(input));
  return { ok, status: ok ? 200 : 503, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer } as Response;
}) as unknown as typeof fetch;
beforeEach(() => {
  clearAssetBytes();
  requested.length = 0;
  nativeRead.mockClear();
  bridge.assetRead = nativeRead;
  nativeFailure = false;
  hash = 'v1';
  ok = true;
});
afterAll(() => {
  globalThis.fetch = previousFetch;
});

test('native bundled and file resources read bytes directly; remote sources use fetch', async () => {
  expect(native.assetUri(1)).toBe('drawable_resource');
  expect(native.assetUri('https://assets/string')).toBe('https://assets/string');
  const bundled = await native.loadAssetBytes(1);
  expect(bundled).toMatchObject({ uri: 'drawable_resource', name: 'picture', type: 'png', hash: 'v1', width: 10, height: 20, scale: 3 });
  expect(new Uint8Array(bundled.bytes)).toEqual(new Uint8Array([4, 5, 6]));
  expect(nativeRead).toHaveBeenLastCalledWith('drawable_resource');
  await native.loadAssetBytes(3);
  expect(nativeRead).toHaveBeenLastCalledWith('file:///bundle/image%20name');
  expect(requested).toHaveLength(0);
  await native.loadAssetBytes(2);
  expect(requested).toEqual(['https://assets/native']);
});

test('shared image descriptors preserve request options and keep bundled IDs native-only', () => {
  const remote = { uri: 'https://assets/photo.png', headers: { Authorization: 'test' } };
  expect(native.imageAssetSource([null, remote, 1])).toEqual([remote, { uri: 'drawable_resource', width: 10, height: 20, scale: 3, assetModule: 1 }]);
  expect(web.imageAssetSource([null, remote, 'local.png'])).toEqual([remote, { uri: 'local.png' }]);
  expect(web.imageAssetSource(1)).toMatchObject({ uri: '', error: expect.any(String) });
});

test('missing resources reject without fetching and a later call can retry', async () => {
  await expect(native.loadAssetBytes(99)).rejects.toThrow('Metro');
  nativeFailure = true;
  await expect(native.loadAssetBytes(1)).rejects.toThrow('missing');
  nativeFailure = false;
  expect((await native.loadAssetBytes(1)).bytes.byteLength).toBe(3);
  expect(requested).toHaveLength(0);
  bridge.assetRead = undefined;
  await expect(native.loadAssetBytes('another_resource')).rejects.toThrow('Rebuild');
});

test('bundled cache identities use content hash and density, and support eviction/reload', async () => {
  const first = await assets.load(1);
  expect((await assets.load(1)).bytes).toBe(first.bytes);
  expect(nativeRead).toHaveBeenCalledTimes(1);
  hash = 'v2';
  const updated = await assets.load(1);
  expect(updated.cacheKey).not.toBe(first.cacheKey);
  expect(updated.bytes).not.toBe(first.bytes);
  await assets.evict(1);
  await assets.read(1);
  await assets.load(1, { reload: true });
  expect(nativeRead).toHaveBeenCalledTimes(4);
});

test('web rejects numeric/empty sources and shares concurrent URL requests with native', async () => {
  expect(web.assetUri(1)).toBeUndefined();
  for (const source of [1, '']) await expect(web.loadAssetBytes(source)).rejects.toThrow('URL');
  const [a, b] = await Promise.all([web.loadAssetBytes('https://assets/shared'), native.loadAssetBytes('https://assets/shared')]);
  expect(a.bytes).toBe(b.bytes);
  expect(requested).toHaveLength(1);
  ok = false;
  await expect(web.loadAssetBytes('https://assets/retry')).rejects.toThrow('503');
  ok = true;
  expect((await web.loadAssetBytes('https://assets/retry')).bytes.byteLength).toBe(3);
});

test('prefetch bounds parallel reads and reuses prefetched data', async () => {
  const original = globalThis.fetch;
  let active = 0;
  let maximum = 0;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    maximum = Math.max(maximum, ++active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    return new Response(new Uint8Array([7]));
  }) as unknown as typeof fetch;
  try {
    const sources = Array.from({ length: 12 }, (_, i) => `https://assets/${i}`);
    await assets.prefetch(sources);
    expect(maximum).toBe(4);
    await assets.read(sources[0]!);
    expect(calls).toBe(12);
  } finally {
    globalThis.fetch = original;
  }
});

test('oversized downloads reject before reading the body and remain retryable', async () => {
  const original = globalThis.fetch;
  const cancel = mock(async () => {});
  globalThis.fetch = (async () => ({
    ok: true,
    headers: new Headers({ 'content-length': String(129 * 1024 * 1024) }),
    body: { cancel }
  })) as unknown as typeof fetch;
  try {
    await expect(assets.read('https://assets/too-large')).rejects.toThrow('128 MiB');
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    globalThis.fetch = original;
  }
  expect((await assets.read('https://assets/too-large')).byteLength).toBe(3);
});
