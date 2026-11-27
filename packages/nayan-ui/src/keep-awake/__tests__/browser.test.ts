import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import { keepAwake } from '../keepAwake.web';

let dom: ReturnType<typeof installDom>;
let visibility: DocumentVisibilityState;
const request = mock(async (_type: string): Promise<WakeLockSentinel> => makeLock().sentinel);

function makeLock() {
  const events = new dom.window.EventTarget();
  const release = mock(async () => {
    events.dispatchEvent(new dom.window.Event('release'));
  });
  return { release, events, sentinel: Object.assign(events, { release }) as unknown as WakeLockSentinel };
}

beforeEach(() => {
  dom = installDom();
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  request.mockClear();
});

afterEach(async () => {
  try {
    await keepAwake.deactivate('first');
    await keepAwake.deactivate('second');
    await keepAwake.deactivate();
  } finally {
    dom.cleanup();
  }
});

test('concurrent tags share a screen lock and the last tag releases it', async () => {
  const lock = makeLock();
  const pending = Promise.withResolvers<WakeLockSentinel>();
  request.mockImplementationOnce(() => pending.promise);
  const activations = [keepAwake.activate('first'), keepAwake.activate('first'), keepAwake.activate('second')];
  expect(request.mock.calls).toEqual([['screen']]);
  pending.resolve(lock.sentinel);
  await Promise.all(activations);
  await keepAwake.deactivate('first');
  expect(lock.release).not.toHaveBeenCalled();
  await keepAwake.deactivate('second');
  expect(lock.release).toHaveBeenCalledTimes(1);
});

test('a late acquire after cancellation releases the lock without keeping a visibility listener', async () => {
  const lock = makeLock();
  const pending = Promise.withResolvers<WakeLockSentinel>();
  request.mockImplementationOnce(() => pending.promise);
  const activation = keepAwake.activate();
  await keepAwake.deactivate();
  pending.resolve(lock.sentinel);
  await activation;
  expect(lock.release).toHaveBeenCalledTimes(1);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(request).toHaveBeenCalledTimes(1);
});

test('hidden pages acquire on visibility and reacquire after the browser releases the lock', async () => {
  const first = makeLock();
  const second = makeLock();
  request.mockResolvedValueOnce(first.sentinel).mockResolvedValueOnce(second.sentinel);
  visibility = 'hidden';
  await keepAwake.activate();
  expect(request).not.toHaveBeenCalled();
  visibility = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  await keepAwake.activate();
  await first.release();
  document.dispatchEvent(new Event('visibilitychange'));
  await keepAwake.activate();
  expect(request).toHaveBeenCalledTimes(2);
  await keepAwake.deactivate();
  expect(second.release).toHaveBeenCalledTimes(1);
});

test('invalid and unsupported requests fail clearly and a denied lock can be retried', async () => {
  const lock = makeLock();
  await expect(keepAwake.activate('')).rejects.toThrow('tag is required');
  await expect(keepAwake.deactivate('a'.repeat(257))).rejects.toThrow('tag is required');
  request.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(lock.sentinel);
  await expect(keepAwake.activate()).rejects.toThrow('denied');
  await keepAwake.activate();
  await keepAwake.deactivate();
  expect(lock.release).toHaveBeenCalledTimes(1);
  Reflect.deleteProperty(navigator, 'wakeLock');
  expect(keepAwake.isAvailable()).toBe(false);
  await expect(keepAwake.activate()).rejects.toThrow('unavailable');
});
