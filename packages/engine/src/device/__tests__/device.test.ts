import { expect, mock, test } from 'bun:test';
import type { DeviceEnvironment } from '../types';
let environment: DeviceEnvironment = 'physical';
mock.module('../devicePlatform', () => ({ getDeviceEnvironment: () => environment }));
const { device } = await import('../device');
const browser = await import('../devicePlatform.web');

test('physical, emulator, simulator and browser environments have distinct predicates', () => {
  for (const value of ['physical', 'emulator', 'simulator', 'browser'] as const) {
    environment = value;
    expect(device.getEnvironment()).toBe(value);
    expect(device.isPhysicalDevice()).toBe(value === 'physical');
    expect(device.isVirtualDevice()).toBe(value === 'emulator' || value === 'simulator');
  }
});

test('browser and server imports do not guess hardware from the user agent', () => {
  expect(browser.getDeviceEnvironment()).toBe('browser');
});
