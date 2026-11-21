import { type Ref, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';

export type ViewAnimationValues = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
  skewX: number;
  skewY: number;
};

export type ViewAnimationEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface ViewAnimationOptions {
  /** Duration in milliseconds. Defaults to 250. */
  duration?: number;
  easing?: ViewAnimationEasing;
  /** Follow the platform preference by default. */
  reduceMotion?: 'system' | 'always' | 'never';
  /** Use a damped spring curve over the configured duration. */
  spring?: ViewSpringOptions;
}

export interface ViewSpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export type ViewAnimationConfig = Required<Omit<ViewAnimationOptions, 'spring'>> & { spring?: Required<ViewSpringOptions> };

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewAnimationHandle {
  /** True on completion, false on cancellation, replacement or unmount. */
  readonly finished: Promise<boolean>;
  cancel(): void;
}

export interface AnimationViewRef {
  animate(to: Partial<ViewAnimationValues>, options?: ViewAnimationOptions): ViewAnimationHandle;
  measure(): Promise<Readonly<ViewBounds> | null>;
  readonly signal: AbortSignal;
  readonly reducedMotion: boolean;
}

export interface TimingAnimation {
  readonly to: number;
  readonly options: Readonly<ViewAnimationConfig>;
}

type Binding = (value: number | TimingAnimation) => void;

export interface SharedValue {
  /** Last assigned destination. Reading this property does not sample an in-flight animation. */
  get value(): number;
  set value(value: number | TimingAnimation);
  subscribe(listener: Binding): () => void;
}

export type AnimatedViewStyle = Readonly<Partial<Record<keyof ViewAnimationValues, number | SharedValue>>>;

const defaults: ViewAnimationValues = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  skewX: 0,
  skewY: 0
};
export const viewKeys = Object.keys(defaults) as (keyof ViewAnimationValues)[];
export const angleKeys = ['rotate', 'rotateX', 'rotateY', 'skewX', 'skewY'] as const;
export const easingCurves: Record<ViewAnimationEasing, readonly [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1]
};

export function normalize(options: ViewAnimationOptions = {}): ViewAnimationConfig {
  const { duration = options.spring ? 650 : 250, easing = 'easeOut', reduceMotion = 'system' } = options;
  if (!Number.isFinite(duration) || duration < 0) throw new RangeError('Animation duration must be finite and nonnegative');
  if (!Object.hasOwn(easingCurves, easing)) throw new TypeError('Unknown view animation easing');
  if (reduceMotion !== 'system' && reduceMotion !== 'always' && reduceMotion !== 'never') throw new TypeError('Unknown reduced motion setting');
  if (!options.spring) return { duration, easing, reduceMotion };
  const { stiffness = 170, damping = 18, mass = 1 } = options.spring;
  for (const value of [stiffness, damping, mass]) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('Spring parameters must be finite and positive');
  }
  return { duration, easing, reduceMotion, spring: { stiffness, damping, mass } };
}

export function withTiming(to: number, options?: ViewAnimationOptions): TimingAnimation {
  if (!Number.isFinite(to)) throw new RangeError('Animation target must be finite');
  return { to, options: normalize(options) };
}

export function withSpring(to: number, options: Omit<ViewAnimationOptions, 'easing' | 'spring'> & ViewSpringOptions = {}): TimingAnimation {
  const { duration, reduceMotion, stiffness, damping, mass } = options;
  return withTiming(to, { duration, reduceMotion, spring: { stiffness, damping, mass } });
}

class AnimatedValue implements SharedValue {
  private current: number;
  private listeners = new Set<Binding>();

  constructor(initial: number) {
    if (!Number.isFinite(initial)) throw new RangeError('Shared value must be finite');
    this.current = initial;
  }

  get value(): number {
    return this.current;
  }

  set value(value: number | TimingAnimation) {
    const next = typeof value === 'number' ? value : value.to;
    if (!Number.isFinite(next)) throw new RangeError('Shared value must be finite');
    this.current = next;
    for (const listener of [...this.listeners]) listener(value);
  }

  subscribe(listener: Binding) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function useSharedValue(initial: number): SharedValue {
  const ref = useRef<SharedValue | null>(null);
  ref.current ??= new AnimatedValue(initial);
  return ref.current;
}

/** Bind shared values directly to host properties. Bindings run without React state updates. */
export function useAnimatedStyle(style: AnimatedViewStyle): AnimatedViewStyle {
  const ref = useRef(style);
  if (viewKeys.some((key) => ref.current[key] !== style[key])) ref.current = style;
  return ref.current;
}

export function initialViewValues(initial?: Partial<ViewAnimationValues>, animatedStyle?: AnimatedViewStyle): ViewAnimationValues {
  const result = { ...defaults };
  for (const key of viewKeys) {
    const binding = animatedStyle?.[key];
    const value = (typeof binding === 'object' ? binding.value : binding) ?? initial?.[key];
    if (value !== undefined) {
      if (!Number.isFinite(value)) throw new RangeError(`Animation ${key} must be finite`);
      result[key] = value;
    }
  }
  return result;
}

export type ViewDriver = (key: keyof ViewAnimationValues, to: number, options: ViewAnimationConfig, done: (finished: boolean) => void) => () => void;

export function useViewAnimation(
  ref: Ref<AnimationViewRef> | undefined,
  style: AnimatedViewStyle | undefined,
  driver: ViewDriver,
  measure: AnimationViewRef['measure'],
  reducedMotion: () => boolean
) {
  const active = useRef(new Map<keyof ViewAnimationValues, () => void>()).current;
  const lifecycle = useRef<AbortController | null>(null);
  const driverRef = useRef(driver);
  const measureRef = useRef(measure);
  const motionRef = useRef(reducedMotion);
  useLayoutEffect(() => {
    driverRef.current = driver;
    measureRef.current = measure;
    motionRef.current = reducedMotion;
  }, [driver, measure, reducedMotion]);
  useLayoutEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    return () => {
      lifecycle.current = null;
      controller.abort();
      for (const stop of active.values()) stop();
    };
  }, [active]);

  const animate = useCallback(
    (to: Partial<ViewAnimationValues>, options?: ViewAnimationOptions): ViewAnimationHandle => {
      if (!lifecycle.current) throw new Error('AnimationView must be mounted');
      const config = normalize(options);
      const tracks = viewKeys.flatMap((key) => {
        const value = to[key];
        if (value === undefined) return [];
        if (!Number.isFinite(value)) throw new RangeError(`Animation ${key} must be finite`);
        return [{ key, value }];
      });
      const stops: (() => void)[] = [];
      const pending: Promise<boolean>[] = [];
      try {
        for (const { key, value } of tracks) {
          active.get(key)?.();
          let resolveTrack!: (finished: boolean) => void;
          pending.push(
            new Promise((resolve) => {
              resolveTrack = resolve;
            })
          );
          let cancel = () => {};
          const finish = (finished: boolean) => {
            if (active.get(key) !== stop) return;
            active.delete(key);
            resolveTrack(finished);
          };
          const stop = () => {
            if (active.get(key) !== stop) return;
            finish(false);
            cancel();
          };
          active.set(key, stop);
          stops.push(stop);
          cancel = driverRef.current(key, value, config, finish);
        }
      } catch (error) {
        for (const stop of stops) stop();
        throw error;
      }
      return {
        finished: Promise.all(pending).then((results) => results.every(Boolean)),
        cancel() {
          for (const stop of stops) stop();
        }
      };
    },
    [active]
  );

  useImperativeHandle(
    ref,
    () => ({
      animate,
      signal: lifecycle.current!.signal,
      get reducedMotion() {
        return motionRef.current();
      },
      async measure() {
        const current = lifecycle.current;
        if (!current) return null;
        const bounds = await measureRef.current();
        return lifecycle.current === current ? bounds : null;
      }
    }),
    [animate]
  );
  const previousStyle = useRef(style);
  useLayoutEffect(() => {
    const previous = previousStyle.current;
    previousStyle.current = style;
    const cleanups = viewKeys.flatMap((key) => {
      const binding = style?.[key];
      if (binding === undefined) return [];
      const changed = binding !== previous?.[key];
      const update: Binding = (value) => {
        const timing = typeof value === 'number' ? withTiming(value, { duration: 0 }) : value;
        animate({ [key]: timing.to }, timing.options);
      };
      if (typeof binding === 'number') {
        if (changed) update(binding);
        return [];
      }
      if (changed) update(binding.value);
      return [binding.subscribe(update)];
    });
    return () => {
      for (const unsubscribe of cleanups) unsubscribe();
    };
  }, [animate, style]);
}
