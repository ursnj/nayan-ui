import { act } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { installDom } from '../../__tests__/dom';
import type { SafeAreaMetrics } from '../safeAreaContext';

const dom = installDom();
const binding = await import('../../../native/core/build/web/engine_core.js');
const wasm = await binding.default({
  module_or_path: await readFile(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url))
});
mock.module('../../native/wasm.web', () => ({ prepareWasm: async () => wasm }));
const host = await import('../SafeAreaHost.web');
mock.module('../SafeAreaHost', () => host);
const { NSafeArea, NSafeAreaProvider, useNSafeAreaInsets, useNSafeAreaFrame } = await import('../NSafeArea');
const { createRoot } = await import('react-dom/client');
const originalRect = HTMLElement.prototype.getBoundingClientRect;
const originalComputed = globalThis.getComputedStyle;
let top = 47,
  bottom = 34;
let rectangle = { x: 0, y: 0, width: 390, height: 844 };
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    ...rectangle,
    top: rectangle.y,
    left: rectangle.x,
    right: rectangle.x + rectangle.width,
    bottom: rectangle.y + rectangle.height,
    toJSON() {
      return {};
    }
  } as DOMRect;
};
globalThis.getComputedStyle = (() => ({
  paddingTop: `${top}px`,
  paddingBottom: `${bottom}px`,
  paddingLeft: '0px',
  paddingRight: '0px'
})) as unknown as typeof getComputedStyle;
Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 390 });
Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  globalThis.getComputedStyle = originalComputed;
  dom.cleanup();
});
let current: SafeAreaMetrics;
function Content() {
  current = { insets: useNSafeAreaInsets(), frame: useNSafeAreaFrame() };
  return (
    <NSafeArea testID="content" edges={{ top: 'additive', bottom: 'maximum' }} style={{ padding: 12 }}>
      <span>Safe page</span>
    </NSafeArea>
  );
}
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

test('browser CSS environment measurements pass through real Rust and provider movement updates only the remaining insets', async () => {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  const before = document.body.childElementCount;
  try {
    await act(async () => {
      root.render(
        <NSafeAreaProvider>
          <Content />
        </NSafeAreaProvider>
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    await flush();
    expect(current!.insets).toEqual({ top: 47, right: 0, bottom: 34, left: 0 });
    expect(current!.frame).toEqual(rectangle);
    const view = node.querySelector<HTMLElement>('[data-testid="content"]')!;
    expect(view.textContent).toBe('Safe page');
    expect(view.style.paddingTop).toBe('59px');
    expect(view.style.paddingBottom).toBe('34px');
    rectangle = { x: 0, y: 100, width: 390, height: 744 };
    await act(() => window.dispatchEvent(new Event('resize')));
    await flush();
    expect(current!.insets.top).toBe(0);
    expect(current!.insets.bottom).toBe(34);
    top = 0;
    bottom = 21;
    await act(() => window.dispatchEvent(new Event('orientationchange')));
    await flush();
    expect(current!.insets.bottom).toBe(21);
  } finally {
    await act(() => root.unmount());
    expect(document.body.childElementCount).toBe(before);
    node.remove();
  }
});
