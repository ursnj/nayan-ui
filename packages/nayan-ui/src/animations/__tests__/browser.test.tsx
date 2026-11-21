import { act, createRef } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import { AnimationView } from '../AnimationView.web';
import { animations } from '../index';
import { type AnimationViewRef, type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from '../view';

const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('shared values animate independent browser tracks without React renders', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  const ref = createRef<AnimationViewRef>();
  let opacity!: SharedValue;
  let renders = 0;
  function Card() {
    renders++;
    opacity = useSharedValue(0.5);
    const style = useAnimatedStyle({ opacity });
    return <AnimationView ref={ref} animatedStyle={style} />;
  }
  try {
    await act(() => root.render(<Card />));
    const view = container.firstElementChild as HTMLDivElement;
    expect(view.style.opacity).toBe('0.5');
    const tracks: ReturnType<typeof Promise.withResolvers<void>>[] = [];
    const animate = mock((_frames: PropertyIndexedKeyframes, _options: KeyframeAnimationOptions) => {
      const pending = Promise.withResolvers<void>();
      tracks.push(pending);
      return { finished: pending.promise, cancel: () => pending.reject(new Error('canceled')) };
    });
    Object.defineProperty(view, 'animate', { value: animate });
    const registerProperty = mock((_definition: PropertyDefinition) => {});
    Object.defineProperty(view.ownerDocument.defaultView!, 'CSS', { configurable: true, value: { registerProperty } });

    opacity.value = withTiming(0.8, { duration: 160 });
    const first = animations.animateView(ref, { scale: 1.2, translateY: 24 });
    expect(animate.mock.calls.map(([frames]) => frames)).toEqual([
      { opacity: ['0.5', '0.8'] },
      { '--nayan-animate-y': ['0px', '24px'] },
      { scale: ['1', '1.2'] }
    ]);
    expect(registerProperty).toHaveBeenCalledTimes(1);
    const second = animations.animateView(ref, { scale: 1.1 });
    tracks[0]!.resolve();
    tracks[1]!.resolve();
    tracks[3]!.resolve();
    expect(await first.finished).toBe(false);
    expect(await second.finished).toBe(true);
    expect(view.style.opacity).toBe('0.8');
    expect(view.style.scale).toBe('1.1');
    expect(view.style.getPropertyValue('--nayan-animate-y')).toBe('24px');
    expect(renders).toBe(1);
  } finally {
    await act(() => root.unmount());
  }
});

test('browser view cancels on unmount and applies reduced motion immediately', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  const ref = createRef<AnimationViewRef>();
  await act(() => root.render(<AnimationView ref={ref} />));
  const view = container.firstElementChild as HTMLDivElement;
  const pending = Promise.withResolvers<void>();
  const cancel = mock(() => pending.reject(new Error('canceled')));
  const animate = mock(() => ({ finished: pending.promise, cancel }));
  Object.defineProperty(view, 'animate', { value: animate });
  try {
    expect(() => animations.animateView(ref, { opacity: NaN })).toThrow(RangeError);
    const immediate = animations.animateView(ref, { opacity: 0.2 }, { reduceMotion: 'always' });
    expect(await immediate.finished).toBe(true);
    expect(view.style.opacity).toBe('0.2');
    expect(animate).not.toHaveBeenCalled();
    const running = animations.animateView(ref, { opacity: 1 });
    await act(() => root.unmount());
    expect(await running.finished).toBe(false);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(() => animations.animateView(ref, { opacity: 1 })).toThrow('must be mounted');
  } finally {
    await act(() => root.unmount());
  }
});
