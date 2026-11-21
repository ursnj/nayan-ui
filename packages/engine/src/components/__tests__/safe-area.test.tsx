import { act, memo, type PropsWithChildren } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { SafeAreaMetrics } from '../safeAreaContext';

const initial: SafeAreaMetrics = { insets: { top: 62, right: 0, bottom: 34, left: 0 }, frame: { x: 0, y: 0, width: 402, height: 874 } };
const events = new Map<string, (event: { nativeEvent: SafeAreaMetrics | { metrics: string } }) => void>();
const flatten = (value: unknown): Record<string, unknown> =>
  Array.isArray(value) ? Object.assign({}, ...value.map(flatten)) : value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
const resolve = mock((_command: string) => JSON.stringify({ ok: true, value: { top: 70, right: 8, bottom: 34, left: 8 } }));
mock.module('../../native/NativeNayanEngine', () => ({ default: { safeAreaRequest: resolve } }));
mock.module('react-native', () => ({
  requireNativeComponent:
    () =>
    ({
      children,
      testID = 'root',
      onMetricsChange
    }: PropsWithChildren<{ testID?: string; onMetricsChange: (event: { nativeEvent: SafeAreaMetrics | { metrics: string } }) => void }>) => {
      events.set(testID.replace(/-metrics$/, ''), onMetricsChange);
      return <div>{children}</div>;
    },
  UIManager: { getViewManagerConfig: () => ({ Constants: { initialWindowMetrics: initial } }) },
  StyleSheet: { flatten },
  View: ({ children, style, testID }: PropsWithChildren<{ style?: unknown; testID?: string }>) => (
    <div data-testid={testID} style={flatten(style)}>
      {children}
    </div>
  )
}));
const { NSafeAreaProvider, NSafeArea, NSafeAreaListener, useNSafeAreaInsets, useNSafeAreaFrame } = await import('../NSafeArea');
const compatibility = await import('../safeAreaCompat');
const dom = installDom();
const { createRoot } = await import('react-dom/client');
afterAll(() => dom.cleanup());

let readings: SafeAreaMetrics;
let insetRenders = 0;
const Insets = memo(function Insets() {
  insetRenders++;
  const insets = useNSafeAreaInsets();
  return (
    <span>
      {insets.top}:{insets.bottom}
    </span>
  );
});
function Frame() {
  readings = { insets: useNSafeAreaInsets(), frame: useNSafeAreaFrame() };
  return null;
}

test('hooks start with native metrics, deduplicate updates, and keep inset consumers stable during frame-only changes', async () => {
  const node = document.createElement('div'),
    root = createRoot(node);
  insetRenders = 0;
  try {
    await act(() =>
      root.render(
        <NSafeAreaProvider>
          <Insets />
          <Frame />
        </NSafeAreaProvider>
      )
    );
    expect(node.textContent).toBe('62:34');
    expect(readings!).toEqual(initial);
    const before = insetRenders;
    await act(() => events.get('root')!({ nativeEvent: structuredClone(initial) }));
    expect(insetRenders).toBe(before);
    await act(() => events.get('root')!({ nativeEvent: { ...initial, frame: { ...initial.frame, width: 500 } } }));
    expect(readings!.frame.width).toBe(500);
    expect(insetRenders).toBe(before);
    const rotated = { insets: { top: 0, bottom: 21, left: 62, right: 62 }, frame: { x: 0, y: 0, width: 874, height: 402 } };
    await act(() => events.get('root')!({ nativeEvent: { metrics: JSON.stringify({ ok: true, value: rotated }) } }));
    expect(readings!).toEqual(rotated);
    expect(node.textContent).toBe('0:21');
  } finally {
    await act(() => root.unmount());
  }
});

test('navigation compatibility uses the same provider/contexts and native spacing is resolved by Rust', async () => {
  const node = document.createElement('div'),
    root = createRoot(node);
  resolve.mockClear();
  function Navigation() {
    const insets = compatibility.useSafeAreaInsets();
    return <span>{insets.top}</span>;
  }
  try {
    await act(() =>
      root.render(
        <NSafeAreaProvider>
          <Navigation />
          <NSafeArea testID="safe" edges={{ top: 'additive', bottom: 'maximum' }} style={{ padding: 8, paddingBottom: 12 }}>
            <span>Content</span>
          </NSafeArea>
        </NSafeAreaProvider>
      )
    );
    expect(node.textContent).toBe('62Content');
    expect(compatibility.SafeAreaProvider).toBe(NSafeAreaProvider);
    expect(compatibility.SafeAreaView).toBe(NSafeArea);
    expect(JSON.parse(resolve.mock.calls[0]![0]!)).toEqual({
      action: 'resolve',
      insets: initial.insets,
      edges: { top: 'additive', bottom: 'maximum' },
      base: { top: 8, right: 8, bottom: 12, left: 8 }
    });
    const view = node.querySelector<HTMLElement>('[data-testid="safe"]')!;
    expect(view.style.paddingTop).toBe('70px');
    expect(view.style.paddingBottom).toBe('34px');
  } finally {
    await act(() => root.unmount());
  }
});

test('nested providers isolate geometry and listeners deliver native metrics', async () => {
  const node = document.createElement('div'),
    root = createRoot(node);
  const changed = mock((_value: SafeAreaMetrics) => {});
  function Read({ name }: { name: string }) {
    return (
      <span>
        {name}:{useNSafeAreaInsets().top};
      </span>
    );
  }
  try {
    await act(() =>
      root.render(
        <NSafeAreaProvider>
          <Read name="outer" />
          <NSafeAreaProvider testID="inner">
            <Read name="inner" />
          </NSafeAreaProvider>
          <NSafeAreaListener testID="listener" onChange={changed} />
        </NSafeAreaProvider>
      )
    );
    await act(() => events.get('inner')!({ nativeEvent: { ...initial, insets: { ...initial.insets, top: 0 } } }));
    expect(node.textContent).toBe('outer:62;inner:0;');
    await act(() => events.get('listener')!({ nativeEvent: initial }));
    expect(changed).toHaveBeenCalledWith(initial);
  } finally {
    await act(() => root.unmount());
  }
});
