import { useEffect, useState } from 'react';
import { clamp } from '../../lib/utils';
import { generateFilmstrip, getAudioBuffer, getPeaks } from '../../media/library';
import type { MediaClip } from '../../types';

/** Filmstrips are expensive to build, so keep them across mounts and re-renders. */
const filmstripCache = new Map<string, string[]>();

/**
 * Evenly spaced stills across the clip's visible source range.
 *
 * Generation is debounced and the frame count is bucketed, so dragging a trim
 * handle or nudging the zoom doesn't kick off a decode on every pointer move.
 */
export const useFilmstrip = (clip: MediaClip, widthPx: number): string[] => {
  const count = clamp(Math.round(widthPx / 72), 1, 24);
  const sourceEndUs = clip.inUs + clip.durationUs * clip.speed;
  const key = `${clip.assetId}:${Math.round(clip.inUs)}:${Math.round(sourceEndUs)}:${count}`;

  // Read the cache during render rather than syncing it into state in an
  // effect: a cache hit then paints on the first render with no extra pass.
  const [generated, setGenerated] = useState<{ key: string; frames: string[] } | null>(null);
  const cached = filmstripCache.get(key);
  const frames = cached ?? (generated?.key === key ? generated.frames : []);

  useEffect(() => {
    if (cached || clip.kind === 'audio') return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const strip = await generateFilmstrip(clip.assetId, clip.inUs, sourceEndUs, count);
      if (cancelled || strip.length === 0) return;
      filmstripCache.set(key, strip);
      setGenerated({ key, frames: strip });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, cached, clip.assetId, clip.inUs, clip.kind, sourceEndUs, count]);

  return frames;
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
    void getAudioBuffer(assetId).then(() => {
      if (!cancelled) setPeaks(getPeaks(assetId));
    });
    return () => {
      cancelled = true;
    };
  }, [assetId, enabled, peaks]);

  return peaks;
};
