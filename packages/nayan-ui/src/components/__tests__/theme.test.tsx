import { act, createContext, type PropsWithChildren, useContext, useEffect, useSyncExternalStore } from 'react';
import { afterAll, afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from '../safeAreaContext';
import { ComponentThemeContext, type ComponentThemeValue } from '../ThemeContext';
import { useToastHostOwnership } from '../ThemeServices';
import { toastSnapshot } from '../toastSnapshot';
import { type NThemeState, useNTheme } from '../useNTheme';

let scheme: 'light' | 'dark' = 'light';
let measurements = 0;
let contentMounts = 0;
let value: ComponentThemeValue | null = null;
const metrics = { top: 48, right: 0, bottom: 34, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };
mock.module('../themeSystemBars', () => ({ useThemeSystemBars() {} }));
mock.module('../NPage', () => ({ NPage: () => { throw Error('A provider-only theme mounted a screen'); } }));
mock.module('../PlatformHost', () => ({
  usePlatformColorScheme: () => scheme
}));
mock.module('../NSafeArea', () => ({
  NSafeAreaProvider: ({ children }: PropsWithChildren) => {
    useEffect(() => {
      measurements++;
    }, []);
    return (
      <SafeAreaInsetsContext.Provider value={metrics}>
        <SafeAreaFrameContext.Provider value={frame}>{children}</SafeAreaFrameContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );
  }
}));
mock.module('../NToastHost', () => ({
  NToastHost: ({ maxWidth }: { maxWidth?: number }) => {
    useToastHostOwnership();
    const { toast } = useSyncExternalStore(toastSnapshot.subscribe, toastSnapshot.getSnapshot, toastSnapshot.getServerSnapshot);
    return toast ? (
      <span data-toast data-width={maxWidth}>
        {toast.message}
      </span>
    ) : null;
  }
}));
const { NTheme } = await import('../NTheme');
const { NToastHost } = await import('../NToastHost');
const dom = await installReactTestEnvironment();
let root: ReturnType<typeof dom.createRoot> | undefined;
let container: HTMLDivElement;
function Content() {
  value = useContext(ComponentThemeContext);
  useEffect(() => {
    contentMounts++;
  }, []);
  return <span>Application</span>;
}
const flush = () =>
  act(async () => {
    await Bun.sleep(15);
  });
beforeEach(() => {
  measurements = contentMounts = 0;
  scheme = 'light';
  value = null;
  toastSnapshot.publish({ toast: null, ids: [], wakeAfter: null });
  container = document.createElement('div');
  root = dom.createRoot(container);
});
afterEach(async () => {
  await act(() => root?.unmount());
  root = undefined;
});
afterAll(() => dom.cleanup());

test('one root theme owns measurements and presentation insets; nested themes and scheme changes retain application state', async () => {
  const render = () => (
    <NTheme surface={false} theme="system">
      <NTheme surface={false}>
        <Content />
      </NTheme>
    </NTheme>
  );
  await act(() => root!.render(render()));
  expect(measurements).toBe(1);
  expect(value?.presentationInsets).toEqual({ top: 48, bottom: 34 });
  expect(value?.resolvedTheme).toBe('light');
  expect(container.querySelector('[data-toast]')).toBeNull();
  scheme = 'dark';
  await act(() => root!.render(render()));
  expect(value?.resolvedTheme).toBe('dark');
  expect(contentMounts).toBe(1);
  expect(measurements).toBe(1);
});

test('an existing framework provider is reused and explicit presentation settings remain authoritative', async () => {
  await act(() =>
    root!.render(
      <SafeAreaInsetsContext.Provider value={metrics}>
        <SafeAreaFrameContext.Provider value={frame}>
          <NTheme surface={false} presentationInsets={{ bottom: 12 }}>
            <Content />
          </NTheme>
        </SafeAreaFrameContext.Provider>
      </SafeAreaInsetsContext.Provider>
    )
  );
  expect(measurements).toBe(0);
  expect(value?.presentationInsets).toEqual({ bottom: 12 });
});

test('nested palettes, component defaults and registered contexts inherit without dropping parent configuration', async () => {
  const session = createContext('guest'),
    locale = createContext('en');
  await act(() =>
    root!.render(
      <NTheme surface={false}
        colors={{ foreground: '#111111', accent: '#222222' }}
        themes={{ dark: { foreground: '#eeeeee', accent: '#333333' } }}
        contexts={[session]}
        components={{ NText: { className: 'text-sm', style: { opacity: 0.8 } }, NCard: { className: 'rounded-xl' } }}>
        <NTheme surface={false} colors={{ accent: '#abcdef' }} contexts={[locale, session]} components={{ NText: { className: 'font-bold' } }}>
          <Content />
        </NTheme>
      </NTheme>
    )
  );
  expect(value?.colors).toMatchObject({ foreground: '#111111', accent: '#abcdef' });
  expect(value?.themes?.dark).toMatchObject({ foreground: '#eeeeee', accent: '#abcdef' });
  expect(value?.components?.NText).toEqual({ className: 'text-sm font-bold', style: { opacity: 0.8 } });
  expect(value?.components?.NCard?.className).toBe('rounded-xl');
  expect(value?.contexts).toEqual([session, locale]);
});

test('toasts are mounted lazily once per root theme and the root options configure their host', async () => {
  await act(() =>
    root!.render(
      <NTheme surface={false} toasts={{ maxWidth: 360 }}>
        <NTheme surface={false}>
          <Content />
        </NTheme>
      </NTheme>
    )
  );
  expect(container.querySelectorAll('[data-toast]')).toHaveLength(0);
  await act(() => toastSnapshot.publish({ toast: { id: 1, message: 'Saved' }, ids: [1], wakeAfter: null }));
  await flush();
  expect(container.querySelectorAll('[data-toast]')).toHaveLength(1);
  expect(container.querySelector('[data-toast]')?.getAttribute('data-width')).toBe('360');
});

test('legacy explicit hosts suppress the automatic outlet and advanced setup can opt out', async () => {
  await act(() =>
    root!.render(
      <NTheme surface={false}>
        <Content />
        <NToastHost maxWidth={320} />
      </NTheme>
    )
  );
  await act(() => toastSnapshot.publish({ toast: { id: 2, message: 'Manual' }, ids: [2], wakeAfter: null }));
  await flush();
  expect(container.querySelectorAll('[data-toast]')).toHaveLength(1);
  expect(container.querySelector('[data-toast]')?.getAttribute('data-width')).toBe('320');
  await act(() =>
    root!.render(
      <NTheme surface={false} safeArea={false} toasts={false}>
        <Content />
      </NTheme>
    )
  );
  await flush();
  expect(container.querySelectorAll('[data-toast]')).toHaveLength(0);
});

test('useNTheme manages an uncontrolled preference, follows system changes and retains its mounted content', async () => {
  let state: NThemeState;
  function Controls() {
    state = useNTheme();
    return <Content />;
  }
  const changed = mock((_theme: string) => {});
  const render = () => (
    <NTheme surface={false} onThemeChange={changed} themes={{ light: { background: '#eeeeee' }, dark: { background: '#111111' } }}>
      <Controls />
    </NTheme>
  );
  await act(() => root!.render(render()));
  expect(state!.theme).toBe('system');
  expect(state!.resolvedTheme).toBe('light');
  const set = state!.setTheme;
  await act(() => state!.setTheme('dark'));
  expect(state!.isDarkMode).toBe(true);
  expect(state!.colors.background).toBe('#111111');
  await act(() => state!.toggleTheme());
  expect(state!.theme).toBe('light');
  expect(state!.colors.background).toBe('#eeeeee');
  await act(() => {
    state!.toggleTheme();
    state!.toggleTheme();
  });
  expect(state!.theme).toBe('light');
  await act(() => state!.setTheme('system'));
  scheme = 'dark';
  await act(() => root!.render(render()));
  expect(state!.theme).toBe('system');
  expect(state!.systemTheme).toBe('dark');
  expect(state!.resolvedTheme).toBe('dark');
  expect(state!.setTheme).toBe(set);
  expect(changed.mock.calls.map((call) => call[0])).toEqual(['dark', 'light', 'dark', 'light', 'system']);
  expect(contentMounts).toBe(1);
});

test('controlled themes notify their owner and change only when new props arrive', async () => {
  let state: NThemeState;
  function Controls() {
    state = useNTheme();
    return null;
  }
  const changed = mock((_theme: string) => {});
  const render = (theme: 'light' | 'dark') => (
    <NTheme surface={false} theme={theme} onThemeChange={changed}>
      <Controls />
    </NTheme>
  );
  await act(() => root!.render(render('light')));
  await act(() => state!.setTheme('dark'));
  expect(changed).toHaveBeenCalledWith('dark');
  expect(state!.theme).toBe('light');
  await act(() => root!.render(render('dark')));
  expect(state!.isDarkMode).toBe(true);
});

test('palette-only nested scopes update their owner while explicit scopes and separate roots stay independent', async () => {
  const states: Record<string, NThemeState> = {};
  function Controls({ id }: { id: string }) {
    states[id] = useNTheme();
    return null;
  }
  await act(() =>
    root!.render(
      <>
        <NTheme surface={false} defaultTheme="light">
          <Controls id="root" />
          <NTheme surface={false} colors={{ accent: '#abcdef' }}>
            <Controls id="nested" />
          </NTheme>
          <NTheme surface={false} defaultTheme="dark">
            <Controls id="isolated" />
          </NTheme>
        </NTheme>
        <NTheme surface={false} defaultTheme="light">
          <Controls id="other" />
        </NTheme>
      </>
    )
  );
  await act(() => states.nested!.toggleTheme());
  expect(states.root!.theme).toBe('dark');
  expect(states.nested!.theme).toBe('dark');
  expect(states.nested!.colors.accent).toBe('#abcdef');
  expect(states.other!.theme).toBe('light');
  await act(() => {
    states.nested!.toggleTheme();
    states.nested!.toggleTheme();
  });
  expect(states.root!.theme).toBe('dark');
  await act(() => states.isolated!.toggleTheme());
  expect(states.isolated!.theme).toBe('light');
  expect(states.root!.theme).toBe('dark');
});

test('useNTheme reports a missing provider', async () => {
  const { renderToString } = await import('react-dom/server');
  function Controls() {
    useNTheme();
    return null;
  }
  expect(() => renderToString(<Controls />)).toThrow('useNTheme requires an NTheme');
});

function preferenceStorage(initial?: string) {
  const values = new Map<string, string>(initial === undefined ? [] : [['appearance', initial]]);
  const listeners = new Set<(key: string) => void>();
  const storage = {
    getString: (key: string) => values.get(key),
    set: (key: string, value: unknown) => {
      values.set(key, String(value));
      for (const listener of listeners) listener(key);
    },
    subscribe: (listener: (key: string) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
  return { values, listeners, storage };
}

test('persisted preferences restore on first client render, track external writes and survive remounts', async () => {
  const { storage, values, listeners } = preferenceStorage('"dark"');
  let state: NThemeState;
  function Controls() {
    state = useNTheme();
    return <Content />;
  }
  const render = () => (
    <NTheme surface={false} persistence={{ storage, key: 'appearance', encoding: 'json' }}>
      <Controls />
    </NTheme>
  );
  await act(() => root!.render(render()));
  expect(state!.theme).toBe('dark');
  await act(() => state!.toggleTheme());
  expect(values.get('appearance')).toBe('"light"');
  await act(() => storage.set('appearance', '"system"'));
  expect(state!.theme).toBe('system');
  scheme = 'dark';
  await act(() => root!.render(render()));
  expect(state!.resolvedTheme).toBe('dark');
  expect(contentMounts).toBe(1);
  await act(() => {
    state!.toggleTheme();
    state!.toggleTheme();
  });
  expect(values.get('appearance')).toBe('"dark"');
  await act(() => root!.render(null));
  expect(listeners.size).toBe(0);
  await act(() => root!.render(render()));
  expect(state!.theme).toBe('dark');
});

test('invalid preferences recover to the default and namespaces, subscriptions and controlled state stay independent', async () => {
  const { storage, values, listeners } = preferenceStorage('{broken');
  const states: Record<string, NThemeState> = {};
  const changed = mock((_theme: string) => {});
  function Controls({ id }: { id: string }) {
    states[id] = useNTheme();
    return null;
  }
  const render = (key = 'appearance') => (
    <>
      <NTheme surface={false} defaultTheme="dark" persistence={{ storage, key, encoding: 'json' }}>
        <Controls id="one" />
      </NTheme>
      <NTheme surface={false} persistence={{ storage, key: 'other' }}>
        <Controls id="other" />
      </NTheme>
      <NTheme surface={false} theme="light" persistence={{ storage, key: 'controlled' }} onThemeChange={changed}>
        <Controls id="controlled" />
      </NTheme>
    </>
  );
  await act(() => root!.render(render()));
  expect(states.one!.theme).toBe('dark');
  expect(states.other!.theme).toBe('system');
  await act(() => states.one!.setTheme('invalid' as 'dark'));
  expect(values.get('appearance')).toBe('{broken');
  await act(() => states.one!.setTheme('light'));
  expect(values.get('appearance')).toBe('"light"');
  expect(states.other!.theme).toBe('system');
  await act(() => states.controlled!.setTheme('dark'));
  expect(states.controlled!.theme).toBe('light');
  expect(changed).toHaveBeenCalledWith('dark');
  expect(values.get('controlled')).toBe('dark');
  await act(() => root!.render(render('replacement')));
  expect(states.one!.theme).toBe('dark');
  expect(listeners.size).toBe(3);
  await act(() => root!.render(null));
  expect(listeners.size).toBe(0);
});

test('SSR uses the deterministic default without accessing client storage', async () => {
  const { renderToString } = await import('react-dom/server');
  const read = mock(() => {
    throw Error('client-only storage');
  });
  const storage = { getString: read, set() {}, subscribe: () => () => {} };
  function Controls() {
    return <span>{useNTheme().theme}</span>;
  }
  expect(
    renderToString(
      <NTheme surface={false} defaultTheme="light" persistence={{ storage }}>
        <Controls />
      </NTheme>
    )
  ).toContain('light');
  expect(read).not.toHaveBeenCalled();
});

test('custom palettes feed camelCase hook tokens, semantic renderer colors and appearance-dependent defaults', async () => {
  let state: NThemeState;
  function Controls() {
    state = useNTheme();
    return <Content />;
  }
  await act(() =>
    root!.render(
      <NTheme surface={false}
        defaultTheme="light"
        palettes={{
          light: { accent: '#123456', accentForeground: '#ffffff', surface: '#111111', patternOpacity: 0.4 },
          dark: { accent: '#abcdef', surface: '#222222', patternOpacity: 0.2 }
        }}
        colors={{ surface: '#998877' }}
        components={({ isDarkMode, palette }) => ({ NCard: { style: { opacity: isDarkMode ? 0.5 : 1, color: palette.accent as string } } })}>
        <NTheme surface={false} colors={{ 'accent-foreground': '#eeeeee' }}>
          <Controls />
        </NTheme>
      </NTheme>
    )
  );
  expect(state!.colors['accent-foreground']).toBe('#eeeeee');
  expect(state!.palette.accentForeground).toBe('#eeeeee');
  expect(state!.palette.patternOpacity).toBe(0.4);
  expect(state!.palette.surface).toBe('#998877');
  expect(value?.components?.NCard?.style).toMatchObject({ opacity: 1, color: '#123456' });
  await act(() => state!.toggleTheme());
  expect(state!.colors.accent).toBe('#abcdef');
  expect(state!.palette.patternOpacity).toBe(0.2);
  expect(state!.colors.surface).toBe('#998877');
  expect(state!.palette.accentForeground).toBe('#eeeeee');
  expect(value?.components?.NCard?.style).toMatchObject({ opacity: 0.5, color: '#abcdef' });
});
