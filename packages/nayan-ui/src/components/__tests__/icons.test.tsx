import { act, createElement } from 'react';
import { afterAll, expect, mock, spyOn, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import { createTestCore } from '../../native/__tests__/core';
import { lucideIcon } from '../icons';
import { lucidePaths } from '../icons/lucide';
import { createComponentRenderer } from '../reconciler';
import type { ComponentNode } from '../types';

const native = await createTestCore();
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../../native/prepare', () => ({ prepareEngine: async () => {} }));
mock.module('react-native', () => ({
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  PixelRatio: { get: () => 3 },
  Image: (props: Record<string, unknown>) =>
    createElement('img', { 'data-source': JSON.stringify(props.source), 'data-style': JSON.stringify(props.style) }),
  View: () => createElement('span'),
  Text: ({ children }: { children: string }) => createElement('span', null, children),
  Pressable: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => createElement('button', { onClick: onPress }, children)
}));
const { iconImage, requestIcon } = await import('../iconImage');
const { NIcon } = await import('../icons');
const { IconHost: WebIcon } = await import('../PlatformHost.web');
const { ComponentRenderContext } = await import('../ThemeContext');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('every bundled Lucide icon, including SVG primitives and aliases, rasterizes in the Rust core', async () => {
  expect(Object.keys(lucidePaths).length).toBeGreaterThan(2000);
  for (const [name, paths] of Object.entries(lucidePaths)) {
    const png = await requestIcon<string>(new ArrayBuffer(0), { action: 'image', paths, viewBox: 24, strokeWidth: 2, pixels: 24 });
    expect(png, name).toStartWith('data:image/png;base64,');
  }
}, 30000);

test('Lucide names resolve synchronously, support PascalCase and share cached outlines', () => {
  expect(lucideIcon('House')).toBe(lucideIcon('house'));
  expect(lucideIcon('Gamepad2')).toBe(lucideIcon('gamepad-2'));
  expect(lucideIcon('ImageIcon')).toBe(lucideIcon('image'));
  expect(lucideIcon('house')!.viewBox).toBe(24);
  expect(lucideIcon('constructor')).toBeUndefined();
  expect(lucideIcon('not-an-icon')).toBeUndefined();
});

test('native masks keep Lucide strokes hollow and cache at each device density', async () => {
  const circle = lucideIcon('circle')!;
  const first = iconImage(circle, 96, 2);
  expect(iconImage(circle, 96, 2)).toBe(first);
  const uri = await first;
  const png = Buffer.from(uri.split(',')[1]!, 'base64');
  const texture = native.textureLoad(Uint8Array.from(png).buffer);
  expect(native.textureSize(texture)).toEqual([96, 96]);
  const rgba = new Uint8Array(native.texturePixels(texture));
  expect(rgba[(48 * 96 + 48) * 4 + 3]).toBe(0);
  expect(rgba.some((value, i) => i % 4 === 3 && value > 200)).toBe(true);
  expect(await iconImage(circle, 48, 2)).not.toBe(uri);
});

test('engine UI receives only the requested icon paths immediately without font or asset loading', async () => {
  let nodes: ComponentNode[] = [];
  const calls = spyOn(native, 'iconRequest');
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  try {
    await act(() =>
      renderer.render(
        <ComponentRenderContext.Provider value={true}>
          <NIcon name="house" size={24} />
        </ComponentRenderContext.Provider>
      )
    );
    expect(nodes[0]!.props.paths).toBe(lucideIcon('house')!.paths);
    expect(nodes[0]!.props.strokeWidth).toBe(2);
    expect(nodes[0]!.props.size).toBe(24);
    expect(JSON.stringify(nodes)).not.toContain('gamepad-2');
    expect(calls).not.toHaveBeenCalled();
  } finally {
    await act(() => renderer.dispose());
    calls.mockRestore();
  }
});

test('native navigation uses tinted Images at device density with press and accessibility behavior', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = dom.createRoot(container);
  const pressed = mock(() => {});
  const calls = spyOn(native, 'iconRequest');
  try {
    await act(() => root.render(<NIcon name="house" size={24} color="#123456" onPress={pressed} accessibilityLabel="Home" />));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    const image = container.querySelector('img')!;
    expect(JSON.parse(image.dataset.source!).uri).toStartWith('data:image/png;base64,');
    expect(image.dataset.style).toContain('"tintColor":"#123456"');
    expect(JSON.parse(calls.mock.calls[0]![1])).toMatchObject({ action: 'image', pixels: 72, strokeWidth: 2 });
    await act(() => {
      container.querySelector('button')!.click();
    });
    expect(pressed).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
    calls.mockRestore();
    container.remove();
  }
});

test('browser attachments use the same 24-unit rounded Lucide outlines', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  try {
    await act(() => root.render(<WebIcon outline={lucideIcon('gamepad-2')} strokeWidth={2} color="#abcdef" accessibilityLabel="Games" />));
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('2');
    expect(svg.getAttribute('stroke-linecap')).toBe('round');
    expect(svg.querySelectorAll('path')).toHaveLength(lucidePaths['gamepad-2'].length);
  } finally {
    await act(() => root.unmount());
  }
});

test('unknown names use a visible fallback; Unicode and existing explicit artwork remain intact', async () => {
  let nodes: ComponentNode[] = [];
  const failed = mock(() => {});
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  try {
    await act(() =>
      renderer.render(
        <ComponentRenderContext.Provider value={true}>
          <NIcon name="unknown-lucide-icon" onError={failed} />
        </ComponentRenderContext.Provider>
      )
    );
    expect(nodes[0]!.props.paths).toBe(lucideIcon('circle-question-mark')!.paths);
    expect(failed).toHaveBeenCalledTimes(1);
    await act(() =>
      renderer.render(
        <ComponentRenderContext.Provider value={true}>
          <NIcon name="x" />
        </ComponentRenderContext.Provider>
      )
    );
    expect(nodes[0]!.props.paths).toBe(lucideIcon('x')!.paths);
    expect(nodes[0]!.props.strokeWidth).toBe(2);
    await act(() =>
      renderer.render(
        <ComponentRenderContext.Provider value={true}>
          <NIcon name="★" />
        </ComponentRenderContext.Provider>
      )
    );
    expect(nodes[0]!.props.name).toBe('★');
    expect(nodes[0]!.props.paths).toBeUndefined();
    await act(() =>
      renderer.render(
        <ComponentRenderContext.Provider value={true}>
          <NIcon paths="M0 0H24V24H0Z" />
        </ComponentRenderContext.Provider>
      )
    );
    expect(nodes[0]!.props.strokeWidth).toBeUndefined();
  } finally {
    await act(() => renderer.dispose());
  }
});

test('failed native image requests can retry without retaining a rejected cache entry', async () => {
  const calls = spyOn(native, 'iconRequest');
  const outline = lucideIcon('crown')!;
  calls.mockRejectedValueOnce(new Error('temporary raster failure'));
  try {
    await expect(iconImage(outline, 79, 2)).rejects.toThrow('temporary raster failure');
    expect(await iconImage(outline, 79, 2)).toStartWith('data:image/png;base64,');
  } finally {
    calls.mockRestore();
  }
});
