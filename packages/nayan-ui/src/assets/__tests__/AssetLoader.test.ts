import { expect, mock, test } from 'bun:test';

let initialize: () => Promise<void> | undefined = () => undefined;
const native = {};
const bytes = new ArrayBuffer(8);
const read = mock(async (source: string | number) => ({
  uri: String(source),
  bytes
}));
const forget = mock(() => {});
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../../native/prepare', () => ({
  prepareEngine: () => initialize()
}));
mock.module('../source', () => ({
  assetUri: (source: string | number) => {
    if (source === 0) throw new Error('invalid Metro asset');
    return String(source);
  },
  loadAssetBytes: read
}));
mock.module('../AssetBytesCache', () => ({ forgetAssetBytes: forget }));
const { AssetLoader } = await import('../AssetLoader');

test('concurrent assets wait for the core, while identical variants share one decode', async () => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  initialize = () => ready;
  const loader = new AssetLoader<object>('example');
  const decode = mock((core: object, data: ArrayBuffer) => {
    expect(core).toBe(native);
    expect(data).toBe(bytes);
    return {};
  });
  const first = loader.load('model.glb', decode, [true, 2]);
  expect(loader.load('model.glb', decode, [true, 2])).toBe(first);
  const variant = loader.load('model.glb', decode, [false, 2]);
  await Promise.resolve();
  expect(read).not.toHaveBeenCalled();
  expect(decode).not.toHaveBeenCalled();
  release();
  const [a, b] = await Promise.all([first, variant]);
  expect(a).not.toBe(b);
  expect(decode).toHaveBeenCalledTimes(2);
  expect(await loader.load('model.glb', decode, [true, 2])).toBe(a);
  expect(decode).toHaveBeenCalledTimes(2);
});

test('initialization failures preserve saved payloads and the same request can retry', async () => {
  const cause = new Error('WASM unavailable');
  initialize = async () => {
    throw cause;
  };
  const loader = new AssetLoader<number>('loadModel');
  const error = await loader.load('retry.glb', () => 4).catch((error: Error) => error);
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).cause).toBe(cause);
  expect((error as Error).message).toContain("loadModel: couldn't load retry.glb");
  expect(forget).not.toHaveBeenCalled();
  initialize = () => undefined;
  expect(await loader.load('retry.glb', () => 4)).toBe(4);
});

test('invalid payloads evict saved bytes and a decoder retry builds a fresh handle', async () => {
  const loader = new AssetLoader<number>('loadTexture');
  const cause = new Error('not a PNG');
  await expect(
    loader.load('retry.png', () => {
      throw cause;
    })
  ).rejects.toThrow('not a PNG');
  expect(forget).toHaveBeenCalledTimes(1);
  expect(forget).toHaveBeenCalledWith('retry.png');
  expect(await loader.load('retry.png', () => 8)).toBe(8);
});

test('asset resolution errors reject asynchronously with the API name and original cause', async () => {
  const loader = new AssetLoader<number>('loadFont');
  let result!: Promise<number>;
  expect(() => {
    result = loader.load(0, () => 1);
  }).not.toThrow();
  await expect(result).rejects.toThrow("loadFont: couldn't load 0: invalid Metro asset");
});
