import { expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { createBrowserEngine, type WasmCore } from '../../../native/BrowserEngine';
const { default: init } = await import('../../../../native/core/build/web/engine_core.js');
const core = (await init({
  module_or_path: await readFile(new URL('../../../../native/core/build/web/engine_core_bg.wasm', import.meta.url))
})) as unknown as WasmCore;
const host = createBrowserEngine(core);

let failed = false;
const saved = new Map<string, ArrayBuffer>();
let storageDenied = false;
const native = {
  ...host,
  cacheRead: mock((key: string) => {
    if (storageDenied) throw Error('denied');
    return saved.get(key)?.slice(0) ?? new ArrayBuffer(0);
  }),
  cacheWrite: mock((key: string, bytes: ArrayBuffer) => {
    if (storageDenied) return false;
    saved.set(key, bytes.slice(0));
    return true;
  }),
  cacheRemove: mock((key: string) => saved.delete(key)),
  cacheClear: mock(() => {
    if (storageDenied) return false;
    saved.clear();
    return true;
  }),
  shapePrepare: mock((vertices: ArrayBufferLike, indices: ArrayBufferLike, options: string) => {
    if (failed) {
      failed = false;
      return -1;
    }
    return host.shapePrepare(vertices, indices, options);
  }),
  modelVertices: mock(host.modelVertices),
  modelIndices: mock(host.modelIndices),
  modelSize: mock(host.modelSize),
  textureLoad: mock((_bytes: ArrayBuffer): number => -1),
  // The background decode goes through the same (mocked) decoder.
  textureLoadAsync: (bytes: ArrayBuffer) => Promise.resolve().then(() => native.textureLoad(bytes)),
  textureSize: () => [1, 1],
  renderMesh: mock(host.renderMesh),
  loadError: () => 'temporary failure'
};
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  TurboModuleRegistry: { get: () => native },
  Image: { resolveAssetSource: () => null }
}));
const { assetBytes } = await import('../../../assets/AssetBytesCache');
const { createShape } = await import('../shape');
const { meshInfo } = await import('../../render/meshes');
const geometry = (offset = 0) => ({
  vertices: new Float32Array([
    -1 + offset,
    -1,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    1 + offset,
    -1,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    0,
    offset,
    1,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0.5,
    1
  ]),
  indices: new Uint32Array([0, 1, 2])
});

test('Rust reuses copied geometry without JS geometry copies or uploads', () => {
  const first = createShape(geometry(), { optimize: true });
  const calls = [native.modelVertices.mock.calls.length, native.modelIndices.mock.calls.length, native.renderMesh.mock.calls.length];
  expect(createShape(geometry(), { optimize: {} })).toBe(first);
  expect([native.modelVertices.mock.calls.length, native.modelIndices.mock.calls.length, native.renderMesh.mock.calls.length]).toEqual(calls);
});

test('mutations and buffer slices are compared by current content without changing earlier models', () => {
  const g = geometry(2);
  const before = g.vertices.slice();
  const first = createShape(g, { center: false });
  expect(g.vertices).toEqual(before);
  g.vertices[0] = 42;
  const edited = createShape(g, { center: false });
  expect(edited.id).not.toBe(first.id);
  expect(new Float32Array(native.modelVertices(first.id))[0]).toBe(1);
  const storage = new Float32Array(g.vertices.length + 8);
  storage.set(g.vertices, 4);
  expect(createShape({ vertices: storage.subarray(4, -4), indices: g.indices }, { center: false })).toBe(edited);
});

test('material variants do not change previous shapes and share geometry', () => {
  const matte = createShape(geometry(4), { shine: 0 });
  const gloss = createShape(geometry(4), { shine: 0.8 });
  expect(matte.id).not.toBe(gloss.id);
  expect(meshInfo(matte.id)!.shine).toBe(0);
  expect(meshInfo(gloss.id)!.shine).toBe(0.8);
  expect(meshInfo(gloss.id)!.geometry).toEqual(meshInfo(matte.id)!.geometry);
  expect(createShape(geometry(4), { shine: 0.8 })).toBe(gloss);
});

test('registration failures retry and option changes prepare independent results', () => {
  failed = true;
  expect(() => createShape(geometry(6), { fit: 3 })).toThrow('temporary failure');
  const first = createShape(geometry(6), { fit: 3 });
  const calls = native.shapePrepare.mock.calls.length;
  createShape(geometry(6), { fit: 4 });
  expect(native.shapePrepare.mock.calls.length).toBe(calls + 1);
  expect(createShape(geometry(6), { fit: 3 })).toBe(first);
});

test('equal solids reuse Rust preparation without JS geometry transfers', () => {
  const { Solid, createSolid } = require('../modelling') as typeof import('../modelling');
  const first = createSolid(Solid.sphere(0.73), { resolution: 16 });
  const reads = native.modelVertices.mock.calls.length;
  expect(createSolid(Solid.sphere(0.73), { resolution: 16, optimize: {} })).toBe(first);
  expect(native.modelVertices.mock.calls.length).toBe(reads);
});

test('concurrent requests share work; failures retry and oversized RAM entries remain saved in Rust storage', async () => {
  let calls = 0;
  const load = async () => {
    calls++;
    return new ArrayBuffer(8);
  };
  const [a, b] = await Promise.all([assetBytes('shared', load), assetBytes('shared', load)]);
  expect(a).toBe(b);
  expect(await assetBytes('shared', load)).toBe(a);
  expect(calls).toBe(1);
  await expect(
    assetBytes('retry', async () => {
      throw Error('offline');
    })
  ).rejects.toThrow('offline');
  expect((await assetBytes('retry', load)).byteLength).toBe(8);
  const huge = async () => {
    calls++;
    return new ArrayBuffer(16 * 1024 * 1024 + 1);
  };
  const before = calls;
  await assetBytes('large', huge);
  await assetBytes('large', huge);
  expect(calls - before).toBe(1);
});

test('factory persistence delegates to Rust, isolates revisions and recovers corrupt records', async () => {
  const { ProceduralCache } = await import('../ProceduralCache');
  const first = new ProceduralCache('rust-backed');
  const model = first.get('prop', () => createShape(geometry(10), { center: false }));
  await first.flush();
  const restored = new ProceduralCache('rust-backed');
  expect(
    restored.get<typeof model>('prop', () => {
      throw Error('should not build');
    })
  ).toEqual(model);
  expect(restored.stats.hits).toBe(1);
  saved.set('procedural:rust-backed:prop', new Uint8Array([1, 2, 3]).buffer);
  const corrupt = new ProceduralCache('rust-backed');
  expect(corrupt.get('prop', () => model)).toBe(model);
  expect(corrupt.stats.invalid).toBe(1);
  const changed = new ProceduralCache('another-revision');
  expect(changed.get('prop', () => model)).toBe(model);
  expect(changed.stats.builds).toBe(1);
  await corrupt.flush();
  await changed.flush();
});

test('explicit clear removes saved records, keeps live models and prevents in-flight refill', async () => {
  const { clearAssetCache } = await import('../../../assets/AssetCache');
  let release!: (bytes: ArrayBuffer) => void;
  const pending = assetBytes(
    'slow',
    () =>
      new Promise<ArrayBuffer>((resolve) => {
        release = resolve;
      })
  );
  while (!release) await Promise.resolve();
  const model = createShape(geometry(20));
  await clearAssetCache();
  expect(saved.size).toBe(0);
  expect(meshInfo(model.id)).toBeDefined();
  release(new Uint8Array([1]).buffer);
  await pending;
  expect(saved.size).toBe(0);
  const fresh = await assetBytes('slow', async () => new Uint8Array([2]).buffer);
  expect(new Uint8Array(fresh)).toEqual(new Uint8Array([2]));
  expect(new Uint8Array(saved.get('source:slow')!)).toEqual(new Uint8Array([2]));
});

test('quota failure retains earlier records and clear failures are reported', async () => {
  const { ProceduralCache } = await import('../ProceduralCache');
  const { clearAssetCache } = await import('../../../assets/AssetCache');
  const prior = new Map(saved);
  storageDenied = true;
  try {
    const cache = new ProceduralCache('denied');
    const model = createShape(geometry(30));
    expect(cache.get('prop', () => model)).toBe(model);
    await cache.flush();
    expect(cache.stats.failures).toBeGreaterThan(0);
    expect(saved).toEqual(prior);
    await expect(clearAssetCache()).rejects.toThrow('temporary failure');
  } finally {
    storageDenied = false;
  }
});

test('a rejected decode discards downloaded bytes so the same URL can recover', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = mock(async () => {
    requests++;
    return new Response(new Uint8Array([requests]));
  }) as unknown as typeof fetch;
  const { loadTexture } = await import('../texture');
  try {
    await expect(loadTexture('https://example.test/retry.png')).rejects.toThrow('temporary failure');
    native.textureLoad.mockImplementation(() => 7);
    expect(await loadTexture('https://example.test/retry.png')).toEqual({
      id: 7,
      width: 1,
      height: 1
    });
    expect(requests).toBe(2);
    await loadTexture('https://example.test/retry.png');
    expect(requests).toBe(2);
  } finally {
    globalThis.fetch = original;
  }
});
