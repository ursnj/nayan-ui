import { act, cloneElement, createRef, type ReactElement, type ReactNode, type Ref, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import { createTestCore } from '../../native/__tests__/core';
import type { NViewNativeRef } from '../NView';
import { ComponentThemeContext } from '../ThemeContext';

const core = await createTestCore();
mock.module('../../native/NativeNayanEngine', () => ({ default: core }));
const measured = mock(() => {});
let viewport = { width: 390, height: 844 };
let nativeTag = 1;
const propsById = new Map<string, Record<string, unknown>>();
type LayoutEvent = { nativeEvent: { layout: { width: number; height: number } } };
function NativeView(props: { children?: ReactNode; ref?: Ref<NViewNativeRef>; testID?: string; onLayout?: (event: LayoutEvent) => void }) {
  const node = useRef({ measureInWindow: measured, nativeTag: nativeTag++ });
  useImperativeHandle(props.ref, () => node.current as unknown as NViewNativeRef, []);
  propsById.set(props.testID ?? 'view', props);
  const onLayout = props.onLayout;
  useLayoutEffect(() => onLayout?.({ nativeEvent: { layout: { width: 0, height: 0 } } }), [onLayout]);
  return <div>{props.children}</div>;
}
mock.module('react-native', () => ({
  View: NativeView,
  Text: NativeView,
  Image: NativeView,
  StyleSheet: { absoluteFill: {} },
  Pressable: ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => <button onClick={onPress}>{children}</button>,
  PixelRatio: { get: () => 1 },
  useWindowDimensions: () => viewport
}));
const { ViewHost, TextHost } = await import('../PlatformHost');
const { NIcon } = await import('../NIcon');
const { NPattern } = await import('../NPattern');
const { NPlatformView } = await import('../NPlatformView');
const { NPress } = await import('../NPress');
const { NText } = await import('../NText');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

function flatten(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

test('native views preserve Yoga percentages, layout events, measurement and explicit style precedence', async () => {
  const root = dom.createRoot(document.createElement('div'));
  const ref = createRef<NViewNativeRef>();
  const onLayout = mock(() => {});
  try {
    await act(() =>
      root.render(<ViewHost ref={ref} testID="layout" className="w-full flex-1 items-stretch overflow-hidden rounded-xl px-4" onLayout={onLayout} />)
    );
    expect(flatten(propsById.get('layout')!.style)).toMatchObject({
      width: '100%',
      flex: 1,
      flexBasis: 0,
      flexShrink: 1,
      alignItems: 'stretch',
      overflow: 'hidden',
      borderRadius: 12,
      paddingLeft: 16
    });
    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(ref.current?.measureInWindow).toBe(measured);
    await act(() =>
      root.render(<ViewHost ref={ref} testID="layout" className="w-full flex-1 px-4" width={180} style={[{ width: 120 }, { padding: 7, flex: 3 }]} />)
    );
    expect(flatten(propsById.get('layout')!.style)).toMatchObject({ width: 120, paddingLeft: 7, paddingRight: 7, flexGrow: 3, flexBasis: 0 });
  } finally {
    await act(() => root.unmount());
  }
  expect(ref.current).toBeNull();
});

test('SDK asset registration receives actual native view and text refs through the shared adapter', async () => {
  const registered = createRef<NViewNativeRef>();
  function Asset({ children }: { children: ReactElement }) {
    return cloneElement(children, { ref: registered } as Record<string, unknown>);
  }
  const root = dom.createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <Asset>
          <ViewHost className="p-4">
            <TextHost>Call to action</TextHost>
          </ViewHost>
        </Asset>
      )
    );
    expect(registered.current?.measureInWindow).toBe(measured);
    const view = registered.current;
    await act(() =>
      root.render(
        <Asset>
          <TextHost className="text-sm leading-5">Headline</TextHost>
        </Asset>
      )
    );
    expect(registered.current).not.toBe(view);
    expect(registered.current?.measureInWindow).toBe(measured);
  } finally {
    await act(() => root.unmount());
  }
  expect(registered.current).toBeNull();
});

test('native class styles follow theme and responsive width without a surface', async () => {
  const root = dom.createRoot(document.createElement('div'));
  const render = (accent: string) => (
    <ComponentThemeContext.Provider value={{ theme: 'dark', colors: { accent }, components: { NView: { className: 'items-center' } } }}>
      <ViewHost testID="responsive" className="bg-accent w-full md:w-1/2 dark:rounded-xl" />
    </ComponentThemeContext.Provider>
  );
  try {
    await act(() => root.render(render('#123456')));
    expect(flatten(propsById.get('responsive')!.style)).toMatchObject({
      width: '100%',
      backgroundColor: 'rgba(18,52,86,1)',
      alignItems: 'center',
      borderRadius: 12
    });
    viewport = { width: 800, height: 600 };
    await act(() => root.render(render('#abcdef')));
    expect(flatten(propsById.get('responsive')!.style)).toMatchObject({ width: '50%', backgroundColor: 'rgba(171,205,239,1)' });
    await act(() =>
      root.render(
        <ComponentThemeContext.Provider value={{ components: { NView: { className: 'px-4' } }, textProps: { allowFontScaling: false } }}>
          <ViewHost testID="defaults" />
          <TextHost testID="scaled">Default</TextHost>
          <TextHost testID="override" allowFontScaling>
            Accessible
          </TextHost>
        </ComponentThemeContext.Provider>
      )
    );
    expect(flatten(propsById.get('defaults')!.style)).toMatchObject({ paddingLeft: 16 });
    expect(propsById.get('scaled')!.allowFontScaling).toBe(false);
    expect(propsById.get('override')!.allowFontScaling).toBe(true);
  } finally {
    viewport = { width: 390, height: 844 };
    await act(() => root.unmount());
  }
});

test('native navigation controls render inside NPlatformView', async () => {
  const element = document.createElement('div');
  const root = dom.createRoot(element);
  const onPress = mock(() => {});
  try {
    await act(() =>
      root.render(
        <NPlatformView>
          <NPattern recipe={{}} testID="navigation-pattern" />
          <NPress onPress={onPress}>
            <NIcon name="★" />
            <NText>Premium</NText>
          </NPress>
        </NPlatformView>
      )
    );
    expect(propsById.get('navigation-pattern')?.pointerEvents).toBe('none');
    const button = element.querySelector('button');
    expect(button?.textContent).toBe('★Premium');
    await act(() => button?.click());
    expect(onPress).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
  }
});
