// Rendering quality: how many pixels are drawn and how much each costs. Phones' GPUs are mostly
// limited by fill rate, so resolution and anti-aliasing matter most, then shadows.

export type RenderQuality = 'high' | 'medium' | 'low' | 'lowest';

/** `"auto"` starts at "high" and steps down only while the device really can't keep up. */
export type RenderQualitySetting = RenderQuality | 'auto';

export type QualityLevel = {
  /** Most device pixels drawn per point (the screen's own ratio when lower). */
  maxPixelRatio: number;
  /** MSAA samples: 4 or 1 (off). */
  samples: 1 | 4;
  /**
   * Smooths edges after drawing (FXAA), in the pass that stretches a reduced scene to the screen (so
   * only with `maxPixels`): there it costs a few texture reads per pixel. At full resolution it would
   * need that whole extra pass, which costs a tile-based phone GPU more than 4x MSAA. The overlay (HUD
   * text) is drawn after it, untouched.
   */
  fxaa?: boolean;
  /** Whether shadows are drawn at all (a scene's light may still turn them off). */
  shadows: boolean;
  /** Shadow map width and height in texels. */
  shadowSize: number;
  /** 3x3 filtered (soft) shadow edges, or a single tap (hard). */
  softShadows: boolean;
  /**
   * Most device pixels drawn per frame, whatever the screen's ratio: a cap on the pixel ratio alone
   * leaves a low-density tablet (1.75x on 1200x2000) drawing its full resolution even at "lowest".
   */
  maxPixels?: number;
};

/** From best looking to cheapest; "auto" walks down this list only as far as it must. */
export const QUALITIES: readonly RenderQuality[] = ['high', 'medium', 'low', 'lowest'];

export const QUALITY_LEVELS: Record<RenderQuality, QualityLevel> = {
  // Ordered by what each step costs the eye. Shadows always use a full-resolution map: a low-resolution
  // map's soft, smeared edges look worse than no shadow. "medium" keeps them with crisp single-tap
  // edges (cheaper than the 3x3 filter); "low" drops the shadow pass entirely (which also saves its
  // GPU time) and anti-aliasing; only the last resort draws fewer pixels, since anything below the screen's own resolution is stretched up and looks
  // soft (text most of all). Fill rate dominates a low-end GPU: an Adreno 610 tablet drew 2.4 MP in
  // 42 ms and 0.78 MP in 21 ms (23 -> 41 fps).
  high: { maxPixelRatio: 3, samples: 4, shadows: true, shadowSize: 2048, softShadows: true },
  medium: { maxPixelRatio: 3, samples: 4, shadows: true, shadowSize: 2048, softShadows: false },
  low: { maxPixelRatio: 3, samples: 1, shadows: false, shadowSize: 2048, softShadows: true },
  lowest: { maxPixelRatio: 2, samples: 1, fxaa: true, shadows: false, shadowSize: 2048, softShadows: true, maxPixels: 800_000 }
};

/**
 * What "auto" walks through, from best to cheapest: a level, and the most pixels its 3D scene is drawn
 * with. Before giving up an effect it draws the scene a little smaller, as native games scale their
 * resolution: stretched over the screen under the full-resolution HUD, 1.5 MP (0.8x a 1200x2000
 * tablet) can't be told from the screen's own resolution and 1.1 MP barely, while every effect stays.
 * On the Adreno 610 tablet that took Crossy Road from 47 to 60 fps and Whack a Mole from 53 to 59 at
 * "high": a tile-based GPU's cost under 4x MSAA grows with pixels times the triangles in each tile.
 */
export type QualityStep = { quality: RenderQuality; maxPixels?: number };
export const AUTO_STEPS: readonly QualityStep[] = [
  { quality: 'high' },
  { quality: 'high', maxPixels: 1_500_000 },
  { quality: 'high', maxPixels: 1_100_000 },
  { quality: 'medium', maxPixels: 1_100_000 },
  { quality: 'low', maxPixels: 1_100_000 },
  { quality: 'lowest' }
];

/** A step's level: its quality's, with the step's pixel budget when that is smaller. */
export function stepLevel(step: QualityStep): QualityLevel {
  const level = QUALITY_LEVELS[step.quality];
  if (!step.maxPixels || (level.maxPixels && level.maxPixels <= step.maxPixels)) return level;
  return { ...level, maxPixels: step.maxPixels };
}

/**
 * A typical frame slower than this (under ~54 fps) is a frame the device can't hold: on a 60 Hz screen
 * that is a visible stutter, and the first steps down cost only a little resolution.
 */
const SLOW_FRAME_MS = 18.5;
/** Under ~33 fps the game is plainly struggling: one such second is enough to step down. */
const VERY_SLOW_FRAME_MS = 30;
/** A typical frame this quick (60 fps with room to spare) is one it holds comfortably. */
const FAST_FRAME_MS = 17.4;
/** Only a slow second spent mostly drawing is the GPU's fault (a slow game loop isn't helped by drawing less). */
const RENDER_SHARE = 0.6;
/** Ignore start-up (loading, shader compiles) and the moments after a change. */
const STARTUP_MS = 2500;
const SETTLE_MS = 1500;
/** Consecutive slow seconds before stepping down (one when very slow), and smooth seconds before trying a step back up. */
const SLOW_SECONDS = 3;
const VERY_SLOW_SECONDS = 1;
const FAST_SECONDS = 10;
/**
 * Seconds with the GPU drawing in at most this share of a 60 Hz frame: plenty of headroom (a light
 * board game on a level below what it can hold, e.g. one remembered from a heavier version), so step
 * up after only `HEADROOM_SECONDS` instead of FAST_SECONDS. These needn't be smooth: a frame now and
 * then that the game loop (not drawing) drops can't be helped by a lower level, and would otherwise keep
 * a game that draws in a few milliseconds at 57 fps on its remembered level for good.
 */
const HEADROOM_RENDER_MS = 10;
const HEADROOM_SECONDS = 2;
/** Stepping down again this soon after a step up means that level is too much: never return to it. */
const RELAPSE_MS = 20_000;

/** The pixel ratio a level draws a `width` x `height` point view at, on a screen of ratio `screen`. */
export function levelPixelRatio(level: QualityLevel, screen: number, width: number, height: number): number {
  const ratio = Math.min(screen, level.maxPixelRatio);
  const area = width * height;
  if (!level.maxPixels || area <= 0) return ratio;
  return Math.min(ratio, Math.sqrt(level.maxPixels / area));
}

/** Durable records (the engine's Rust store); absent on builds without it, which then remember per session. */
export type QualityStore = {
  cacheRead?: (key: string) => ArrayBuffer;
  cacheWrite?: (key: string, bytes: ArrayBuffer) => boolean;
};

// Steps of AUTO_STEPS (the older `quality:` records held a level's index).
const storeKey = (key: string) => `quality-step:${key}`;

/**
 * The step (of AUTO_STEPS) "auto" settled on per `qualityKey` (e.g. a game's id), kept in `store`
 * across app launches: every visit of the same game starts there instead of spending its first seconds
 * at "high" on a device that can't hold it (it still steps back up after smooth seconds).
 */
const settled = new Map<string, number>();
export function settledQuality(key: string | undefined, store?: QualityStore): number | undefined {
  if (!key) return undefined;
  const known = settled.get(key);
  if (known !== undefined || typeof store?.cacheRead !== 'function') return known;
  try {
    const bytes = new Uint8Array(store.cacheRead(storeKey(key)));
    const step = bytes.length === 1 && bytes[0]! < AUTO_STEPS.length ? bytes[0]! : undefined;
    if (step !== undefined) settled.set(key, step);
    return step;
  } catch {
    return undefined;
  }
}
/** Records the step for `key`, writing it to `store` only when it changes. */
export function rememberQuality(key: string | undefined, step: number, store?: QualityStore) {
  if (!key || settledQuality(key, store) === step) return;
  settled.set(key, step);
  try {
    store?.cacheWrite?.(storeKey(key), new Uint8Array([step]).buffer);
  } catch {
    // Remembered for this session; the next launch starts from the stored (or default) step.
  }
}

/** One second of frames, as the frame loop measured it. */
export type FrameReport = {
  /** The typical (median) time between frames, in ms: hiccups (garbage collection, a busy JS frame) don't move it. */
  frameMs: number;
  /** The typical (median) time spent drawing a frame, in ms (including any wait for the screen). */
  renderMs: number;
};

/**
 * Picks the step (of AUTO_STEPS) for "auto": starts at the best, steps down one after `SLOW_SECONDS`
 * consecutive seconds whose typical frame misses ~50 fps while drawing took most of it (after a
 * single second when it misses ~33 fps, so a struggling phone recovers in seconds rather than
 * stuttering through every level), and steps back up after `FAST_SECONDS` smooth seconds (`HEADROOM_SECONDS` when
 * the GPU has plenty of time to spare). A level that fails again soon after being restored
 * becomes the ceiling, so it never bounces.
 */
export class AutoQuality {
  private index = 0;
  /** The best level it may return to (raised past a level that keeps failing). */
  private ceiling = 0;
  private started = 0;
  private changed = 0;
  private raisedAt = -Infinity;
  private slow = 0;
  private verySlow = 0;
  private fast = 0;
  private headroom = 0;

  /** `start`: the step to begin at (one remembered from an earlier visit), or a quality's first step. */
  constructor(start: number | RenderQuality = 0) {
    const index = typeof start === 'number' ? Math.floor(start) : AUTO_STEPS.findIndex((s) => s.quality === start);
    this.index = Math.min(Math.max(0, index), AUTO_STEPS.length - 1);
  }

  /** The current step's index in AUTO_STEPS. */
  get step(): number {
    return this.index;
  }

  get quality(): RenderQuality {
    return AUTO_STEPS[this.index]!.quality;
  }

  /** What to draw with: the step's level and pixel budget. */
  get level(): QualityLevel {
    return stepLevel(AUTO_STEPS[this.index]!);
  }

  /** Feeds one second of frames; returns true when the level changed. */
  report(now: number, frames: FrameReport): boolean {
    if (!this.started) this.started = this.changed = now;
    if (now - this.started < STARTUP_MS || now - this.changed < SETTLE_MS) return false;
    const gpuBound = frames.frameMs > SLOW_FRAME_MS && frames.renderMs > frames.frameMs * RENDER_SHARE;
    const smooth = frames.frameMs <= FAST_FRAME_MS;
    this.slow = gpuBound ? this.slow + 1 : 0;
    this.verySlow = gpuBound && frames.frameMs > VERY_SLOW_FRAME_MS ? this.verySlow + 1 : 0;
    this.fast = smooth ? this.fast + 1 : 0;
    this.headroom = !gpuBound && frames.renderMs <= HEADROOM_RENDER_MS ? this.headroom + 1 : 0;

    if ((this.slow >= SLOW_SECONDS || this.verySlow >= VERY_SLOW_SECONDS) && this.index < AUTO_STEPS.length - 1) {
      // Failing again right after being restored: this level is too much for the device
      if (now - this.raisedAt < RELAPSE_MS) this.ceiling = Math.max(this.ceiling, this.index + 1);
      this.index++;
      return this.moved(now);
    }
    if ((this.fast >= FAST_SECONDS || this.headroom >= HEADROOM_SECONDS) && this.index > this.ceiling) {
      this.index--;
      this.raisedAt = now;
      return this.moved(now);
    }
    return false;
  }

  /**
   * Frames that don't count (a results card over the game): forgets the streaks and, once frames
   * count again, waits `SETTLE_MS` before judging, as after a change of level.
   */
  hold(now: number) {
    if (!this.started) this.started = now;
    this.changed = now;
    this.slow = 0;
    this.verySlow = 0;
    this.fast = 0;
    this.headroom = 0;
  }

  private moved(now: number): true {
    this.changed = now;
    this.slow = 0;
    this.verySlow = 0;
    this.fast = 0;
    this.headroom = 0;
    return true;
  }
}

/** The middle value of `values` (sorted in place). */
export function median(values: number[]): number {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  const mid = values.length >> 1;
  return values.length % 2 ? values[mid]! : (values[mid - 1]! + values[mid]!) / 2;
}
