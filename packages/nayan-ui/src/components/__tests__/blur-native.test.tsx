import { act, createRef, type ReactNode } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { NBlurProps } from '../NBlur';
import type { NViewNativeRef } from '../NView';

const dom = installDom();
const frames: { targetTag: number; blurRadius: number; enabled: boolean; tint: string; material?: NBlurProps['material'] }[] = [];
const platform = { OS: 'android' };
mock.module('react-native', () => ({
  Platform: platform,
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  View: ({ ref, children, collapsable }: { ref?: import('react').Ref<HTMLDivElement>; children?: ReactNode; collapsable?: boolean }) => (
    <div ref={ref} data-native-target={collapsable === false}>
      {children}
    </div>
  ),
  findNodeHandle: (node: HTMLElement) => (node.textContent === 'First backdrop' ? 41 : 42),
  requireNativeComponent: () => (props: (typeof frames)[number] & { children?: ReactNode }) => {
    frames.push(props);
    return <div>{props.children}</div>;
  }
}));
const { NBlur } = await import('../NBlur');
const { NView } = await import('../NView');
const { NPlatformView } = await import('../NPlatformView');
const { createRoot } = await import('react-dom/client');
afterAll(() => dom.cleanup());

test('native blur samples the backdrop or a ref to a retained platform view', async () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  const target = createRef<NViewNativeRef>();
  const render = (backdrop?: string, enabled = true) => (
    <NPlatformView>
      {backdrop && (
        <NView key={backdrop} ref={target} collapsable={false}>
          {backdrop}
        </NView>
      )}
      <NBlur blurTarget={backdrop ? target : undefined} radius={9} tint="dark" material="ultraThin" enabled={enabled}>
        <span>Foreground</span>
      </NBlur>
    </NPlatformView>
  );
  try {
    await act(() => root.render(render()));
    expect(frames.at(-1)?.targetTag).toBe(-1);
    const foreground = element.querySelector('span');
    await act(() => root.render(render('First backdrop')));
    expect(frames.at(-1)?.targetTag).toBe(41);
    expect(frames.at(-1)?.blurRadius).toBe(9);
    expect(frames.at(-1)?.material).toBeUndefined();
    expect(element.querySelector('[data-native-target=true]')?.textContent).toBe('First backdrop');
    await act(() => root.render(render('Second backdrop')));
    expect(frames.at(-1)?.targetTag).toBe(42);
    await act(() => root.render(render('Second backdrop', false)));
    expect(frames.at(-1)?.enabled).toBe(false);
    expect(frames.at(-1)?.blurRadius).toBe(0);
    expect(frames.at(-1)?.tint).toBe('default');
    expect(element.querySelector('span')).toBe(foreground);
    await act(() => root.render(render()));
    expect(frames.at(-1)?.targetTag).toBe(-1);
    expect(target.current).toBeNull();
  } finally {
    await act(() => root.unmount());
  }
  expect(target.current).toBeNull();
});

test('iOS forwards the selected material alongside the tint and radius', async () => {
  const root = createRoot(document.createElement('div'));
  platform.OS = 'ios';
  try {
    await act(() =>
      root.render(
        <NPlatformView>
          <NBlur intensity={45} tint="light" material="ultraThin" />
        </NPlatformView>
      )
    );
    expect(frames.at(-1)).toMatchObject({ blurRadius: 9, tint: 'light', material: 'ultraThin' });
  } finally {
    await act(() => root.unmount());
    platform.OS = 'android';
  }
});
