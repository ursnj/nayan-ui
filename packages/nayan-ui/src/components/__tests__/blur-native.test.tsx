import { act, createRef, type ReactNode } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { NBlurTargetRef } from '../NBlur';

const dom = installDom();
const frames: { targetTag: number; blurRadius: number; enabled: boolean; tint: string }[] = [];
mock.module('react-native', () => ({
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  View: ({ ref, children }: { ref?: import('react').Ref<HTMLDivElement>; children?: ReactNode }) => <div ref={ref}>{children}</div>,
  findNodeHandle: (node: HTMLElement) => (node.textContent === 'First backdrop' ? 41 : 42),
  requireNativeComponent: () => (props: (typeof frames)[number] & { children?: ReactNode }) => {
    frames.push(props);
    return <div>{props.children}</div>;
  }
}));
const { BlurHost, BlurTargetHost } = await import('../BlurHost');
const { createRoot } = await import('react-dom/client');
afterAll(() => dom.cleanup());

test('native blur resolves targets after commit, switches routes and keeps children mounted when disabled', async () => {
  const root = createRoot(document.createElement('div'));
  const first = createRef<NBlurTargetRef>();
  const second = createRef<NBlurTargetRef>();
  const render = (alternate: boolean, enabled = true) => (
    <>
      <BlurTargetHost ref={first}>First backdrop</BlurTargetHost>
      <BlurTargetHost ref={second}>Second backdrop</BlurTargetHost>
      <BlurHost blurTarget={alternate ? second : first} radius={enabled ? 9 : 0} tint={enabled ? 'dark' : 'default'} enabled={enabled}>
        <span>Foreground</span>
      </BlurHost>
    </>
  );
  try {
    await act(() => root.render(render(false)));
    expect(frames.at(-1)?.targetTag).toBe(41);
    expect(frames.at(-1)?.blurRadius).toBe(9);
    await act(() => root.render(render(true)));
    expect(frames.at(-1)?.targetTag).toBe(42);
    await act(() => root.render(render(true, false)));
    expect(frames.at(-1)?.enabled).toBe(false);
    expect(frames.at(-1)?.blurRadius).toBe(0);
    expect(frames.at(-1)?.tint).toBe('default');
  } finally {
    await act(() => root.unmount());
  }
  expect(first.current).toBeNull();
  expect(second.current).toBeNull();
});
