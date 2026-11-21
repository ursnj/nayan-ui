import { afterAll, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const wasm = await import('../../../native/core/build/web/engine_core.js');
const core = await wasm.default({
  module_or_path: await readFile(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url))
});
let initialized = false;
const initialize = mock(async () => {
  if (!initialized) {
    initialized = true;
    throw new Error('wasm download failed');
  }
  return core;
});
const started: number[] = [];
const gates: { resolve: () => void; reject: (error: Error) => void }[] = [];
const attach = mock((id: number) => {
  started.push(id);
  return new Promise<void>((resolve, reject) => gates.push({ resolve, reject }));
});
const storage = {
  warm: mock(async () => {}),
  flush: mock(async () => {}),
  cleared: mock(async () => {})
};
const open = mock(async () => storage);
const install = mock((_storage: unknown) => {});
mock.module('../../assets/IndexedDbCache.web', () => ({
  IndexedDbCache: { open }
}));
mock.module('../../audio/output.web', () => ({
  installAudioOutput: () => () => true
}));
mock.module('../../../native/core/build/web/engine_core.js', () => ({
  ...wasm,
  default: initialize,
  attach_canvas: attach,
  install_asset_storage: install,
  read_saved_asset: async (key: string) => (key === 'present' ? new Uint8Array([8, 9]) : new Uint8Array())
}));
const {
  default: engine,
  prepareEngine,
  attachCanvas,
  detachCanvas,
  readSavedAsset,
  flushAssetStorage,
  clearedAssetStorage
} = await import('../NativeNayanEngine.web');
async function tick() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

test('SSR-safe import, shared initialization, failed-download retry and persistent storage install', async () => {
  expect(() => engine.generateBuiltinMeshes()).toThrow('warmUpEngine');
  expect(() => engine.createWorld(1)).toThrow('warmUpEngine');
  detachCanvas(0);
  await expect(flushAssetStorage()).rejects.toThrow('unavailable');
  await expect(clearedAssetStorage()).rejects.toThrow('unavailable');
  const first = prepareEngine();
  expect(prepareEngine()).toBe(first);
  await expect(first).rejects.toThrow('wasm download failed');
  const second = prepareEngine();
  expect(prepareEngine()).toBe(second);
  await second;
  engine.generateBuiltinMeshes();
  // Bound directly after warm-up: the same function on every access, no per-access trap.
  const createWorld = engine.createWorld;
  expect(engine.createWorld).toBe(createWorld);
  engine.destroyWorld(createWorld(4));
  expect(initialize).toHaveBeenCalledTimes(2);
  expect(open).toHaveBeenCalledTimes(1);
  expect(install).toHaveBeenCalledWith(storage);
  expect(storage.warm).toHaveBeenCalledTimes(1);
  expect(engine.audioIsRunning()).toBe(true);
  expect(await readSavedAsset('absent')).toBeNull();
  expect(new Uint8Array((await readSavedAsset('present'))!)).toEqual(new Uint8Array([8, 9]));
  await flushAssetStorage();
  await clearedAssetStorage();
  expect(storage.flush).toHaveBeenCalledTimes(1);
  expect(storage.cleared).toHaveBeenCalledTimes(1);
});

test('the core entry shares the initialized WASM instance without opening another cache', async () => {
  const { prepareCore } = await import('../runtime.web');
  const { prepareWasm } = await import('../wasm.web');
  const first = prepareWasm();
  expect(prepareWasm()).toBe(first);
  expect(await first).toBe(core);
  await prepareCore();
  expect(initialize).toHaveBeenCalledTimes(2);
  expect(open).toHaveBeenCalledTimes(1);
});

test('canvas initialization serializes GPU adapter access and a failed attach does not block the next', async () => {
  const first = attachCanvas(1, {} as HTMLCanvasElement);
  const second = attachCanvas(2, {} as HTMLCanvasElement);
  await tick();
  expect(started).toEqual([1]);
  gates[0]!.reject(new Error('adapter unavailable'));
  await expect(first).rejects.toThrow('adapter unavailable');
  await tick();
  expect(started).toEqual([1, 2]);
  gates[1]!.resolve();
  await second;
  detachCanvas(2);
});

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
afterAll(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else Reflect.deleteProperty(globalThis, 'navigator');
});
test('browser persistence permission never blocks startup and is requested only once', async () => {
  const persist = mock(() => Promise.reject(new Error('denied')));
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { storage: { persist } }
  });
  const prepare = await import('../prepare.web');
  await prepare.prepareEngine();
  await prepare.prepareEngine();
  expect(persist).toHaveBeenCalledTimes(1);
  expect(initialize).toHaveBeenCalledTimes(2);
});
