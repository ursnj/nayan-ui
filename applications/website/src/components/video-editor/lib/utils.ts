import { US } from "../types";

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const uid = (prefix: string): string => {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
};

/** Triggers a browser download of `blob` named `filename`. */
export const download = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Deferred so Safari/Firefox have started the download before the URL dies.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const precision = exponent === 0 ? 0 : value < 10 ? 2 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
};

const pad = (value: number, width = 2) => String(Math.trunc(value)).padStart(width, "0");

/** Compact MM:SS (or H:MM:SS past an hour) — a media-card or list duration badge. */
export const formatDuration = (durationUs: number): string => {
  const totalSeconds = Math.max(0, Math.round(durationUs / US));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

/**
 * Zero-padded timecode for the transport readout. `withFrames` appends the
 * frame within the current second (needs `fps`); without it this is just
 * MM:SS (or H:MM:SS past an hour).
 */
export const formatTimecode = (timeUs: number, withFrames = false, fps = 30): string => {
  const totalSeconds = Math.max(0, timeUs / US);
  const wholeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const base = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  if (!withFrames) return base;
  const safeFps = Math.max(1, fps);
  const frame = Math.min(safeFps - 1, Math.floor((totalSeconds - wholeSeconds) * safeFps));
  return `${base}:${pad(frame)}`;
};

/** "Nice" tick intervals (seconds) for the timeline ruler, coarsest to finest. */
const NICE_INTERVALS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

/** The smallest nice interval whose tick spacing at `pxPerSec` is still legible. */
export const pickTickInterval = (pxPerSec: number): number => {
  const targetPx = 90;
  if (pxPerSec <= 0) return NICE_INTERVALS[NICE_INTERVALS.length - 1];
  for (const interval of NICE_INTERVALS) {
    if (interval * pxPerSec >= targetPx) return interval;
  }
  return NICE_INTERVALS[NICE_INTERVALS.length - 1];
};
