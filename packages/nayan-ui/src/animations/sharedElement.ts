import { type AnimationViewTarget, resolveView } from './playback';
import { type AnimationViewRef, normalize, type ViewAnimationHandle, type ViewAnimationOptions, type ViewBounds } from './view';

export type SharedElementSnapshot = Readonly<ViewBounds>;

function isVisibleBox(box: Readonly<ViewBounds> | null): box is Readonly<ViewBounds> {
  return !!box && [box.x, box.y, box.width, box.height].every(Number.isFinite) && box.width > 0 && box.height > 0;
}

/** Capture the source before updating the route or layout. */
export async function captureSharedElement(source: AnimationViewTarget): Promise<SharedElementSnapshot | null> {
  const bounds = await resolveView(source).measure();
  return isVisibleBox(bounds) ? { ...bounds } : null;
}

const measuring = new WeakMap<AnimationViewRef, symbol>();
const skipped = { finished: Promise.resolve(false), cancel() {} };

/** Move and resize the destination from the source's window coordinates to its own layout. */
export async function transitionSharedElement(
  source: SharedElementSnapshot | null,
  destination: AnimationViewTarget,
  options?: ViewAnimationOptions
): Promise<ViewAnimationHandle> {
  const config = normalize(options);
  const view = resolveView(destination);
  const layout = { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 };
  if (!config.duration || config.reduceMotion === 'always' || (config.reduceMotion === 'system' && view.reducedMotion)) {
    measuring.delete(view);
    return view.animate({ ...layout, opacity: 1 }, { duration: 0 });
  }
  const token = Symbol();
  measuring.set(view, token);
  let target: Readonly<ViewBounds> | null;
  try {
    view.animate({ ...layout, opacity: 0 }, { duration: 0 });
    target = await view.measure();
    if (view.signal.aborted || measuring.get(view) !== token) return skipped;
  } finally {
    if (measuring.get(view) === token) measuring.delete(view);
  }
  if (!isVisibleBox(target) || (config.reduceMotion === 'system' && view.reducedMotion)) {
    return view.animate({ opacity: 1 }, { duration: 0 });
  }
  if (!isVisibleBox(source)) return view.animate({ opacity: 1 }, config);
  view.animate(
    {
      opacity: 1,
      translateX: source.x + source.width / 2 - target.x - target.width / 2,
      translateY: source.y + source.height / 2 - target.y - target.height / 2,
      scaleX: source.width / target.width,
      scaleY: source.height / target.height
    },
    { duration: 0 }
  );
  return view.animate(layout, config);
}
