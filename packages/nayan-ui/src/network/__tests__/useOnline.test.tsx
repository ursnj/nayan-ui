import { act } from 'react';
import { afterAll, afterEach, expect, mock, spyOn, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import * as web from '../networkPlatform.web';

const dom = installDom();
mock.module('../networkPlatform', () => web);
const { network } = await import('../network');
const { useOnline } = await import('../useOnline');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
let root: ReturnType<typeof createRoot> | undefined;
let container = document.createElement('div');
function Status() {
  return <span>{String(useOnline())}</span>;
}
function emit(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
  dom.window.dispatchEvent(new dom.window.Event(online ? 'online' : 'offline'));
}
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container = document.createElement('div');
});
afterAll(() => dom.cleanup());

test('hooks and imperative listeners share live browser transitions; unmount detaches the window listeners', async () => {
  emit(true);
  const add = spyOn(window, 'addEventListener'),
    remove = spyOn(window, 'removeEventListener');
  try {
    root = createRoot(container);
    await act(async () =>
      root!.render(
        <>
          <Status />
          <Status />
        </>
      )
    );
    expect(container.textContent).toBe('truetrue');
    expect(add.mock.calls.filter(([name]) => name === 'online')).toHaveLength(1);
    const changed = mock((_online: boolean | null) => {});
    const stop = network.subscribe(changed);
    await act(async () => emit(false));
    expect(container.textContent).toBe('falsefalse');
    expect(changed.mock.calls).toEqual([[true], [false]]);
    stop();
    await act(async () => root!.unmount());
    root = undefined;
    expect(remove.mock.calls.filter(([name]) => name === 'online')).toHaveLength(1);
    expect(remove.mock.calls.filter(([name]) => name === 'offline')).toHaveLength(1);
  } finally {
    add.mockRestore();
    remove.mockRestore();
  }
});

test('server rendering is unknown and a one-off browser check needs no engine warm-up', async () => {
  expect(renderToString(<Status />)).toContain('null');
  emit(false);
  expect(await network.fetch()).toBe(false);
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')!;
  Reflect.deleteProperty(globalThis, 'window');
  try {
    expect(await network.fetch()).toBeNull();
  } finally {
    Object.defineProperty(globalThis, 'window', descriptor);
  }
});
