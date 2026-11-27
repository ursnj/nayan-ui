import { act, type ReactNode, type Ref, useContext, useEffect, useImperativeHandle } from 'react';
import type { GestureResponderEvent, ViewProps } from 'react-native';
import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import { PresentationGestureContext } from '../theme/contexts';

type Props = {
  ref?: Ref<{ measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void }>;
  onTouchStart?: () => void;
  onStartShouldSetResponderCapture?: ViewProps['onStartShouldSetResponderCapture'];
  onTouchMove?: ViewProps['onTouchMove'];
  onTouchEnd?: ViewProps['onTouchEnd'];
  onTouchCancel?: ViewProps['onTouchCancel'];
  children?: ReactNode;
  style?: Record<string, unknown>;
  pointerEvents?: string;
  accessibilityViewIsModal?: boolean;
  animationType?: string;
};
class Value {
  constructor(public value: number) {}
  setValue(value: number) {
    this.value = value;
  }
  stopAnimation() {}
}
let reduced = false;
let modal: Props;
let scrim: Props;
let panel: Props;
let gripTouch: (() => void) | undefined;
const timing = mock((value: Value, options: { toValue: number; duration: number; useNativeDriver: boolean }) => ({
  start(done?: (result: { finished: boolean }) => void) {
    value.setValue(options.toValue);
    done?.({ finished: true });
  }
}));
const spring = mock((value: Value, options: { toValue: number }) => ({
  start(done?: (result: { finished: boolean }) => void) {
    value.setValue(options.toValue);
    done?.({ finished: true });
  }
}));
function Box({ children, onTouchStart }: Props) {
  if (onTouchStart) gripTouch = onTouchStart;
  return <div>{children}</div>;
}
mock.module('react-native', () => ({
  Modal: (props: Props) => {
    modal = props;
    return <Box>{props.children}</Box>;
  },
  View: Box,
  Pressable: Box,
  KeyboardAvoidingView: Box,
  Platform: { OS: 'ios' },
  Keyboard: { dismiss() {} },
  AccessibilityInfo: { isReduceMotionEnabled: async () => reduced },
  Animated: {
    Value,
    timing,
    spring,
    parallel: (animations: { start: () => void }[]) => ({
      start(done?: (result: { finished: boolean }) => void) {
        animations.forEach((animation) => animation.start());
        done?.({ finished: true });
      }
    }),
    View: (props: Props) => {
      useImperativeHandle(props.ref, () => ({ measureInWindow: (callback) => callback(0, 500, 402, Number(props.style?.height ?? 220)) }));
      if (props.accessibilityViewIsModal) panel = props;
      else scrim = props;
      return <Box>{props.children}</Box>;
    }
  },
  useWindowDimensions: () => ({ width: 402, height: 874 })
}));
mock.module('../NToastHost', () => ({ NToastHost: () => null }));
const dom = installDom();
const { createRoot } = await import('react-dom/client');
const { PresentationHost } = await import('../PresentationHost');
afterAll(() => dom.cleanup());
beforeEach(() => {
  reduced = false;
  timing.mockClear();
  spring.mockClear();
});

test('the stationary scrim fades independently while a sheet waits for content measurement', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    const render = (ready: boolean) =>
      act(async () =>
        root.render(
          <PresentationHost
            sheet
            ready={ready}
            height={220}
            width={402}
            border="#444"
            background="#222"
            onClose={() => {}}
            backdrop={<div data-panel-backdrop />}
          >
            Content
          </PresentationHost>
        )
      );
    await render(false);
    expect(modal.animationType).toBe('none');
    expect(timing).toHaveBeenCalledTimes(1);
    expect(timing.mock.calls[0]?.[0]).toBe(scrim.style?.opacity as Value);
    expect(timing.mock.calls[0]?.[1]).toMatchObject({ toValue: 1, duration: 200, useNativeDriver: true });
    expect(scrim.style?.transform).toBeUndefined();
    expect(spring).not.toHaveBeenCalled();
    expect(container.querySelector('[data-panel-backdrop]')).toBeNull();
    expect(container.textContent).toBe('Content');
    await render(true);
    expect(spring).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledTimes(1);
    expect(scrim.style?.transform).toBeUndefined();
    expect(panel.style?.transform).toBeDefined();
    expect(container.querySelector('[data-panel-backdrop]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});

test('reduced motion shows both layers immediately without animating the backdrop or panel', async () => {
  reduced = true;
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () =>
      root.render(
        <PresentationHost sheet height={220} width={402} border="#444" background="#222" onClose={() => {}}>
          Content
        </PresentationHost>
      )
    );
    expect(timing).not.toHaveBeenCalled();
    expect(spring).not.toHaveBeenCalled();
    expect((scrim.style?.opacity as Value).value).toBe(1);
  } finally {
    await act(async () => root.unmount());
  }
});

test('dialogs retain their existing modal fade', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () =>
      root.render(
        <PresentationHost sheet={false} height={220} width={360} border="#444" background="#222" onClose={() => {}}>
          Content
        </PresentationHost>
      )
    );
    expect(modal.animationType).toBe('fade');
    expect((scrim.style?.opacity as Value).value).toBe(1);
    expect(panel.style?.transform).toBeUndefined();
    expect(timing).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

const event = (pageY: number, pageX = 100, timestamp = 100, touches = 1) => {
  const point = { pageY, pageX, identifier: 1, timestamp };
  return {
    nativeEvent: { ...point, touches: Array.from({ length: touches }, (_, i) => ({ ...point, identifier: i + 1 })) }
  } as unknown as GestureResponderEvent;
};

test('raw header and grip touches dismiss without a responder grant; short drags restore the sheet and backdrop', async () => {
  const cancel = mock(() => {});
  function Surface() {
    const presentation = useContext(PresentationGestureContext);
    useEffect(() => presentation?.register(cancel), [presentation]);
    return <div>Content</div>;
  }
  const root = createRoot(document.createElement('div'));
  const close = mock(() => {});
  try {
    await act(async () =>
      root.render(
        <PresentationHost sheet swipeable height={300} width={402} dragAreaHeight={112} border="#444" background="#222" onClose={close}>
          <Surface />
        </PresentationHost>
      )
    );
    expect(panel.onStartShouldSetResponderCapture?.(event(560))).toBe(false);
    panel.onTouchMove?.(event(580, 100, 300));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect((scrim.style?.opacity as Value).value).toBeLessThan(1);
    panel.onTouchEnd?.(event(580));
    expect(close).not.toHaveBeenCalled();
    expect((scrim.style?.opacity as Value).value).toBe(1);
    panel.onStartShouldSetResponderCapture?.(event(516));
    gripTouch?.();
    panel.onTouchMove?.(event(636, 100, 600));
    panel.onTouchEnd?.(event(636));
    expect(close).toHaveBeenCalledTimes(1);
    expect((scrim.style?.opacity as Value).value).toBe(0);
    expect(scrim.style?.transform).toBeUndefined();
  } finally {
    await act(async () => root.unmount());
  }
});

test('sheet drags leave scrollable content, horizontal gestures, multiple fingers and locked sheets alone', async () => {
  function ScrolledSurface() {
    const presentation = useContext(PresentationGestureContext);
    useEffect(
      () =>
        presentation?.register(
          () => {},
          () => false
        ),
      [presentation]
    );
    return <div>Scrolled content</div>;
  }
  const root = createRoot(document.createElement('div'));
  const close = mock(() => {});
  const render = (swipeable: boolean) =>
    act(async () =>
      root.render(
        <PresentationHost sheet swipeable={swipeable} height={600} width={402} dragAreaHeight={112} border="#444" background="#222" onClose={close}>
          <ScrolledSurface />
        </PresentationHost>
      )
    );
  try {
    await render(true);
    panel.onStartShouldSetResponderCapture?.(event(800));
    panel.onTouchMove?.(event(950));
    panel.onTouchEnd?.(event(950));
    expect(close).not.toHaveBeenCalled();
    panel.onStartShouldSetResponderCapture?.(event(550));
    panel.onTouchMove?.(event(600, 200));
    panel.onTouchEnd?.(event(600, 200));
    expect(close).not.toHaveBeenCalled();
    panel.onStartShouldSetResponderCapture?.(event(550));
    panel.onTouchMove?.(event(700, 100, 300, 2));
    panel.onTouchEnd?.(event(700));
    expect(close).not.toHaveBeenCalled();
    await render(false);
    expect(panel.onStartShouldSetResponderCapture).toBeUndefined();
    expect(panel.onTouchMove).toBeUndefined();
    expect(close).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

test('a tall sheet can be dismissed from its body at the scroll boundary and cancels its child tap', async () => {
  const cancel = mock(() => {});
  const canStart = mock(() => true);
  function Surface() {
    const presentation = useContext(PresentationGestureContext);
    useEffect(() => presentation?.register(cancel, canStart), [presentation]);
    return <div>Unscrolled content</div>;
  }
  const root = createRoot(document.createElement('div'));
  const close = mock(() => {});
  try {
    await act(() =>
      root.render(
        <PresentationHost sheet swipeable height={600} width={402} dragAreaHeight={112} border="#444" background="#222" onClose={close}>
          <Surface />
        </PresentationHost>
      )
    );
    panel.onStartShouldSetResponderCapture?.(event(800));
    expect(canStart).toHaveBeenCalledWith(100, 800);
    panel.onTouchMove?.(event(950, 100, 400));
    panel.onTouchEnd?.(event(950));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
  }
});

test('a drag that starts by scrolling up cannot reverse into sheet dismissal', async () => {
  const root = createRoot(document.createElement('div'));
  const close = mock(() => {});
  try {
    await act(() =>
      root.render(
        <PresentationHost sheet swipeable height={600} width={402} border="#444" background="#222" onClose={close}>
          Content
        </PresentationHost>
      )
    );
    panel.onStartShouldSetResponderCapture?.(event(800));
    panel.onTouchMove?.(event(740));
    panel.onTouchMove?.(event(950));
    panel.onTouchEnd?.(event(950));
    expect(close).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
  }
});

test('pending native measurement cannot enable an ended gesture or prevent the next handle drag', async () => {
  let finish: (allowed: boolean) => void = () => {};
  function Surface() {
    const presentation = useContext(PresentationGestureContext);
    useEffect(
      () =>
        presentation?.register(
          () => {},
          () =>
            new Promise<boolean>((resolve) => {
              finish = resolve;
            })
        ),
      [presentation]
    );
    return <div>Content</div>;
  }
  const root = createRoot(document.createElement('div'));
  const close = mock(() => {});
  try {
    await act(() =>
      root.render(
        <PresentationHost sheet swipeable height={600} width={402} border="#444" background="#222" onClose={close}>
          <Surface />
        </PresentationHost>
      )
    );
    panel.onStartShouldSetResponderCapture?.(event(800));
    panel.onTouchMove?.(event(950));
    panel.onTouchEnd?.(event(950));
    await act(async () => finish(true));
    expect(close).not.toHaveBeenCalled();
    panel.onStartShouldSetResponderCapture?.(event(520));
    gripTouch?.();
    panel.onTouchMove?.(event(650));
    panel.onTouchEnd?.(event(650));
    expect(close).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
  }
});

test('cancelled native drags restore the sheet and a subsequent fast downward flick dismisses once', async () => {
  const root = createRoot(document.createElement('div'));
  const close = mock(() => {});
  try {
    await act(async () =>
      root.render(
        <PresentationHost sheet swipeable height={600} width={402} border="#444" background="#222" onClose={close}>
          Content
        </PresentationHost>
      )
    );
    panel.onStartShouldSetResponderCapture?.(event(520));
    panel.onTouchMove?.(event(650, 100, 400));
    panel.onTouchCancel?.(event(650));
    panel.onTouchEnd?.(event(650));
    expect(close).not.toHaveBeenCalled();
    expect((scrim.style?.opacity as Value).value).toBe(1);
    panel.onStartShouldSetResponderCapture?.(event(520));
    panel.onTouchMove?.(event(550, 100, 120));
    panel.onTouchEnd?.(event(550));
    panel.onTouchEnd?.(event(550));
    expect(close).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
  }
});
