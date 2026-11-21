import { expect, mock, spyOn, test } from 'bun:test';
mock.module('../native/NativeNayanEngine', () => ({ default: null }));
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  AppState: { addEventListener: () => ({ remove() {} }) },
  Image: { resolveAssetSource: () => null }
}));
const { audio } = await import('../audio/audio');
const { haptics } = await import('../haptics/haptics');
test('required world and asset APIs explain a missing native installation', async () => {
  const { prepareCore } = await import('../native/core');
  await expect(prepareCore()).rejects.toThrow('NayanEngine linked');
  const { uuid } = await import('../uuid');
  expect(() => uuid()).toThrow('native app rebuild');
  const { createStorage } = await import('../storage/index');
  expect(() => createStorage()).toThrow('rebuild the native app');
  const { World } = await import('../games/world/World');
  const { createShape, shapeGeometry } = await import('../games/assets/shape');
  const { loadModel } = await import('../games/assets/model');
  const { loadTexture } = await import('../games/assets/texture');
  const { loadFont } = await import('../games/assets/font');
  expect(() => new World(1)).toThrow();
  expect(() => shapeGeometry('cube')).toThrow();
  expect(() => createShape({ vertices: new Float32Array(), indices: new Uint32Array() })).toThrow();
  await expect(loadModel('missing.glb')).rejects.toThrow('engine');
  await expect(loadTexture('missing.png')).rejects.toThrow('engine');
  await expect(loadFont('missing.ttf')).rejects.toThrow('engine');
});
test('missing native feedback is optional and never prevents a host from mounting', async () => {
  const warning = spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const bank = audio.load({ effect: 'effect.wav' });
    await bank.ready;
    expect(bank.get('effect')).toBeUndefined();
    expect(audio.play(1 as never)).toBeNull();
    expect(audio.running).toBe(false);
    audio.stop(1 as never);
    audio.muted = true;
    audio.volume = 0.5;
    expect(audio.muted).toBe(true);
    expect(audio.volume).toBe(0.5);
    expect(haptics.supported).toBe(false);
    haptics.impact();
    haptics.selection();
    haptics.notify('warning');
    haptics.play([]);
  } finally {
    warning.mockRestore();
  }
});
