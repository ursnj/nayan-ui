import { act, createRef } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { NViewNativeRef } from '../NView';
import { PlatformRenderContext } from '../ThemeContext';

const dom = installDom();
const web = await import('../BlurHost.web');
mock.module('../BlurHost', () => web);
const platform = await import('../PlatformHost.web');
mock.module('../PlatformHost', () => platform);
const renderer = await import('../useComponentRenderer.web');
mock.module('../useComponentRenderer', () => renderer);
const { NBlur } = await import('../NBlur');
const { NView } = await import('../NView');
const { createRoot } = await import('react-dom/client');
afterAll(() => dom.cleanup());

test('browser blur preserves semantic tags, foreground content and composed styles as strength changes', async () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  const render = (enabled: boolean) => (
    <NBlur
      tag="aside"
      radius={12}
      enabled={enabled}
      tint="dark"
      material="ultraThin"
      style={[{ borderRadius: 18 }, { overflow: 'hidden' }]}
      aria-label="Frosted panel"
    >
      <button type="button">Sharp foreground</button>
    </NBlur>
  );
  try {
    await act(() => root.render(<PlatformRenderContext.Provider value>{render(true)}</PlatformRenderContext.Provider>));
    const panel = element.querySelector('aside')!;
    const button = panel.querySelector('button');
    expect(panel.style.backdropFilter).toBe('blur(12px)');
    expect(panel.style.borderRadius).toBe('18px');
    expect(panel.style.overflow).toBe('hidden');
    expect(panel.getAttribute('aria-label')).toBe('Frosted panel');
    expect(panel.hasAttribute('material')).toBe(false);
    await act(() => root.render(<PlatformRenderContext.Provider value>{render(false)}</PlatformRenderContext.Provider>));
    expect(panel.style.backdropFilter).toBe('blur(0px)');
    expect(panel.querySelector('button')).toBe(button);
    expect(button?.textContent).toBe('Sharp foreground');
  } finally {
    await act(() => root.unmount());
  }
});

test('targets release their refs on unmount and strength stays finite for invalid user values', async () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  const target = createRef<NViewNativeRef>();
  try {
    for (const [intensity, expected] of [
      [200, 20],
      [-3, 0],
      [NaN, 0]
    ]) {
      await act(() =>
        root.render(
          <PlatformRenderContext.Provider value>
            <NView ref={target} id="backdrop" collapsable={false} className="flex-1">
              Backdrop
            </NView>
            <NBlur intensity={intensity} blurTarget={target} />
          </PlatformRenderContext.Provider>
        )
      );
      expect(target.current).not.toBeNull();
      expect(element.querySelector('#backdrop')?.textContent).toBe('Backdrop');
      expect((element.lastElementChild as HTMLElement).style.backdropFilter).toBe(`blur(${expected}px)`);
    }
  } finally {
    await act(() => root.unmount());
  }
  expect(target.current).toBeNull();
});
