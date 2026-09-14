import { US } from '../types';

let counter = 0;

export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/** `1:23.4` — the timeline ruler / playhead readout. */
/**
 * `mm:ss:ff` with frames, `mm:ss.t` without.
 *
 * The frame number is derived from a whole-frame count rather than from the
 * fractional second. Doing it the other way — `floor((us / US % 1) * fps)` —
 * reads a frame low wherever the stored microseconds fall just short of the
 * true boundary, which is most of them: frame 2 at 24fps is 83333µs, and
 * `0.083333 * 24` is `1.999992`, so it displayed frame 1. At 24fps that was
 * roughly every third frame, and it meant the readout did not name the frame
 * the playhead was actually on.
 *
 * The epsilon absorbs that rounding. It is a ten-thousandth of a frame — a
 * few microseconds — so it can only affect an instant already indivisibly
 * close to the boundary.
 */
export const formatTimecode = (us: number, showFrames = false, fps = 30) => {
  const pad = (n: number) => String(n).padStart(2, '0');

  if (showFrames) {
    const rate = Math.max(1, fps);
    const totalFrames = Math.floor(Math.max(0, us / US) * rate + 1e-4);
    const seconds = Math.floor(totalFrames / rate);
    return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}:${pad(totalFrames % rate)}`;
  }

  const total = Math.max(0, us) / US;
  return `${pad(Math.floor(total / 60))}:${pad(Math.floor(total % 60))}.${Math.min(9, Math.floor((total % 1) * 10 + 1e-4))}`;
};

export const formatDuration = (us: number) => {
  const total = Math.max(0, us) / US;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${Math.floor(total % 60)}s`;
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

/** Ruler tick spacing that stays legible as the timeline zooms. */
export const pickTickInterval = (pxPerSec: number) => {
  const candidates = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  return candidates.find(c => c * pxPerSec >= 70) ?? candidates[candidates.length - 1];
};

export const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before dropping the URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
