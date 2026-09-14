import type { Animations, Clip, Easing, Keyframe } from '../types';

/** Normalised progress shaping. `hold` keeps the previous value until the next key. */
const ease = (t: number, easing: Easing): number => {
  switch (easing) {
    case 'hold':
      return 0;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'linear':
    default:
      return t;
  }
};

/**
 * Value of an animation track at `localUs` (measured from the clip's start).
 *
 * Returns `fallback` when the property isn't animated, so callers can treat
 * static and animated properties identically.
 */
export const evaluateTrack = (keys: Keyframe[] | undefined, localUs: number, fallback: number): number => {
  if (!keys || keys.length === 0) return fallback;
  if (keys.length === 1) return keys[0].value;

  // Keys are kept sorted on write, so a linear scan of the (small) list is fine.
  if (localUs <= keys[0].atUs) return keys[0].value;
  const last = keys[keys.length - 1];
  if (localUs >= last.atUs) return last.value;

  for (let i = 0; i < keys.length - 1; i++) {
    const from = keys[i];
    const to = keys[i + 1];
    if (localUs < from.atUs || localUs > to.atUs) continue;
    const span = to.atUs - from.atUs;
    if (span <= 0) return to.value;
    const progress = ease((localUs - from.atUs) / span, from.easing);
    return from.value + (to.value - from.value) * progress;
  }
  return fallback;
};

/** Reads a possibly-animated numeric property of a clip at a timeline instant. */
export const animatedValue = (clip: Clip, path: string, staticValue: number, timelineUs: number): number =>
  evaluateTrack(clip.animations[path], timelineUs - clip.startUs, staticValue);

export const hasTrack = (animations: Animations, path: string) => (animations[path]?.length ?? 0) > 0;

/** True when a key sits within half a frame of `localUs`. */
export const keyAt = (keys: Keyframe[] | undefined, localUs: number, toleranceUs: number): Keyframe | null =>
  keys?.find(key => Math.abs(key.atUs - localUs) <= toleranceUs) ?? null;

/**
 * Inserts or replaces a key, keeping the track sorted.
 *
 * Returns a new track — the store treats animations as immutable so undo
 * snapshots stay correct.
 */
export const upsertKey = (
  keys: Keyframe[] | undefined,
  atUs: number,
  value: number,
  toleranceUs: number,
  easing: Easing = 'ease-in-out'
): Keyframe[] => {
  const list = keys ? [...keys] : [];
  const existing = list.findIndex(key => Math.abs(key.atUs - atUs) <= toleranceUs);
  if (existing >= 0) {
    list[existing] = { ...list[existing], value };
    return list;
  }
  list.push({ atUs, value, easing });
  list.sort((a, b) => a.atUs - b.atUs);
  return list;
};

export const removeKeyAt = (keys: Keyframe[] | undefined, atUs: number, toleranceUs: number): Keyframe[] =>
  (keys ?? []).filter(key => Math.abs(key.atUs - atUs) > toleranceUs);

/**
 * Rescales every key when a clip's duration changes (a speed change or a
 * right-edge trim), so animation stays proportional to the clip.
 */
export const scaleAnimations = (animations: Animations, factor: number): Animations => {
  if (factor === 1) return animations;
  const next: Animations = {};
  for (const [path, keys] of Object.entries(animations)) {
    next[path] = keys.map(key => ({ ...key, atUs: Math.round(key.atUs * factor) }));
  }
  return next;
};

/**
 * Shifts keys when a clip's left edge moves, and drops those pushed outside.
 * A left trim changes what "local time zero" means, so keys must follow.
 */
export const shiftAnimations = (animations: Animations, deltaUs: number, newDurationUs: number): Animations => {
  const next: Animations = {};
  for (const [path, keys] of Object.entries(animations)) {
    const shifted = keys.map(key => ({ ...key, atUs: key.atUs - deltaUs })).filter(key => key.atUs >= 0 && key.atUs <= newDurationUs);
    if (shifted.length > 0) next[path] = shifted;
  }
  return next;
};

/** Splits animation tracks at `localUs` for the two halves of a cut. */
export const splitAnimations = (animations: Animations, localUs: number): { left: Animations; right: Animations } => {
  const left: Animations = {};
  const right: Animations = {};

  for (const [path, keys] of Object.entries(animations)) {
    const leftKeys = keys.filter(key => key.atUs <= localUs);
    const rightKeys = keys.filter(key => key.atUs > localUs).map(key => ({ ...key, atUs: key.atUs - localUs }));

    // Both halves get a key at the cut holding the interpolated value, so
    // neither jumps at the seam.
    const valueAtCut = evaluateTrack(keys, localUs, keys[0].value);
    if (leftKeys.length > 0 && leftKeys[leftKeys.length - 1].atUs < localUs) {
      leftKeys.push({ atUs: localUs, value: valueAtCut, easing: 'linear' });
    }
    if (rightKeys.length > 0 && rightKeys[0].atUs > 0) {
      rightKeys.unshift({ atUs: 0, value: valueAtCut, easing: 'linear' });
    }

    if (leftKeys.length > 0) left[path] = leftKeys;
    if (rightKeys.length > 0) right[path] = rightKeys;
  }

  return { left, right };
};

/** Every distinct key time in a clip, for drawing the timeline's keyframe row. */
export const allKeyTimes = (animations: Animations): number[] => {
  const times = new Set<number>();
  for (const keys of Object.values(animations)) {
    for (const key of keys) times.add(key.atUs);
  }
  return [...times].sort((a, b) => a - b);
};
