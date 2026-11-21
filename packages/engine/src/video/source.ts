import type { VideoSource } from './types';

export function resolveVideoSource(source: VideoSource | undefined): { uri: string; mimeType?: string } {
  const media = typeof source === 'string' ? { uri: source } : source;
  if (typeof media?.uri !== 'string' || !media.uri.trim()) throw new TypeError('Video source requires a URI');
  return media;
}

export function seekTime(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Video seek time must be a finite, nonnegative number of seconds');
  return seconds;
}

export function validatePlayback(volume: number, rate: number): void {
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new RangeError('Video volume must be between 0 and 1');
  if (!Number.isFinite(rate) || rate < 0.25 || rate > 4) throw new RangeError('Video playbackRate must be between 0.25 and 4');
}
