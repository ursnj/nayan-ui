import { act, useEffect } from 'react';
import { afterAll, expect, test } from 'bun:test';
import { installReactTestEnvironment } from '../../src/__tests__/dom';

const dom = await installReactTestEnvironment();
const { hydrateRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
// Resolve the published browser entry, including its real platform color-scheme adapter.
const { NText, NTheme, useNTheme } = await import('nayan-ui/components');
afterAll(() => dom.cleanup());

test('NTheme reserves a browser viewport and renders one semantic fallback across nested scopes', () => {
  const markup = renderToString(
    <NTheme surface={{ serverFallback: true }} safeArea={false} toasts={false}>
      <NTheme theme="dark">
        <NText tag="h1">A themed screen</NText>
      </NTheme>
    </NTheme>
  );
  expect(markup).toContain('height:100dvh');
  expect(markup).toContain('>A themed screen</h1>');
  expect(markup.match(/data-engine-fallback/g)).toHaveLength(1);
});

test('the published browser theme hydrates consistently, follows system changes and exposes the same controls', async () => {
  let scheme: 'light' | 'dark' = 'dark';
  const listeners = new Set<() => void>();
  const original = window.matchMedia;
  window.matchMedia = (() => ({
    get matches() {
      return scheme === 'dark';
    },
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener)
  })) as unknown as typeof window.matchMedia;
  let state: ReturnType<typeof useNTheme>;
  let mounts = 0;
  function Controls() {
    state = useNTheme();
    useEffect(() => {
      mounts++;
    }, []);
    return <span data-theme={state.resolvedTheme}>{state.theme}</span>;
  }
  const app = (
    <NTheme surface={false} safeArea={false} toasts={false}>
      <Controls />
    </NTheme>
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(app);
  expect(container.querySelector('span')?.getAttribute('data-theme')).toBe('light');
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(() => {
      root = hydrateRoot(container, app, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(state!.theme).toBe('system');
    expect(state!.resolvedTheme).toBe('dark');
    await act(() => state!.setTheme('light'));
    expect(state!.resolvedTheme).toBe('light');
    await act(() => state!.setTheme('system'));
    expect(state!.isDarkMode).toBe(true);
    scheme = 'light';
    await act(() => {
      for (const listener of listeners) listener();
    });
    expect(state!.resolvedTheme).toBe('light');
    await act(() => state!.toggleTheme());
    expect(state!.theme).toBe('dark');
    expect(mounts).toBe(1);
    expect(errors).toEqual([]);
  } finally {
    await act(() => root?.unmount());
    expect(listeners.size).toBe(0);
    window.matchMedia = original;
  }
});
