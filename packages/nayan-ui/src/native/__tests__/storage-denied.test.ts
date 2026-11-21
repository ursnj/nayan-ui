import { expect, mock, test } from 'bun:test';
const open = mock(async () => {
  throw new Error('SecurityError');
});
mock.module('../../assets/IndexedDbCache.web', () => ({
  IndexedDbCache: { open }
}));
mock.module('../../audio/output.web', () => ({
  installAudioOutput: () => () => false
}));
mock.module('../../../native/core/build/web/engine_core.js', () => ({
  default: async () => ({
    memory: new WebAssembly.Memory({ initial: 1 }),
    engine_generate_builtin_meshes: () => {}
  }),
  attach_canvas: async () => {},
  install_asset_storage: () => {},
  can_warm_asset_record: () => false,
  restore_asset_record: () => false,
  read_saved_asset: async () => new Uint8Array()
}));
test('denied browser storage leaves the engine usable without retrying startup forever', async () => {
  const { default: engine, prepareEngine, readSavedAsset, flushAssetStorage, clearedAssetStorage } = await import('../NativeNayanEngine.web');
  await prepareEngine();
  await prepareEngine();
  engine.generateBuiltinMeshes();
  expect(engine.audioIsRunning()).toBe(false);
  expect(await readSavedAsset('anything')).toBeNull();
  await expect(flushAssetStorage()).rejects.toThrow('unavailable');
  await expect(clearedAssetStorage()).rejects.toThrow('unavailable');
  expect(open).toHaveBeenCalledTimes(1);
});
