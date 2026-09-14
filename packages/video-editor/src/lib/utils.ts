import { US } from '../types';

let counter = 0;

export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/** `1:23.4` — the timeline ruler / playhead readout. */
export const formatTimecode = (us: number, showFrames = false, fps = 30) => {
  const total = Math.max(0, us) / US;
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (showFrames) {
    const frames = Math.floor((total % 1) * fps);
    return `${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}.${Math.floor((total % 1) * 10)}`;
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

/** Yields to the event loop so long encode/decode loops don't freeze the UI. */
export const nextTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));
