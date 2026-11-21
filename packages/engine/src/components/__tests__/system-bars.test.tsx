import { act } from 'react';
import { afterAll, afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { SystemBarsNavigation } from '../systemBarTypes';

let scheme = 'light';
const foreground = new Set<(state: string) => void>();
const systemThemeSet = mock((_id: string, _configuration: string) => {});
const engine = {
  systemBarsSet: mock((_id: string, _configuration: string) => {}),
  systemBarsRemove: mock((_id: string) => {}),
  systemThemeSet: undefined as typeof systemThemeSet | undefined
};
mock.module('react-native', () => ({
  useColorScheme: () => scheme,
  AppState: {
    addEventListener: (_type: string, listener: (state: string) => void) => {
      foreground.add(listener);
      return { remove: () => foreground.delete(listener) };
    }
  }
}));
mock.module('../../native/NativeNayanEngine', () => ({ default: engine }));
mock.module('../NSafeArea', () => ({ NSafeAreaProvider: ({ children }: import('react').PropsWithChildren) => children }));
const { NTheme } = await import('../NTheme');
const { ComponentRenderContext } = await import('../ThemeContext');
const dom = installDom();
const { createRoot } = await import('react-dom/client');
let root: ReturnType<typeof createRoot> | undefined;
let container = document.createElement('div');
async function render(children: React.ReactNode) {
  root ??= createRoot(container);
  await act(async () => root!.render(children));
}
beforeEach(() => {
  scheme = 'light';
  engine.systemBarsSet.mockClear();
  engine.systemBarsRemove.mockClear();
  engine.systemThemeSet = undefined;
  systemThemeSet.mockClear();
});
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container = document.createElement('div');
  expect(foreground.size).toBe(0);
});
afterAll(() => dom.cleanup());

test('root NTheme registers a stable Rust scope; palette-only nested themes do not override system bars', async () => {
  await render(
    <NTheme theme="dark">
      <NTheme theme="light">
        <span>UI</span>
      </NTheme>
    </NTheme>
  );
  expect(engine.systemBarsSet).toHaveBeenCalledTimes(1);
  const [id, configuration] = engine.systemBarsSet.mock.calls[0]!;
  expect(JSON.parse(configuration)).toEqual({ depth: 0, theme: 'dark', options: {}, systemDark: false });
  await render(
    <NTheme theme="light">
      <NTheme theme="dark">
        <span>UI</span>
      </NTheme>
    </NTheme>
  );
  expect(engine.systemBarsSet.mock.calls.at(-1)![0]).toBe(id);
  expect(JSON.parse(engine.systemBarsSet.mock.calls.at(-1)![1]).theme).toBe('light');
  expect(engine.systemBarsRemove).not.toHaveBeenCalled();
});

test('focused screen scopes release immediately on blur without a React rerender, then recover with the latest configuration', async () => {
  const listeners = { focus: new Set<() => void>(), blur: new Set<() => void>() };
  let focused = false;
  const navigation: SystemBarsNavigation = {
    isFocused: () => focused,
    addListener: (event, listener) => {
      listeners[event].add(listener);
      return () => {
        listeners[event].delete(listener);
      };
    }
  };
  const Screen = ({ theme }: { theme: 'light' | 'dark' }) => (
    <NTheme theme="light">
      <NTheme systemBars={{ theme, navigationBarHidden: true }} navigation={navigation}>
        <span>Game</span>
      </NTheme>
    </NTheme>
  );
  await render(<Screen theme="dark" />);
  expect(engine.systemBarsSet.mock.calls.some(([, config]) => JSON.parse(config).depth === 1)).toBe(false);
  focused = true;
  for (const listener of listeners.focus) listener();
  const gameCall = engine.systemBarsSet.mock.calls.find(([, config]) => JSON.parse(config).depth === 1)!;
  const gameId = gameCall[0];
  focused = false;
  // React Navigation can freeze the subtree immediately after this event.
  for (const listener of listeners.blur) listener();
  expect(engine.systemBarsRemove).toHaveBeenCalledWith(gameId);
  const updates = engine.systemBarsSet.mock.calls.length;
  await render(<Screen theme="light" />);
  expect(engine.systemBarsSet.mock.calls.length).toBe(updates);
  focused = true;
  for (const listener of listeners.focus) listener();
  const latest = engine.systemBarsSet.mock.calls.at(-1)!;
  expect(latest[0]).toBe(gameId);
  expect(JSON.parse(latest[1]).options.theme).toBe('light');
  await act(async () => root!.unmount());
  root = undefined;
  expect(listeners.focus.size + listeners.blur.size).toBe(0);
});

test('system appearance and foreground return update the existing scope; opting out releases it', async () => {
  await render(
    <NTheme theme="system">
      <span>UI</span>
    </NTheme>
  );
  const id = engine.systemBarsSet.mock.calls[0]![0];
  scheme = 'dark';
  await render(
    <NTheme theme="system">
      <span>UI</span>
    </NTheme>
  );
  expect(JSON.parse(engine.systemBarsSet.mock.calls.at(-1)![1]).systemDark).toBe(true);
  const count = engine.systemBarsSet.mock.calls.length;
  for (const changed of foreground) changed('active');
  expect(engine.systemBarsSet).toHaveBeenCalledTimes(count + 1);
  expect(engine.systemBarsSet.mock.calls.at(-1)![0]).toBe(id);
  await render(
    <NTheme theme="dark" systemBars={false}>
      <span>UI</span>
    </NTheme>
  );
  expect(engine.systemBarsRemove).toHaveBeenCalledWith(id);
});

test('serialized Rust-renderer themes never create a second native system-bar owner', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    await render(
      <ComponentRenderContext.Provider value={true}>
        <NTheme theme="dark" systemBars>
          <span>UI</span>
        </NTheme>
      </ComponentRenderContext.Provider>
    );
  } finally {
    console.error = original;
  }
  expect(engine.systemBarsSet).not.toHaveBeenCalled();
});

test('current native builds receive palette variants for window backgrounds without replacing the Rust scope', async () => {
  engine.systemThemeSet = systemThemeSet;
  await render(
    <NTheme theme="system" colors={{ background: '#123456' }} themes={{ dark: { background: '#654321' } }}>
      <span>UI</span>
    </NTheme>
  );
  expect(engine.systemBarsSet).not.toHaveBeenCalled();
  const [id, configuration] = systemThemeSet.mock.calls[0]!;
  expect(JSON.parse(configuration)).toMatchObject({ colors: { background: '#123456' }, themes: { dark: { background: '#654321' } } });
  await render(
    <NTheme theme="system" colors={{ background: '#abcdef' }}>
      <span>UI</span>
    </NTheme>
  );
  expect(systemThemeSet.mock.calls.at(-1)![0]).toBe(id);
  expect(JSON.parse(systemThemeSet.mock.calls.at(-1)![1]).colors.background).toBe('#abcdef');
});

test('older builds retain the original bar schema when a shared app supplies window colors', async () => {
  await render(
    <NTheme theme="dark" colors={{ background: '#123456' }}>
      <span>UI</span>
    </NTheme>
  );
  expect(engine.systemBarsSet).toHaveBeenCalledTimes(1);
  expect(JSON.parse(engine.systemBarsSet.mock.calls[0]![1])).toEqual({ depth: 0, theme: 'dark', options: {}, systemDark: false });
});
