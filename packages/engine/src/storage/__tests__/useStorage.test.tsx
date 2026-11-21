import { act } from 'react';
import { afterAll, afterEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import * as web from '../storageBackend.web';
import type { Storage } from '../store';
import type { StorageSetter } from '../useStorage';

const dom = installDom();
mock.module('../storageBackend', () => web);
const { createStorage } = await import('../store');
const { useStorage } = await import('../useStorage');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
let root: ReturnType<typeof createRoot> | undefined;
let container = document.createElement('div');
const setters = new Map<string, StorageSetter<number>>();
let renders = 0;
function Counter({ label, storage, name = 'count' }: { label: string; storage?: Storage; name?: string }) {
  const [value, set] = useStorage(name, 0, storage);
  setters.set(label, set);
  renders++;
  return <span>{value}</span>;
}
async function render(node: React.ReactNode) {
  root ??= createRoot(container);
  await act(async () => root!.render(node));
}
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container = document.createElement('div');
  setters.clear();
  window.localStorage.clear();
  renders = 0;
});
afterAll(() => dom.cleanup());

test('two hooks share writes across instances, functional setters read the current value, and removal restores defaults', async () => {
  const a = createStorage({ id: 'shared' }),
    b = createStorage({ id: 'shared' });
  await render(
    <>
      <Counter label="a" storage={a} />
      <Counter label="b" storage={b} />
    </>
  );
  expect(container.textContent).toBe('00');
  await act(async () => setters.get('a')!(1));
  expect(container.textContent).toBe('11');
  await act(async () => {
    b.set('count', 7);
    setters.get('a')!((value) => value + 1);
  });
  expect(container.textContent).toBe('88');
  await act(async () => setters.get('b')!(undefined));
  expect(container.textContent).toBe('00');
  await act(async () => a.set('count', 3));
  await act(async () => b.clearAll());
  expect(container.textContent).toBe('00');
  expect(a.getNumber('count')).toBeUndefined();
});
test('changing the key or namespace resubscribes and unrelated writes do not rerender', async () => {
  const a = createStorage({ id: 'a' }),
    b = createStorage({ id: 'b' });
  await render(<Counter label="value" storage={a} />);
  const count = renders;
  await act(async () => {
    a.set('unrelated', 5);
    b.set('count', 8);
  });
  expect(renders).toBe(count);
  await render(<Counter label="value" storage={b} />);
  expect(container.textContent).toBe('8');
  await act(async () => a.set('count', 2));
  expect(container.textContent).toBe('8');
  await render(<Counter label="value" storage={b} name="other" />);
  expect(container.textContent).toBe('0');
  await act(async () => b.set('other', 4));
  expect(container.textContent).toBe('4');
});
test('string and boolean defaults widen setter types, and SSR needs no browser storage', async () => {
  const storage = createStorage({ id: 'typed' });
  let setText: StorageSetter<string> = () => {};
  let setFlag: StorageSetter<boolean> = () => {};
  function Fields() {
    const [text, textSetter] = useStorage('text', '', storage);
    const [flag, flagSetter] = useStorage('flag', true, storage);
    setText = textSetter;
    setFlag = flagSetter;
    return (
      <span>
        {text}:{String(flag)}
      </span>
    );
  }
  await render(<Fields />);
  await act(async () => {
    setText('hello');
    setFlag(false);
  });
  expect(container.textContent).toBe('hello:false');
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')!;
  Reflect.deleteProperty(globalThis, 'window');
  try {
    expect(renderToString(<Counter label="server" />)).toContain('0');
  } finally {
    Object.defineProperty(globalThis, 'window', descriptor);
  }
});
test('other-tab writes and localStorage clearing refresh hooks; subscriptions clean up', async () => {
  const storage = createStorage({ id: 'tabs' });
  await render(<Counter label="tabs" storage={storage} />);
  const key = 'nayan-engine-store-v1:tabs';
  const emit = (key: string | null, oldValue: string | null, newValue: string | null) => {
    const event = new dom.window.Event('storage');
    Object.defineProperties(event, {
      key: { value: key },
      storageArea: { value: window.localStorage },
      oldValue: { value: oldValue },
      newValue: { value: newValue }
    });
    dom.window.dispatchEvent(event);
  };
  // Bypass same-runtime notifications to simulate a write made in another browser tab.
  web.openBackend('tabs').write('count', 9);
  const next = window.localStorage.getItem(key)!;
  await act(async () => emit(key, null, next));
  expect(container.textContent).toBe('9');
  window.localStorage.clear();
  await act(async () => emit(null, null, null));
  expect(container.textContent).toBe('0');
  const changed = mock(() => {}),
    stop = storage.subscribe(changed);
  stop();
  stop();
  const live = storage.subscribe(changed);
  storage.set('x', 1);
  expect(changed).toHaveBeenCalledTimes(1);
  live();
});

test('JSON hooks keep stable snapshots and functional updates see writes from other instances', async () => {
  const { useStorageJSON } = await import('../useStorage');
  const a = createStorage({ id: 'json' }),
    b = createStorage({ id: 'json' });
  let set!: StorageSetter<{ count: number }>;
  function Profile() {
    const [value, update] = useStorageJSON('profile', { count: 0 }, a);
    set = update;
    return <span>{value.count}</span>;
  }
  await render(<Profile />);
  expect(container.textContent).toBe('0');
  await act(async () => {
    b.setJSON('profile', { count: 10 });
    set((value) => ({ count: value.count + 1 }));
  });
  expect(container.textContent).toBe('11');
  await act(async () => set(undefined));
  expect(container.textContent).toBe('0');
  expect(renderToString(<Profile />)).toContain('0');
});
