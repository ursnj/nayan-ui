import { useEffect, useState } from "react";
import { clamp } from "../../lib/utils";
import { getAudioBuffer, getFilmstrip, getPeaks, requestFilmstrip } from "../../media/library";
import type { MediaClip } from "../../types";

/** Stable identity for "no strip", so a clip body isn't handed a new array each render. */
const NO_FRAMES: string[] = [];

/** Settle time before a strip is requested: every pointer move during a trim would otherwise queue a decode. */
const DEBOUNCE_MS = 220;

const MAX_RETRY_MS = 1500;

const MIN_TILE_CSS = 24;
const MAX_TILE_CSS = 480;

const MAX_DECODED_FRAMES = 24;

/** Tile resolution in device pixels, on a coarse ladder: a flat 160px is soft at 2x and blurry once tiles grow. */
const TILE_STEP = 64;
const MIN_TILE_PX = 96;
const MAX_TILE_PX = 384;

const tileResolution = (tileCssWidth: number) => {
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
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

export const useFilmstrip = (
  clip: MediaClip,
  widthPx: number,
  rowHeightPx: number,
  aspect: number,
): ClipFilmstrip => {
  const wanted = clip.kind === "video";
  const tileWidth = clamp(Math.round(rowHeightPx * aspect), MIN_TILE_CSS, MAX_TILE_CSS);
  const tileCount = Math.max(1, Math.ceil(widthPx / tileWidth));
  const count = Math.min(tileCount, MAX_DECODED_FRAMES);
  const tilePx = tileResolution(tileWidth);
  const sourceEndUs = clip.inUs + clip.durationUs * clip.speed;
  const key = `${clip.assetId}:${Math.round(clip.inUs)}:${Math.round(sourceEndUs)}:${count}:${tilePx}`;

  const [generated, setGenerated] = useState<{ key: string; frames: string[] } | null>(null);
  /** Counts dropped jobs for the current request, so retries can back off. */
  const [retry, setRetry] = useState<{ key: string; attempt: number }>({ key, attempt: 0 });
  const attempt = retry.key === key ? retry.attempt : 0;
  const cached = getFilmstrip(key);
  const frames = cached ?? (generated?.key === key ? generated.frames : NO_FRAMES);

  useEffect(() => {
    if (!wanted || cached) return;

    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        const strip = await requestFilmstrip(
          { key, assetId: clip.assetId, fromUs: clip.inUs, toUs: sourceEndUs, count, tilePx },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (strip === null) setRetry({ key, attempt: attempt + 1 });
        else if (strip.length > 0) setGenerated({ key, frames: strip });
      },
      Math.min(DEBOUNCE_MS * (attempt + 1), MAX_RETRY_MS),
    );

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [key, cached, wanted, attempt, clip.assetId, clip.inUs, sourceEndUs, count, tilePx]);

  return { frames, tileWidth, tileCount };
};

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
