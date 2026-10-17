// Rendering quality: how many pixels are drawn and how much each costs. Phones' GPUs are mostly
// limited by fill rate, so resolution and anti-aliasing matter most, then shadow quality.

export type Quality = "high" | "medium" | "low" | "lowest";

/** `"auto"` starts at "medium" and steps down while frames take longer than 60 fps allows. */
export type QualitySetting = Quality | "auto";

export type QualityLevel = {
  /** Most device pixels drawn per point (the screen's own ratio when lower). */
  maxPixelRatio: number;
  /** MSAA samples: 4 or 1 (off). */
  samples: 1 | 4;
  /** Shadow map width and height in texels. */
  shadowSize: number;
  /** 3x3 filtered (soft) shadow edges, or a single tap (hard). */
  softShadows: boolean;
};

/** From best looking to cheapest; "auto" walks down this list. */
export const QUALITIES: readonly Quality[] = ["high", "medium", "low", "lowest"];

export const QUALITY_LEVELS: Record<Quality, QualityLevel> = {
  // Anything drawn below the screen's own resolution is stretched up and looks soft (text most of all),
  // so every level draws sharp, and cheaper levels save on anti-aliasing and shadows instead. Only
  // "lowest" trades pixels, and only when chosen explicitly: "auto" stops at "low".
  high: { maxPixelRatio: 3, samples: 4, shadowSize: 2048, softShadows: true },
  medium: { maxPixelRatio: 3, samples: 4, shadowSize: 1024, softShadows: true },
  low: { maxPixelRatio: 3, samples: 1, shadowSize: 1024, softShadows: false },
  lowest: { maxPixelRatio: 2, samples: 1, shadowSize: 512, softShadows: false },
};

const SLOW_FRAME_MS = 1000 / 52; // a mean frame slower than this misses 60 fps
const SETTLE_MS = 1500; // ignore start-up (loading, shader compiles) and the frames after a change
const SLOW_SECONDS = 2; // consecutive slow seconds before stepping down
// Only a slow second spent mostly drawing is the GPU's fault; a slow game loop (JS) isn't helped by
// drawing fewer pixels, so it never costs sharpness.
const RENDER_SHARE = 0.5;
const AUTO_FLOOR = QUALITIES.indexOf("low");

/**
 * Picks the level for "auto": steps down one level after `SLOW_SECONDS` consecutive seconds whose
 * mean frame time misses 60 fps while drawing took most of it. Never steps back up: without GPU
 * timings it would bounce.
 */
export class AutoQuality {
  private index = QUALITIES.indexOf("medium");
  private since = 0;
  private slow = 0;

  get quality(): Quality {
    return QUALITIES[this.index]!;
  }

  /** Feeds one second of frames; returns true when the level changed. */
  report(now: number, meanFrameMs: number, meanRenderMs: number): boolean {
    if (!this.since) this.since = now;
    if (now - this.since < SETTLE_MS) return false;
    const gpuBound = meanFrameMs > SLOW_FRAME_MS && meanRenderMs > meanFrameMs * RENDER_SHARE;
    this.slow = gpuBound ? this.slow + 1 : 0;
    if (this.slow < SLOW_SECONDS || this.index >= AUTO_FLOOR) return false;
    this.index++;
    this.slow = 0;
    this.since = now;
    return true;
  }
}
