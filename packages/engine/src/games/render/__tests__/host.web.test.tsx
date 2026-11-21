import { act } from 'react';
import { afterAll, afterEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../../__tests__/dom';

const dom = installDom();
const { createRoot } = await import('react-dom/client');
let settle: { resolve: () => void; reject: (error: unknown) => void };
const attach = mock(
  (_id: number, _canvas: HTMLCanvasElement) =>
    new Promise<void>((resolve, reject) => {
      settle = { resolve, reject };
    })
);
const detach = mock((_id: number) => {});
mock.module('../../../native/NativeNayanEngine.web', () => ({
  attachCanvas: attach,
  detachCanvas: detach
}));
const webResponder = await import('../responder.web');
mock.module('../responder', () => webResponder);
const { Surface, useActive, pixelRatio } = await import('../host.web');
let resized: ResizeObserverCallback;
const disconnect = mock(() => {});
globalThis.ResizeObserver = class {
  constructor(callback: ResizeObserverCallback) {
    resized = callback;
  }
  observe() {}
  unobserve() {}
  disconnect = disconnect;
} as unknown as typeof ResizeObserver;
let root: ReturnType<typeof createRoot> | undefined;
const sizes = mock((_width: number, _height: number) => {});
const errors = mock((_error: Error) => {});
const cancel = mock(() => {});
async function render(id = 1, onError = errors, onSize = sizes, onPrimaryAction?: () => void) {
  root ??= createRoot(document.createElement('div'));
  await act(async () =>
    root!.render(
      <Surface
        surfaceId={id}
        onSize={onSize}
        onError={onError}
        onPrimaryAction={onPrimaryAction}
        touch={{ cancel, dispose: () => {}, responder: { panHandlers: {} } } as never}
      />
    )
  );
}
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  attach.mockClear();
  detach.mockClear();
  sizes.mockClear();
  errors.mockClear();
  cancel.mockClear();
  disconnect.mockClear();
});
afterAll(() => dom.cleanup());

test('keyboard primary actions reach the current callback and unsubscribe on unmount', async () => {
  const first = mock(() => {}),
    next = mock(() => {});
  await render(1, errors, sizes, first);
  const canvas = attach.mock.calls[0]![1];
  const event = () =>
    new dom.window.CustomEvent('nayan-engine-primary-action', {
      bubbles: true,
      cancelable: true
    });
  canvas.dispatchEvent(event() as unknown as Event);
  expect(first).toHaveBeenCalledTimes(1);
  await render(1, errors, sizes, next);
  canvas.dispatchEvent(event() as unknown as Event);
  expect(next).toHaveBeenCalledTimes(1);
  await act(async () => root!.unmount());
  root = undefined;
  canvas.dispatchEvent(event() as unknown as Event);
  expect(next).toHaveBeenCalledTimes(1);
});

test('surface measures initially and on resize using latest callbacks without reattaching', async () => {
  await render();
  expect(sizes).toHaveBeenCalledWith(0, 0);
  const next = mock((_width: number, _height: number) => {});
  await render(1, errors, next);
  resized([], {} as ResizeObserver);
  expect(next).toHaveBeenCalledWith(0, 0);
  expect(attach).toHaveBeenCalledTimes(1);
  settle.resolve();
  await Promise.resolve();
  expect(detach).not.toHaveBeenCalled();
});

test('late GPU attachment after unmount detaches and late errors stay silent', async () => {
  await render();
  const first = settle;
  await act(async () => root!.unmount());
  root = undefined;
  expect(detach).toHaveBeenCalledWith(1);
  expect(disconnect).toHaveBeenCalledTimes(1);
  first.resolve();
  await Promise.resolve();
  expect(detach).toHaveBeenCalledTimes(2);
  await render(2);
  const second = settle;
  await act(async () => root!.unmount());
  root = undefined;
  second.reject(new Error('late error'));
  await Promise.resolve();
  await Promise.resolve();
  expect(errors).not.toHaveBeenCalled();
});

test('attachment errors normalize values and reach the current callback', async () => {
  await render();
  const next = mock((_error: Error) => {});
  await render(1, next);
  settle.reject('no GPU');
  await Promise.resolve();
  await Promise.resolve();
  expect(next).toHaveBeenCalledWith(new Error('no GPU'));
  expect(errors).not.toHaveBeenCalled();
});

test('blur and hidden documents cancel input, visibility updates active hook and unsubscribes', async () => {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false
  });
  await render();
  window.dispatchEvent(new Event('blur'));
  document.dispatchEvent(new Event('visibilitychange'));
  expect(cancel).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true
  });
  document.dispatchEvent(new Event('visibilitychange'));
  expect(cancel).toHaveBeenCalledTimes(2);
  const values: boolean[] = [];
  function Active() {
    values.push(useActive());
    return null;
  }
  await act(async () => root!.render(<Active />));
  expect(values.at(-1)).toBe(false);
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false
  });
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  expect(values.at(-1)).toBe(true);
  expect(pixelRatio()).toBe(window.devicePixelRatio);
  const count = values.length;
  await act(async () => root!.unmount());
  root = undefined;
  document.dispatchEvent(new Event('visibilitychange'));
  expect(values).toHaveLength(count);
});
