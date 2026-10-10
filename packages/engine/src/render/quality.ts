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
  high: { maxPixelRatio: 3, samples: 4, shadowSize: 2048, softShadows: true },
  medium: { maxPixelRatio: 2, samples: 4, shadowSize: 1024, softShadows: true },
  low: { maxPixelRatio: 1.5, samples: 1, shadowSize: 1024, softShadows: false },
  lowest: { maxPixelRatio: 1, samples: 1, shadowSize: 512, softShadows: false },
};

const SLOW_FRAME_MS = 1000 / 52; // a mean frame slower than this misses 60 fps
const SETTLE_MS = 1500; // ignore start-up (loading, shader compiles) and the frames after a change
const SLOW_SECONDS = 2; // consecutive slow seconds before stepping down

/**
 * Picks the level for "auto": steps down one level after `SLOW_SECONDS` consecutive seconds whose
 * mean frame time misses 60 fps. Never steps back up: without GPU timings it would bounce.
 */
export class AutoQuality {
  private index = QUALITIES.indexOf("medium");
  private since = 0;
  private slow = 0;

  get quality(): Quality {
    return QUALITIES[this.index]!;
  }

  /** Feeds one second of frames; returns true when the level changed. */
  report(now: number, meanFrameMs: number): boolean {
    if (!this.since) this.since = now;
    if (now - this.since < SETTLE_MS) return false;
    this.slow = meanFrameMs > SLOW_FRAME_MS ? this.slow + 1 : 0;
    if (this.slow < SLOW_SECONDS || this.index === QUALITIES.length - 1) return false;
    this.index++;
    this.slow = 0;
    this.since = now;
    return true;
  }
}
