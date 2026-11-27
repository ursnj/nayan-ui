export type VideoSource = string | { uri: string; mimeType?: string };
export type VideoContentFit = 'contain' | 'cover' | 'fill';
export type VideoStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

export interface VideoProgress {
  currentTime: number;
  /** Seconds, or null before the duration is known and for live streams. */
  duration: number | null;
}

export interface VideoPlayerHandle {
  play(): void;
  pause(): void;
  /** Seek to a nonnegative position in seconds. */
  seek(seconds: number): void;
}

export interface VideoOptions {
  /** Show the platform's playback controls. Defaults to true. */
  controls?: boolean;
  /** Start a new source automatically when the platform allows it. Defaults to false. */
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  /** Volume from 0 to 1 where supported. Defaults to 1. */
  volume?: number;
  /** Playback speed multiplier from 0.25 to 4. Defaults to 1. */
  playbackRate?: number;
  contentFit?: VideoContentFit;
  accessibilityLabel?: string;
  testID?: string;
  onStatusChange?: (status: VideoStatus) => void;
  onProgress?: (progress: VideoProgress) => void;
  onError?: (error: Error) => void;
}
