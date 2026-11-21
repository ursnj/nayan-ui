import { afterEach, expect, mock, test } from 'bun:test';

const textureLoadAsync = mock(async (_bytes: ArrayBuffer) => 42);
const textureLoadSizedAsync = mock(async (_bytes: ArrayBuffer, _width: number, _height: number, _fit: number) => 84);
const forget = mock((_key: string) => {});
const cached = mock(async (_key: string, load: () => Promise<ArrayBuffer>) => load());
const persistent = mock(async (_key: string): Promise<ArrayBuffer | null> => null);
const originalFetch = globalThis.fetch;

mock.module('../../native/NativeNayanEngine', () => ({ default: { textureLoadAsync, textureLoadSizedAsync } }));

mock.module('../../assets/AssetBytesCache', () => ({ assetBytes: cached, forgetAssetBytes: forget }));

mock.module('../../assets/storage', () => ({ readPersistentAsset: persistent }));

mock.module('../../assets/source', () => ({ loadAssetBytes: async (_source: number) => ({ bytes: new ArrayBuffer(8) }) }));

const { loadUIImage } = await import('../imageLoader');

afterEach(() => {
  globalThis.fetch = originalFetch;
  textureLoadAsync.mockClear();
  textureLoadSizedAsync.mockClear();
  forget.mockClear();
  cached.mockClear();
  persistent.mockClear();
});

test('remote images forward headers and decode off the JS thread', async () => {
  const request = mock(async (_uri: unknown, _options: unknown) => new Response(new Uint8Array([1, 2, 3])));
  globalThis.fetch = request as unknown as typeof fetch;
  expect(await loadUIImage({ uri: 'https://example.test/avatar.png', headers: { Authorization: 'test' } }, 'none', () => false)).toBe(42);
  expect(request.mock.calls[0]).toEqual(['https://example.test/avatar.png', { headers: { Authorization: 'test' }, cache: 'no-store' }]);
  expect(textureLoadAsync).toHaveBeenCalledTimes(1);
  expect(cached).not.toHaveBeenCalled();
});

test('failed HTTP and oversized payloads never reach the decoder', async () => {
  globalThis.fetch = (async () => new Response('', { status: 404 })) as unknown as typeof fetch;
  await expect(loadUIImage({ uri: 'https://example.test/404' }, 'none', () => false)).rejects.toThrow('HTTP 404');
  globalThis.fetch = (async () => new Response('', { headers: { 'content-length': String(33 * 1024 * 1024) } })) as unknown as typeof fetch;
  await expect(loadUIImage({ uri: 'https://example.test/large' }, 'none', () => false)).rejects.toThrow('32 MiB');
  expect(textureLoadAsync).not.toHaveBeenCalled();
});

test('disposed images skip decode and offline-only misses skip network', async () => {
  const request = mock(async () => new Response(new Uint8Array([1])));
  globalThis.fetch = request as unknown as typeof fetch;
  expect(await loadUIImage({ uri: 'https://example.test/old' }, 'none', () => true)).toBeNull();
  expect(textureLoadAsync).not.toHaveBeenCalled();
  request.mockClear();
  await expect(loadUIImage({ uri: 'https://example.test/offline', cache: 'only-if-cached' }, 'disk', () => false)).rejects.toThrow('No cached image');
  expect(request).not.toHaveBeenCalled();
});

test('bundled images use asset resolution and corrupt decodes invalidate saved bytes', async () => {
  textureLoadAsync.mockImplementationOnce(async () => -1);
  await expect(loadUIImage({ uri: 'asset', assetModule: 7 }, 'memory-disk', () => false)).rejects.toThrow('unsupported format');
  expect(forget).toHaveBeenCalledTimes(1);
  expect(await loadUIImage({ uri: 'asset', assetModule: 7 }, 'memory-disk', () => false)).toBe(42);
});

test('Rust layout targets use the background sized decoder; memory policy shares bytes without writing disk', async () => {
  globalThis.fetch = (async () => new Response(new Uint8Array([1, 2, 3]))) as unknown as typeof fetch;
  expect(await loadUIImage({ uri: 'https://example.test/sized' }, 'memory', () => false, { width: 576, height: 576, fit: 0 })).toBe(84);
  expect(textureLoadSizedAsync.mock.calls[0]?.slice(1)).toEqual([576, 576, 0]);
  expect(textureLoadAsync).not.toHaveBeenCalled();
  expect(cached.mock.calls[0]?.[0]).toContain('sized');
});

test('the global queue bounds concurrent roots and drops cancelled queued images before network or decode', async () => {
  const finish: (() => void)[] = [];
  let requests = 0;
  globalThis.fetch = (() => {
    requests++;
    return new Promise<Response>((resolve) => finish.push(() => resolve(new Response(new Uint8Array([1])))));
  }) as unknown as typeof fetch;
  let cancelled = false;
  const jobs = Array.from({ length: 7 }, (_, index) =>
    loadUIImage({ uri: `https://example.test/${index}` }, 'none', () => index === 6 && cancelled, { width: 64, height: 64, fit: 0 })
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(requests).toBe(4);
  cancelled = true;
  finish.splice(0).forEach((resolve) => resolve());
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(requests).toBe(6);
  finish.splice(0).forEach((resolve) => resolve());
  const results = await Promise.all(jobs);
  expect(results[6]).toBeNull();
  expect(textureLoadSizedAsync).toHaveBeenCalledTimes(6);
});

test('chunked oversized responses are cancelled before native decoding', async () => {
  const cancel = mock(() => {});
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(33 * 1024 * 1024));
    },
    cancel
  });
  globalThis.fetch = (async () => new Response(body)) as unknown as typeof fetch;
  await expect(loadUIImage({ uri: 'https://example.test/chunked' }, 'none', () => false, { width: 64, height: 64, fit: 0 })).rejects.toThrow(
    '32 MiB'
  );
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(textureLoadSizedAsync).not.toHaveBeenCalled();
});
