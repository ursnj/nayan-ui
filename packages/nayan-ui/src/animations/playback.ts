import { type AnimationViewRef, normalize, type ViewAnimationHandle, type ViewAnimationOptions, type ViewAnimationValues, viewKeys } from './view';

export type ViewAnimationTarget = Partial<ViewAnimationValues>;

export interface ViewAnimationStep extends ViewAnimationOptions {
  to: ViewAnimationTarget;
}

export interface ViewAnimationSequence {
  initial?: ViewAnimationTarget;
  steps: readonly ViewAnimationStep[];
}

export interface ViewPlaybackOptions extends Pick<ViewAnimationOptions, 'duration' | 'reduceMotion'> {
  delay?: number;
  /** Additional runs after the first. */
  repeat?: number | 'forever';
  /** Alternate direction on each repeat. */
  yoyo?: boolean;
}

export type AnimationViewTarget = AnimationViewRef | { readonly current: AnimationViewRef | null } | null;

export function resolveView(view: AnimationViewTarget): AnimationViewRef {
  const target = view && ('current' in view ? view.current : view);
  if (!target || target.signal.aborted) throw new Error('AnimationView must be mounted');
  return target;
}

const playing = new WeakMap<AnimationViewRef, ViewAnimationHandle>();

export function playSequence(view: AnimationViewRef, sequence: ViewAnimationSequence, options: ViewPlaybackOptions = {}): ViewAnimationHandle {
  const { delay = 0, repeat = 0, yoyo = false } = options;
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) throw new RangeError('Animation delay must be between 0 and 2147483647 ms');
  if (repeat !== 'forever' && (!Number.isSafeInteger(repeat) || repeat < 0)) throw new RangeError('Invalid animation repeat count');
  const group = normalize(options);
  const initial = sequence.initial;
  const keys = viewKeys.filter((key) => sequence.steps.some((step) => step.to[key] !== undefined));
  if (yoyo && keys.some((key) => initial?.[key] === undefined)) throw new Error('Yoyo sequences require an initial value for each animated property');
  const frames = [{ ...initial }];
  const steps = sequence.steps.map(({ to, ...config }) => {
    frames.push({ ...frames[frames.length - 1], ...to });
    return { to: { ...to }, config: normalize({ ...config, reduceMotion: options.reduceMotion ?? config.reduceMotion }) };
  });
  for (const frame of frames) {
    for (const key of viewKeys) {
      if (frame[key] !== undefined && !Number.isFinite(frame[key])) throw new RangeError(`Animation ${key} must be finite`);
    }
  }
  if (!steps.length) return view.animate({});
  const rest = yoyo && repeat !== 'forever' && repeat % 2 === 1 ? frames[0]! : frames.at(-1)!;
  const total = steps.reduce((sum, step) => sum + step.config.duration, 0);
  if (options.duration !== undefined && total > 0) {
    for (const { config } of steps) config.duration = (config.duration / total) * options.duration;
  }

  playing.get(view)?.cancel();
  let canceled = false;
  let current: ViewAnimationHandle | undefined;
  let releaseDelay: (() => void) | undefined;
  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        releaseDelay = undefined;
        resolve();
      }, ms);
      releaseDelay = () => {
        clearTimeout(timer);
        releaseDelay = undefined;
        resolve();
      };
    });
  }
  function stop() {
    canceled = true;
    current?.cancel();
    releaseDelay?.();
  }
  function reduced() {
    return group.reduceMotion === 'always' || (group.reduceMotion === 'system' && view.reducedMotion);
  }
  async function run() {
    if (reduced()) return view.animate(rest, { duration: 0 }).finished;
    if (delay) await wait(delay);
    if (canceled) return false;
    if (initial) view.animate(frames[0]!, { duration: 0 });
    const count = repeat === 'forever' ? Infinity : repeat + 1;
    for (let index = 0; index < count; index++) {
      if (canceled) return false;
      if (reduced()) return view.animate(rest, { duration: 0 }).finished;
      const start = Date.now();
      const reverse = yoyo && index % 2 === 1;
      if (index && !yoyo && initial) view.animate(frames[0]!, { duration: 0 });
      for (let i = 0; i < steps.length; i++) {
        if (canceled) return false;
        const segment = reverse ? steps.length - 1 - i : i;
        const step = steps[segment]!;
        const to = reverse
          ? Object.fromEntries(viewKeys.filter((key) => step.to[key] !== undefined).map((key) => [key, frames[segment]![key]]))
          : step.to;
        current = view.animate(to, step.config);
        if (!(await current.finished)) return false;
      }
      if (index + 1 < count && Date.now() - start < 16) await wait(16);
    }
    return !canceled;
  }
  view.signal.addEventListener('abort', stop, { once: true });
  const handle: ViewAnimationHandle = {
    finished: run().finally(() => {
      view.signal.removeEventListener('abort', stop);
      if (playing.get(view) === handle) playing.delete(view);
    }),
    cancel: stop
  };
  playing.set(view, handle);
  return handle;
}
