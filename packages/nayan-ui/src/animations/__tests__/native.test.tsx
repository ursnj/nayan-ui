import { act, createRef, type Ref, useImperativeHandle } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import type { AnimationViewRef } from '../view';

class TestValue {
  constructor(public value: number) {}
  setValue(value: number) {
    this.value = value;
  }
  interpolate() {
    return this;
  }
}

const motions: { finish(): void; stop(): void }[] = [];
const timing = mock((value: TestValue, options: { toValue: number; useNativeDriver: boolean }) => {
  let callback: (result: { finished: boolean }) => void;
  const motion = {
    start(report: typeof callback) {
      callback = report;
    },
    stop: mock(() => callback({ finished: false })),
    finish() {
      value.setValue(options.toValue);
      callback({ finished: true });
    }
  };
  motions.push(motion);
  return motion;
});
const remove = mock(() => {});
let reportMotion!: (enabled: boolean) => void;
function NativeView({ ref }: { ref: Ref<{ measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void }> }) {
  useImperativeHandle(ref, () => ({ measureInWindow: (callback) => callback(12, 18, 100, 80) }));
  return null;
}
mock.module('react-native', () => ({
  Animated: { Value: TestValue, View: NativeView, timing },
  Easing: { bezier: () => 'bezier' },
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => false,
    addEventListener: (_name: string, listener: typeof reportMotion) => {
      reportMotion = listener;
      return { remove };
    }
  }
}));
const { AnimationView, animations } = await import('../index');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('native views use the native driver and stop only replaced or canceled tracks', async () => {
  const root = dom.createRoot(document.createElement('div'));
  const ref = createRef<AnimationViewRef>();
  try {
    await act(() => root.render(<AnimationView ref={ref} initial={{ opacity: 0.5 }} />));
    expect(await animations.captureSharedElement(ref)).toEqual({ x: 12, y: 18, width: 100, height: 80 });
    const first = animations.animateView(ref, { opacity: 0.8, translateX: 30 }, { duration: 180 });
    expect(timing.mock.calls.map(([value, options]) => [value.value, options])).toEqual([
      [0.5, expect.objectContaining({ toValue: 0.8, duration: 180, useNativeDriver: true })],
      [0, expect.objectContaining({ toValue: 30, duration: 180, useNativeDriver: true })]
    ]);
    const second = animations.animateView(ref, { opacity: 1 });
    expect(motions[0]!.stop).toHaveBeenCalledTimes(1);
    expect(motions[1]!.stop).not.toHaveBeenCalled();
    motions[1]!.finish();
    expect(await first.finished).toBe(false);
    second.cancel();
    expect(await second.finished).toBe(false);
    expect(motions[2]!.stop).toHaveBeenCalledTimes(1);
    reportMotion(true);
    expect(await animations.animateView(ref, { opacity: 0.3 }).finished).toBe(true);
    expect(timing).toHaveBeenCalledTimes(3);
    expect(timing.mock.calls[0]![0].value).toBe(0.3);
  } finally {
    await act(() => root.unmount());
  }
  expect(remove).toHaveBeenCalledTimes(1);
});
