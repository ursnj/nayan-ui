import { act, useState } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { installDom } from '../../__tests__/dom';
import type { DrawerHostProps } from '../NDrawer';

const dom = installDom();
const { default: init } = await import('../../../native/core/build/web/engine_core.js');
const wasm = await init({ module_or_path: await readFile(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url)) });
let allocated = 0,
  freed = 0;
const core = {
  ...wasm,
  engine_drawer_new: () => {
    allocated++;
    return wasm.engine_drawer_new();
  },
  engine_drawer_free: (id: number) => {
    freed++;
    wasm.engine_drawer_free(id);
  }
};
mock.module('../../native/wasm.web', () => ({ prepareWasm: async () => core }));
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0,
  clock = 0;
const originalFrame = globalThis.requestAnimationFrame,
  originalCancel = globalThis.cancelAnimationFrame;
globalThis.requestAnimationFrame = (callback) => {
  frames.set(++nextFrame, callback);
  return nextFrame;
};
globalThis.cancelAnimationFrame = (id) => {
  if (typeof id === 'number') frames.delete(id);
};
const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 400 });
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
const captures = new WeakMap<HTMLElement, Set<number>>();
HTMLElement.prototype.setPointerCapture = function (id) {
  const values = captures.get(this) ?? new Set();
  values.add(id);
  captures.set(this, values);
};
HTMLElement.prototype.hasPointerCapture = function (id) {
  return captures.get(this)?.has(id) ?? false;
};
HTMLElement.prototype.releasePointerCapture = function (id) {
  captures.get(this)?.delete(id);
};
const { createRoot } = await import('react-dom/client');
const { DrawerHost } = await import('../DrawerHost.web');
afterAll(() => {
  globalThis.requestAnimationFrame = originalFrame;
  globalThis.cancelAnimationFrame = originalCancel;
  if (width) Object.defineProperty(HTMLElement.prototype, 'clientWidth', width);
  dom.cleanup();
});

function tick() {
  for (let i = 0; i < 60; i++) {
    clock += 16.667;
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(clock);
  }
}
function pointer(target: HTMLElement, type: string, x: number, y: number, id = 1) {
  target.dispatchEvent(
    new window.PointerEvent(type, { bubbles: true, cancelable: true, isPrimary: true, button: 0, pointerId: id, clientX: x, clientY: y })
  );
}
function Harness() {
  const [open, setOpen] = useState(false);
  const props: Omit<DrawerHostProps, 'children'> = {
    open,
    command: 0,
    enabled: true,
    swipeEnabled: true,
    width: 300,
    edgeWidth: 24,
    right: false,
    overlayColor: '#0008',
    accessibilityLabel: 'Menu',
    onChange: setOpen,
    drawerContent: <button onClick={() => setOpen(false)}>Close drawer</button>
  };
  return (
    <DrawerHost {...props}>
      <button id="opener" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <input defaultValue="retained" />
    </DrawerHost>
  );
}
test('real WASM motion opens/closes the browser panel, traps input, restores focus and releases its handle', async () => {
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  const before = freed;
  try {
    await act(async () => root.render(<Harness />));
    const panel = node.querySelector<HTMLElement>('[role="dialog"]')!;
    const opener = node.querySelector<HTMLButtonElement>('#opener')!;
    const input = node.querySelector('input');
    expect(panel.style.visibility).toBe('hidden');
    opener.focus();
    await act(() => opener.click());
    expect(panel.style.transform).not.toBe('translateX(0%)');
    await act(() => tick());
    expect(panel.style.transform).toBe('translateX(0%)');
    expect(panel.inert).toBe(false);
    expect(opener.parentElement!.inert).toBe(true);
    expect(document.activeElement).toBe(panel);
    await act(() => panel.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    await act(() => tick());
    expect(panel.style.visibility).toBe('hidden');
    expect(opener.parentElement!.inert).toBe(false);
    expect(document.activeElement).toBe(opener);
    expect(node.querySelector('input')).toBe(input);
  } finally {
    await act(() => root.unmount());
    node.remove();
  }
  expect(freed).toBe(before + 1);
  expect(frames.size).toBe(0);
  expect(allocated).toBe(freed);
});
test('real WASM gestures preserve vertical scrolling and support edge opening and backdrop dismissal', async () => {
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  try {
    await act(async () => root.render(<Harness />));
    const panel = node.querySelector<HTMLElement>('[role="dialog"]')!;
    const body = node.querySelector<HTMLButtonElement>('#opener')!;
    await act(() => {
      pointer(body, 'pointerdown', 4, 10);
      pointer(body, 'pointermove', 5, 100);
      pointer(body, 'pointerup', 5, 100);
      tick();
    });
    expect(panel.style.visibility).toBe('hidden');
    await act(() => {
      pointer(body, 'pointerdown', 80, 10);
      pointer(body, 'pointermove', 280, 10);
      pointer(body, 'pointerup', 280, 10);
      tick();
    });
    expect(panel.style.visibility).toBe('hidden');
    await act(() => {
      pointer(body, 'pointerdown', 4, 10);
      pointer(body, 'pointermove', 200, 10);
      pointer(body, 'pointerup', 200, 10);
    });
    await act(() => tick());
    expect(panel.style.transform).toBe('translateX(0%)');
    const scrim = panel.previousElementSibling as HTMLElement;
    await act(() => {
      pointer(scrim, 'pointerdown', 390, 50);
      pointer(scrim, 'pointerup', 390, 50);
    });
    await act(() => tick());
    expect(panel.style.visibility).toBe('hidden');
  } finally {
    await act(() => root.unmount());
    node.remove();
  }
});
