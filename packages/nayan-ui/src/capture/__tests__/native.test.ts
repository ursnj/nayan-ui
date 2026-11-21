import { beforeEach, expect, mock, test } from 'bun:test';
const image = { uri: 'file:///cache/nayan-captures/capture-test.png', width: 1080, height: 1920, scale: 3 };
const request = mock(async (_action: string, _uri: string) => JSON.stringify(image));
const engine = { captureRequest: request };
mock.module('../../native/NativeNayanEngine', () => ({ default: engine }));
const { capture } = await import('../capturePlatform');
beforeEach(() => request.mockReset().mockResolvedValue(JSON.stringify(image)));

test('native capture returns pixel extent and scale without transferring pixels through JS', async () => {
  expect(await capture.isAvailable()).toBe(true);
  expect(await capture.screen()).toEqual(image);
  expect(request).toHaveBeenCalledWith('screen', '');
  await capture.release(image.uri);
  expect(request).toHaveBeenLastCalledWith('release', image.uri);
});
test('capture failures propagate and invalid bridge metadata is rejected', async () => {
  const error = new Error('Surface has no readable frame');
  request.mockRejectedValueOnce(error);
  await expect(capture.screen()).rejects.toBe(error);
  request.mockResolvedValueOnce(JSON.stringify({ ...image, scale: 0 }));
  await expect(capture.screen()).rejects.toThrow('Invalid native capture');
  await expect(capture.release('')).rejects.toBeInstanceOf(TypeError);
});
test('older app builds report unavailable and explain the native rebuild requirement', async () => {
  Object.defineProperty(engine, 'captureRequest', { configurable: true, value: undefined });
  try {
    expect(await capture.isAvailable()).toBe(false);
    await expect(capture.screen()).rejects.toThrow('native app rebuild');
  } finally {
    Object.defineProperty(engine, 'captureRequest', { configurable: true, value: request });
  }
});
