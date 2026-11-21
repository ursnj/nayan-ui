import { act, createRef } from 'react';
import { afterAll, expect, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import { ViewHost } from '../PlatformHost.web';

const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('browser platform views forward DOM refs and classes, preserve children and report layout', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  const ref = createRef<HTMLDivElement>();
  const layouts: unknown[] = [];
  try {
    await act(() =>
      root.render(
        <ViewHost
          ref={ref}
          className="flex-1 px-4"
          accessible={false}
          style={{ paddingHorizontal: 12 }}
          onLayout={(event) => layouts.push(event.nativeEvent.layout)}>
          <span>Visible content</span>
        </ViewHost>
      )
    );
    expect(ref.current).toBe(container.querySelector<HTMLDivElement>('[data-nayan-view]'));
    expect(ref.current?.className).toBe('flex-1 px-4');
    expect(ref.current?.style.paddingLeft).toBe('12px');
    expect(ref.current?.textContent).toBe('Visible content');
    expect(ref.current?.hasAttribute('aria-hidden')).toBe(false);
    expect(layouts).toHaveLength(1);
  } finally {
    await act(() => root.unmount());
  }
  expect(ref.current).toBeNull();
});

test('semantic browser tags and utility classes can override platform layout defaults', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  try {
    await act(() =>
      root.render(
        <ViewHost tag="section" className="grid grid-cols-2">
          <span>One</span>
          <span>Two</span>
        </ViewHost>
      )
    );
    const view = container.querySelector('section')!;
    expect(view).not.toBeNull();
    expect(view.className).toBe('grid grid-cols-2');
    expect(view.style.display).toBe('');
    expect(view.style.flexDirection).toBe('');
    expect(view.hasAttribute('tag')).toBe(false);
  } finally {
    await act(() => root.unmount());
  }
});
