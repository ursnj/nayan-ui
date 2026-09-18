import { useEffect, useState } from 'react';
import { clamp } from '../../lib/utils';
import { getAudioBuffer, getFilmstrip, getPeaks, requestFilmstrip } from '../../media/library';
import type { MediaClip } from '../../types';

/** Stable identity for "no strip", so a clip body isn't handed a new array each render. */
const NO_FRAMES: string[] = [];

/**
 * How long the clip has to hold still before a strip is asked for.
 *
 * A trim handle or a zoom gesture changes the request on every pointer move,
 * and each of those would otherwise be a decode. Nothing is queued until the
 * gesture settles.
 */
const DEBOUNCE_MS = 220;

/**
 * Ceiling on the wait before re-asking for a strip that was dropped.
 *
 * Every clip on a busy timeline can be dropped at once — that is what the
 * queue depth is for — and they would all then re-ask on the same beat,
 * forever. Backing off per attempt lets the queue actually empty, and the
 * count resets the moment the clip asks for something different.
 */
const MAX_RETRY_MS = 1500;

/**
 * Narrowest and widest a tile may be, in CSS pixels.
 *
 * A tile is as wide as its frame is at row height, so the bounds only bite at
 * the extremes: a 9:16 phone video on a short row, an ultra-wide one on a tall
 * row. Past them the aspect gives way rather than the layout.
 */
const MIN_TILE_CSS = 24;
const MAX_TILE_CSS = 480;

/**
 * Most frames one clip will ever decode.
 *
 * A clip wide enough to want more repeats the nearest frame it has instead.
 * Twenty-four stills is already a picture of what the clip contains, and the
 * budget is what stops a zoomed-in timeline asking for hundreds.
 */
const MAX_DECODED_FRAMES = 24;

/*
 * Tile resolution, in device pixels, on a coarse ladder.
 *
 * It used to be a flat 160px however wide the tile was drawn. On a 2x display
 * that is soft at the ordinary size and openly blurry once the tile count hits
 * its ceiling and the tiles start growing — a long clip drew 160px stills
 * across boxes twice that wide. Rounding up to a step keeps a nudge of the
 * zoom from invalidating every strip on the timeline.
 */
const TILE_STEP = 64;
const MIN_TILE_PX = 96;
const MAX_TILE_PX = 384;

const tileResolution = (tileCssWidth: number) => {
  const dpr = typeof window === 'undefined' ? 1 : Math.min(2, window.devicePixelRatio || 1);
  return clamp(Math.ceil((tileCssWidth * dpr) / TILE_STEP) * TILE_STEP, MIN_TILE_PX, MAX_TILE_PX);
};

export interface ClipFilmstrip {
  /** Decoded stills, evenly spaced across the clip. Empty until they arrive. */
  frames: string[];
  /** Width of one tile, in CSS pixels: the frame's own width at row height. */
  tileWidth: number;
  /** Tiles needed to run the strip the length of the clip. */
  tileCount: number;
}

/**
 * Evenly spaced stills across the clip's visible source range.
 *
 * The geometry is the point, so it is worked out here rather than left to the
 * clip body. A tile is exactly as wide as its frame is when scaled to the row
 * height, and the tiles are laid end to end — so a frame is never cropped and
 * never stretched, which is what a filmstrip is.
 *
 * Sizing them any other way is what made these unreadable. Dividing the clip
 * into a fixed number of equal boxes and cover-fitting each one meant the box
 * almost never matched the frame's shape: on a tall row a 16:9 still was
 * scaled until its height fit a box a fifth as wide, so three quarters of the
 * picture was cropped away and what was left looked like a blown-up sliver.
 *
 * Only video asks for stills. A still image has nothing to walk through — its
 * poster frame, decoded once at import, is the whole picture — and re-encoding
 * that same poster into two dozen tiles per clip was pure cost.
 */
export const useFilmstrip = (clip: MediaClip, widthPx: number, rowHeightPx: number, aspect: number): ClipFilmstrip => {
  const wanted = clip.kind === 'video';
  const tileWidth = clamp(Math.round(rowHeightPx * aspect), MIN_TILE_CSS, MAX_TILE_CSS);
  const tileCount = Math.max(1, Math.ceil(widthPx / tileWidth));
  // Beyond the budget the tiles repeat the nearest frame rather than the clip
  // asking for one decode per tile.
  const count = Math.min(tileCount, MAX_DECODED_FRAMES);
  const tilePx = tileResolution(tileWidth);
  const sourceEndUs = clip.inUs + clip.durationUs * clip.speed;
  const key = `${clip.assetId}:${Math.round(clip.inUs)}:${Math.round(sourceEndUs)}:${count}:${tilePx}`;

  // Read the cache during render rather than syncing it into state in an
  // effect: a cache hit then paints on the first render with no extra pass.
  const [generated, setGenerated] = useState<{ key: string; frames: string[] } | null>(null);
  /** Counts dropped jobs for the current request, so retries can back off. */
  const [retry, setRetry] = useState<{ key: string; attempt: number }>({ key, attempt: 0 });
  const attempt = retry.key === key ? retry.attempt : 0;
  const cached = getFilmstrip(key);
  const frames = cached ?? (generated?.key === key ? generated.frames : NO_FRAMES);

  useEffect(() => {
    if (!wanted || cached) return;

    // Aborting is how the scheduler learns nobody wants this any more — it
    // drops the job if it is still queued, and stops it between frames if it
    // is already decoding.
    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        const strip = await requestFilmstrip({ key, assetId: clip.assetId, fromUs: clip.inUs, toUs: sourceEndUs, count, tilePx }, controller.signal);
        if (controller.signal.aborted) return;
        // Null means the job was abandoned rather than answered. Asking again
        // is the difference between a strip arriving late and a clip that
        // stays bare for the rest of the session.
        if (strip === null) setRetry({ key, attempt: attempt + 1 });
        else if (strip.length > 0) setGenerated({ key, frames: strip });
      },
      Math.min(DEBOUNCE_MS * (attempt + 1), MAX_RETRY_MS)
    );

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [key, cached, wanted, attempt, clip.assetId, clip.inUs, sourceEndUs, count, tilePx]);

  return { frames, tileWidth, tileCount };
};

/**
 * Peak data for the waveform. Decoding the whole track is what makes gapless
 * preview playback possible too, so this shares the library's cache rather than
 * decoding a second time.
 */
export const useWaveform = (assetId: string, enabled: boolean): Float32Array | null => {
  const [peaks, setPeaks] = useState<Float32Array | null>(() => getPeaks(assetId));

  useEffect(() => {
    if (!enabled || peaks) return;
    let cancelled = false;
    void (async () => {
      await getAudioBuffer(assetId);
      if (!cancelled) setPeaks(getPeaks(assetId));
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId, enabled, peaks]);

  return peaks;
};
