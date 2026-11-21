import { afterEach, expect, mock, test } from 'bun:test';
import type { NetworkListener, OnlineState } from '../types';

let changed: NetworkListener = () => {};
let initial: OnlineState | undefined;
let fail = false;
const stop = mock(() => {});
const observe = mock((listener: NetworkListener) => {
  if (fail) throw new Error('missing native build');
  changed = listener;
  if (initial !== undefined) listener(initial);
  return stop;
});
mock.module('../networkPlatform', () => ({ observeNetwork: observe }));
const { network, getOnlineSnapshot } = await import('../network');
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  observe.mockClear();
  stop.mockClear();
  initial = undefined;
  fail = false;
});

test('listeners share one observer, preserve unknown, deduplicate changes and clean up independently', () => {
  const first = mock((_online: OnlineState) => {}),
    second = mock((_online: OnlineState) => {});
  const a = network.subscribe(first),
    b = network.subscribe(second);
  cleanups.push(a, b);
  expect(observe).toHaveBeenCalledTimes(1);
  expect(first.mock.calls).toEqual([[null]]);
  changed(false);
  changed(false);
  changed(true);
  expect(first.mock.calls).toEqual([[null], [false], [true]]);
  expect(second.mock.calls).toEqual(first.mock.calls);
  a();
  a();
  changed(false);
  expect(first).toHaveBeenCalledTimes(3);
  expect(second).toHaveBeenCalledTimes(4);
  expect(stop).not.toHaveBeenCalled();
  b();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(getOnlineSnapshot()).toBeNull();
  changed(true);
  expect(getOnlineSnapshot()).toBeNull();
});

test('one-off checks wait for the initial report and release the observer; concurrent checks share it', async () => {
  const a = network.fetch(),
    b = network.fetch();
  let resolved = false;
  void a.then(() => {
    resolved = true;
  });
  await Promise.resolve();
  expect(resolved).toBe(false);
  expect(observe).toHaveBeenCalledTimes(1);
  changed(false);
  expect(await Promise.all([a, b])).toEqual([false, false]);
  expect(stop).toHaveBeenCalledTimes(1);
});

test('synchronous browser reports and unavailable platform status resolve without leaking a watch', async () => {
  initial = true;
  expect(await network.fetch()).toBe(true);
  initial = null;
  expect(await network.fetch()).toBeNull();
  expect(stop).toHaveBeenCalledTimes(2);
});

test('one-off checks reuse a live subscription, then fresh subscriptions discard stale observations', async () => {
  const listener = mock((_online: OnlineState) => {});
  const off = network.subscribe(listener);
  cleanups.push(off);
  changed(true);
  expect(await network.fetch()).toBe(true);
  expect(stop).not.toHaveBeenCalled();
  const stale = changed;
  off();
  const next = mock((_online: OnlineState) => {});
  cleanups.push(network.subscribe(next));
  stale(false);
  expect(next.mock.calls).toEqual([[null]]);
  changed(true);
  expect(next.mock.calls).toEqual([[null], [true]]);
});

test('reusing a callback still creates independent subscriptions and startup failures can be retried', async () => {
  fail = true;
  await expect(network.fetch()).rejects.toThrow('missing native build');
  fail = false;
  const listener = mock((_online: OnlineState) => {});
  const a = network.subscribe(listener),
    b = network.subscribe(listener);
  cleanups.push(a, b);
  listener.mockClear();
  a();
  changed(true);
  expect(listener.mock.calls).toEqual([[true]]);
  expect(stop).not.toHaveBeenCalled();
});

test('an unresponsive platform returns unknown and releases its observer after the deadline', async () => {
  expect(await network.fetch()).toBeNull();
  expect(stop).toHaveBeenCalledTimes(1);
}, 8000);

test('waitForOnline keeps watching through offline and cleans up on success, timeout and abort', async () => {
  initial = false;
  const pending = network.waitForOnline();
  expect(stop).not.toHaveBeenCalled();
  changed(null);
  changed(true);
  expect(await pending).toBe(true);
  expect(await network.waitForOnline({ timeoutMs: 0 })).toBe(false);
  const controller = new AbortController();
  const aborted = network.waitForOnline({ signal: controller.signal });
  controller.abort();
  await expect(aborted).rejects.toHaveProperty('name', 'AbortError');
  await expect(network.waitForOnline({ signal: controller.signal })).rejects.toHaveProperty('name', 'AbortError');
  expect(stop).toHaveBeenCalledTimes(3);
});
