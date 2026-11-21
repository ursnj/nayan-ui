import { expect, mock, test } from 'bun:test';
let foreground: (state: string) => void = () => {};
const remove = mock(() => {});
const appListen = mock((_event: string, listener: (state: string) => void) => {
  foreground = listener;
  return { remove };
});
const callbacks: ((state: number) => void)[] = [];
const engine = {
  networkStart: mock((listener: (state: number) => void) => {
    callbacks.push(listener);
  }),
  networkStop: mock(() => {})
};
mock.module('react-native', () => ({ AppState: { addEventListener: appListen } }));
mock.module('../../native/NativeNayanEngine', () => ({ default: engine }));
const { observeNetwork } = await import('../networkPlatform');

test('native changes map to nullable booleans, foreground refresh ignores stale callbacks and cleanup stops delivery', () => {
  const changed = mock((_online: boolean | null) => {});
  const stop = observeNetwork(changed);
  expect(changed).not.toHaveBeenCalled();
  callbacks[0]!(1);
  callbacks[0]!(0);
  callbacks[0]!(-1);
  expect(changed.mock.calls).toEqual([[true], [false], [null]]);
  foreground('background');
  expect(engine.networkStart).toHaveBeenCalledTimes(1);
  foreground('active');
  expect(engine.networkStart).toHaveBeenCalledTimes(2);
  callbacks[0]!(0);
  expect(changed).toHaveBeenCalledTimes(3);
  callbacks[1]!(1);
  expect(changed).toHaveBeenCalledTimes(4);
  stop();
  stop();
  callbacks[1]!(0);
  foreground('active');
  expect(changed).toHaveBeenCalledTimes(4);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(engine.networkStop).toHaveBeenCalledTimes(1);
});

test('older native builds report a clear rebuild requirement', () => {
  const start = engine.networkStart;
  Object.defineProperty(engine, 'networkStart', { value: undefined, configurable: true });
  try {
    expect(() => observeNetwork(() => {})).toThrow('native app rebuild');
  } finally {
    Object.defineProperty(engine, 'networkStart', { value: start, configurable: true });
  }
});
