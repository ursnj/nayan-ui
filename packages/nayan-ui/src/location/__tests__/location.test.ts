import { expect, mock, test } from 'bun:test';
import type { LocationPosition, LocationResult } from '../types';

interface Command {
  action: string;
  id: string;
  highAccuracy?: boolean;
  permission?: string;
}

const requests: Command[] = [];
const pending = new Map<string, (result: LocationResult) => void>();
mock.module('../../native/NativeNayanEngine', () => ({
  default: {
    appRequest(json: string) {
      const command = JSON.parse(json) as Command;
      requests.push(command);
      switch (command.action) {
        case 'location.next':
          return new Promise<LocationResult>((resolve) => pending.set(command.id, resolve)).then(JSON.stringify);
        case 'location.stop':
          deliver(command.id, { error: 'aborted' });
          return Promise.resolve('null');
        case 'location.available':
          return Promise.resolve('true');
        default:
          return Promise.resolve('{"status":"limited","canAskAgain":true}');
      }
    }
  }
}));

const { location } = await import('../index');

const position: LocationPosition = {
  latitude: 12.97,
  longitude: 77.59,
  timestamp: 1000,
  accuracy: 20,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null
};

function deliver(id: string, result: LocationResult) {
  const reply = pending.get(id);
  pending.delete(id);
  reply?.(result);
}

function latestRequest(): Command {
  return requests.filter(({ action }) => action === 'location.next').at(-1)!;
}

test('reads one position, releases its provider and delegates permission requests', async () => {
  expect(await location.isAvailable()).toBe(true);
  expect((await location.requestPermission('approximate')).status).toBe('limited');
  expect(requests.at(-1)).toMatchObject({ action: 'permissions.request', permission: 'location-coarse' });
  const read = location.getCurrentPosition({ highAccuracy: true });
  const request = latestRequest();
  expect(request.highAccuracy).toBe(true);
  deliver(request.id, { position });
  expect(await read).toEqual(position);
  expect(requests.at(-1)).toMatchObject({ action: 'location.stop', id: request.id });
  expect(pending.has(request.id)).toBe(false);
});

test('independent subscriptions receive new fixes and ignore updates racing with removal', async () => {
  const seen = mock((_position: LocationPosition) => {});
  const ignored = mock((_position: LocationPosition) => {});
  const stopFirst = location.subscribe(seen);
  const first = latestRequest().id;
  const stopSecond = location.watchPosition(ignored);
  const second = latestRequest().id;
  expect(first).not.toBe(second);
  deliver(second, { position });
  stopSecond();
  stopSecond();
  deliver(first, { position });
  await Bun.sleep(0);
  expect(ignored).not.toHaveBeenCalled();
  expect(seen).toHaveBeenCalledWith(position);
  const another = { ...position, timestamp: 2000 };
  deliver(first, { position: another });
  await Bun.sleep(0);
  expect(seen).toHaveBeenLastCalledWith(another);
  stopFirst();
  expect(requests.filter(({ action, id }) => action === 'location.stop' && id === second)).toHaveLength(1);
  expect(pending.size).toBe(0);
});

test('rejects denial, timeout and abort and stops the provider', async () => {
  const denied = location.getCurrentPosition();
  deliver(latestRequest().id, { error: 'permission-denied' });
  await expect(denied).rejects.toMatchObject({ code: 'permission-denied' });

  await expect(location.getCurrentPosition({ timeoutMs: 5 })).rejects.toMatchObject({ code: 'timeout' });
  const controller = new AbortController();
  const cancelled = location.getCurrentPosition({ signal: controller.signal });
  controller.abort();
  await expect(cancelled).rejects.toMatchObject({ code: 'aborted' });
  const numberOfRequests = requests.length;
  await expect(location.getCurrentPosition({ signal: controller.signal })).rejects.toMatchObject({ code: 'aborted' });
  expect(requests.length).toBe(numberOfRequests);
  expect(pending.size).toBe(0);
});
