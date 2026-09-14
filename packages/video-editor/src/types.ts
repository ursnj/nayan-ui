/**
 * Domain model for the editor.
 *
 * All times are in microseconds (µs) — the unit WebCodecs uses for
 * `VideoFrame.timestamp` / `EncodedVideoChunk.timestamp`, so keeping the whole
 * model in µs avoids a class of rounding bugs at the encode boundary.
 */

export const US = 1_000_000;

export type AssetKind = 'video' | 'audio' | 'image';

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  name: string;
  /** Bytes, for display only. */
  size: number;
  /** Object URL of the original file. Revoked when the asset is removed. */
  url: string;
  durationUs: number;
  width: number;
  height: number;
  hasVideo: boolean;
  hasAudio: boolean;
  fps: number;
  /** Data URL of a poster frame, or null while still generating. */
  thumbnail: string | null;
  /**
   * True when the file could be demuxed and decoded through WebCodecs. False
   * means we fall back to an HTMLVideoElement for rendering (slower, but keeps
   * formats like WebM usable).
   */
  webCodecs: boolean;
}

export interface Transform {
  /** Offset from centre, as a fraction of project width/height. */
  x: number;
  y: number;
  scale: number;
  /** Degrees. */
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  /** Pixels, at project resolution. */
  blur: number;
  hueRotate: number;
  grayscale: number;
  sepia: number;
}

export type ClipKind = 'video' | 'audio' | 'image' | 'text';

interface ClipCommon {
  id: string;
  trackId: string;
  name: string;
  /** Position on the timeline. */
  startUs: number;
  /** Length on the timeline (already accounts for `speed`). */
  durationUs: number;
  opacity: number;
  fadeInUs: number;
  fadeOutUs: number;
}

export interface MediaClip extends ClipCommon {
  kind: 'video' | 'audio' | 'image';
  assetId: string;
  /** In-point within the source asset. */
  inUs: number;
  /** Playback rate. Source consumed = durationUs * speed. */
  speed: number;
  volume: number;
  muted: boolean;
  transform: Transform;
  filters: Filters;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextClip extends ClipCommon {
  kind: 'text';
  text: string;
  fontFamily: string;
  /** Fraction of project height, so text scales with export resolution. */
  fontSize: number;
  color: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  /** Position of the text box centre, as a fraction of project width/height. */
  x: number;
  y: number;
}

export type Clip = MediaClip | TextClip;

export type TrackKind = 'video' | 'audio';

export interface Track {
  id: string;
  kind: TrackKind;
  name: string;
  muted: boolean;
  hidden: boolean;
  locked: boolean;
}

export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
}

export interface ExportSettings {
  width: number;
  height: number;
  fps: number;
  /** Video bitrate in bits per second. */
  bitrate: number;
  audioBitrate: number;
  includeAudio: boolean;
}

export const isMediaClip = (clip: Clip): clip is MediaClip => clip.kind !== 'text';
export const isTextClip = (clip: Clip): clip is TextClip => clip.kind === 'text';

/** Clips that put pixels on screen. */
export const isVisualClip = (clip: Clip) => clip.kind !== 'audio';

export const clipEndUs = (clip: Clip) => clip.startUs + clip.durationUs;

/**
 * Maps a timeline instant onto a position inside the clip's source asset.
 * Returns null when the instant lies outside the clip.
 */
export const sourceTimeUs = (clip: MediaClip, timelineUs: number): number | null => {
  if (timelineUs < clip.startUs || timelineUs >= clipEndUs(clip)) return null;
  return clip.inUs + (timelineUs - clip.startUs) * clip.speed;
};

export const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 1, rotation: 0, flipH: false, flipV: false };

export const DEFAULT_FILTERS: Filters = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  blur: 0,
  hueRotate: 0,
  grayscale: 0,
  sepia: 0
};

export const FILTER_PRESETS: { name: string; filters: Filters }[] = [
  { name: 'None', filters: DEFAULT_FILTERS },
  { name: 'Vivid', filters: { ...DEFAULT_FILTERS, saturation: 1.5, contrast: 1.15 } },
  { name: 'Warm', filters: { ...DEFAULT_FILTERS, sepia: 0.3, saturation: 1.2, brightness: 1.05 } },
  { name: 'Cool', filters: { ...DEFAULT_FILTERS, hueRotate: -15, saturation: 1.1, brightness: 0.98 } },
  { name: 'B&W', filters: { ...DEFAULT_FILTERS, grayscale: 1, contrast: 1.1 } },
  { name: 'Faded', filters: { ...DEFAULT_FILTERS, contrast: 0.85, brightness: 1.1, saturation: 0.8 } },
  { name: 'Dramatic', filters: { ...DEFAULT_FILTERS, contrast: 1.4, saturation: 0.9, brightness: 0.95 } },
  { name: 'Dreamy', filters: { ...DEFAULT_FILTERS, blur: 1.5, brightness: 1.1, saturation: 1.2 } }
];
