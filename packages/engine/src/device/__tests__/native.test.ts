import { expect, mock, test } from 'bun:test';
const bridge: { deviceEnvironment?: () => string } = {};
mock.module('../../native/NativeNayanEngine', () => ({ default: bridge }));
const { getDeviceEnvironment } = await import('../devicePlatform');

test('missing/invalid native detection never silently reports physical hardware and remains retryable', () => {
  expect(() => getDeviceEnvironment()).toThrow('native app rebuild');
  bridge.deviceEnvironment = () => 'unsupported';
  expect(() => getDeviceEnvironment()).toThrow('unsupported device environment');
});

test('the fixed native environment is read once and needs no engine warm-up', () => {
  const detect = mock(() => 'emulator');
  bridge.deviceEnvironment = detect;
  expect(getDeviceEnvironment()).toBe('emulator');
  expect(getDeviceEnvironment()).toBe('emulator');
  expect(detect).toHaveBeenCalledTimes(1);
});
