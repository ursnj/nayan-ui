import { expect, mock, test } from 'bun:test';
import type { PermissionResult } from '../types';

test('native requests deduplicate, queue across permissions, and recover after rejection', async () => {
  const camera = Promise.withResolvers<PermissionResult>();
  const granted = { status: 'granted', canAskAgain: false } as const;
  const call = mock((command: { action: string; permission?: string }) => {
    if (command.action === 'permissions.openSettings') return Promise.resolve(true);
    if (command.action === 'permissions.request' && command.permission === 'camera') return camera.promise;
    return Promise.resolve(granted);
  });
  mock.module('../../native/appServices', () => ({ requestAppService: call }));
  const { permissions } = await import('../index');

  const first = permissions.request('camera');
  expect(permissions.request('camera')).toBe(first);
  const second = permissions.request('microphone');
  expect(await permissions.check('microphone')).toEqual(granted);
  expect(call.mock.calls.map(([command]) => command)).toEqual([
    { action: 'permissions.check', permission: 'microphone' },
    { action: 'permissions.request', permission: 'camera' }
  ]);
  camera.reject(new Error('Activity closed'));
  await expect(first).rejects.toThrow('Activity closed');
  expect(await second).toEqual(granted);
  expect(call.mock.calls.at(-1)?.[0]).toEqual({ action: 'permissions.request', permission: 'microphone' });
  expect(await permissions.check('android:com.example.permission.DEVICE')).toEqual(granted);
  expect(call.mock.calls.at(-1)?.[0]).toEqual({ action: 'permissions.check', permission: 'android:com.example.permission.DEVICE' });
  expect(await permissions.openSettings('exact-alarms')).toBe(true);
  expect(call.mock.calls.at(-1)?.[0]).toEqual({ action: 'permissions.openSettings', permission: 'exact-alarms' });

  call.mockClear();
  expect(await permissions.checkMany(['contacts', 'microphone', 'contacts'])).toEqual(
    new Map([
      ['contacts', granted],
      ['microphone', granted]
    ])
  );
  expect(call.mock.calls.map(([command]) => command.permission)).toEqual(['contacts', 'microphone']);
  call.mockClear();
  const requested = await permissions.requestMany(['notifications', 'location', 'notifications']);
  expect([...requested.keys()]).toEqual(['notifications', 'location']);
  expect(call.mock.calls.map(([command]) => command.permission)).toEqual(['notifications', 'location']);
});
