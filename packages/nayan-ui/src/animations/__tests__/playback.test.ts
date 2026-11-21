import { expect, mock, test } from 'bun:test';
import { animations, captureSharedElement, transitionSharedElement, viewPresets, withSpring } from '../index';
import { browserSpring, springCurve } from '../spring';
import { type AnimationViewRef, type ViewAnimationOptions, type ViewAnimationValues, type ViewBounds } from '../view';

function host(bounds: ViewBounds | null = null, reducedMotion = false) {
  const controller = new AbortController();
  const animate = mock((_to: Partial<ViewAnimationValues>, _options?: ViewAnimationOptions) => ({ finished: Promise.resolve(true), cancel() {} }));
  const measure = mock(async (): Promise<ViewBounds | null> => bounds);
  const ref: AnimationViewRef = { signal: controller.signal, reducedMotion, measure, animate };
  return { ref, animate, measure, controller };
}

test('presets are finite and yoyo reverses a multi-property sequence with proportional durations', async () => {
  expect(Object.keys(viewPresets).length).toBeGreaterThanOrEqual(40);
  const reduced = host(null, true);
  for (const preset of Object.values(viewPresets)) {
    expect(await animations.playView(reduced.ref, preset, { yoyo: true }).finished).toBe(true);
  }
  const { ref, animate } = host();
  const animation = animations.playView(
    ref,
    {
      initial: { opacity: 0, scale: 1 },
      steps: [
        { to: { opacity: 1 }, duration: 50 },
        { to: { scale: 2 }, duration: 100 }
      ]
    },
    { duration: 300, repeat: 1, yoyo: true }
  );
  expect(await animation.finished).toBe(true);
  expect(animate.mock.calls.map(([target, options]) => [target, options?.duration])).toEqual([
    [{ opacity: 0, scale: 1 }, 0],
    [{ opacity: 1 }, 100],
    [{ scale: 2 }, 200],
    [{ scale: 1 }, 200],
    [{ opacity: 0 }, 100]
  ]);
});

test('a delayed sequence cancels on replacement or unmount, and reduced motion skips looping', async () => {
  const { ref, animate, controller } = host();
  const delayed = animations.playView(ref, 'fadeIn', { delay: 3000 });
  expect(animate).not.toHaveBeenCalled();
  const replacement = animations.playView(ref, 'spin', { delay: 3000 });
  expect(await delayed.finished).toBe(false);
  controller.abort();
  expect(await replacement.finished).toBe(false);
  expect(animate).not.toHaveBeenCalled();
  const reduced = host(null, true);
  expect(await animations.playView(reduced.ref, 'bounceIn', { repeat: 'forever' }).finished).toBe(true);
  expect(reduced.animate.mock.calls).toEqual([[{ opacity: 1, scale: 1 }, { duration: 0 }]]);
});

test('shared elements measure source and destination, then animate their center and size deltas', async () => {
  const source = host({ x: 10, y: 14, width: 40, height: 80 });
  const destination = host({ x: 100, y: 80, width: 160, height: 200 });
  const snapshot = await captureSharedElement(source.ref);
  expect(snapshot).toEqual({ x: 10, y: 14, width: 40, height: 80 });
  expect(await (await transitionSharedElement(snapshot, destination.ref, { duration: 350 })).finished).toBe(true);
  expect(destination.animate.mock.calls).toEqual([
    [{ opacity: 0, translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 }, { duration: 0 }],
    [{ opacity: 1, translateX: -150, translateY: -126, scaleX: 0.25, scaleY: 0.4 }, { duration: 0 }],
    [
      { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 },
      { duration: 350, easing: 'easeOut', reduceMotion: 'system' }
    ]
  ]);
});

test('shared element fallbacks reveal unmeasurable views and ignore stale measurements', async () => {
  const target = host();
  expect(await captureSharedElement(target.ref)).toBeNull();
  const pending = Promise.withResolvers<ViewBounds | null>();
  target.measure.mockReturnValueOnce(pending.promise);
  const stale = transitionSharedElement(null, target.ref);
  const current = await transitionSharedElement(null, target.ref, { reduceMotion: 'always' });
  expect(await current.finished).toBe(true);
  pending.resolve({ x: 0, y: 0, width: 5, height: 5 });
  expect(await (await stale).finished).toBe(false);
  expect(target.animate).toHaveBeenCalledTimes(2);
  const fallback = await transitionSharedElement(null, target.ref);
  expect(await fallback.finished).toBe(true);
  expect(target.animate.mock.calls.at(-1)).toEqual([{ opacity: 1 }, { duration: 0 }]);
});

test('spring curves have exact endpoints and remain finite under different damping', () => {
  for (const damping of [7, 20, 40]) {
    const spec = withSpring(12, { stiffness: 100, damping, duration: 600 }).options;
    const curve = springCurve(spec.spring!, spec.duration);
    expect(curve(0)).toBe(0);
    expect(curve(1)).toBe(1);
    expect(Array.from({ length: 20 }, (_, i) => curve(i / 20)).every(Number.isFinite)).toBe(true);
    expect(browserSpring(spec.spring!, spec.duration)).toMatch(/^linear\(0\.00000,.*1\.00000\)$/);
  }
  expect(() => withSpring(1, { mass: 0 })).toThrow(RangeError);
});
