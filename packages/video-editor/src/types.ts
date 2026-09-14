/**
 * Domain model for the editor.
 *
 * All times are in microseconds (µs) — the unit WebCodecs uses for
 * `VideoFrame.timestamp` / `EncodedVideoChunk.timestamp`, so keeping the whole
 * model in µs avoids a class of rounding bugs at the encode boundary.
 *
 * Geometry is stored as *fractions of the frame* rather than pixels, so a
 * project renders identically at any output resolution.
 */

export const US = 1_000_000;

export type AssetKind = 'video' | 'audio' | 'image';

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  name: string;
  size: number;
  url: string;
  durationUs: number;
  width: number;
  height: number;
  hasVideo: boolean;
  hasAudio: boolean;
  fps: number;
  thumbnail: string | null;
  webCodecs: boolean;
}

/* ------------------------------------------------------------------ *
 * Keyframes
 * ------------------------------------------------------------------ */

export type Easing = 'hold' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Keyframe {
  /** Offset from the clip's own start, µs. Stays valid when the clip moves. */
  atUs: number;
  value: number;
  /** Shape of the ramp leaving this key. */
  easing: Easing;
}

/**
 * Animation tracks keyed by property path (`'transform.scale'`, `'opacity'`, …).
 *
 * Keeping keyframes in a side table rather than boxing every field means a
 * static clip costs nothing, and any numeric property becomes animatable
 * without changing its type.
 */
export type Animations = Record<string, Keyframe[]>;

/* ------------------------------------------------------------------ *
 * Visual properties
 * ------------------------------------------------------------------ */

export interface Transform {
  /** Offset from centre, as a fraction of project width/height. */
  x: number;
  y: number;
  scale: number;
  /** Degrees, clockwise. */
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

/** Fractions of the source frame trimmed from each side. */
export interface Crop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * The colour controls that earn their place in a basic grade.
 *
 * `grayscale` has no slider of its own — it exists so the Mono preset has
 * something to set.
 */
export interface ColorAdjust {
  brightness: number;
  contrast: number;
  saturation: number;
  /** -1 (cool) .. 1 (warm). Needs the shader; a channel offset, not a filter. */
  temperature: number;
  /** Pixels at 1080p; scaled with output height. */
  blur: number;
  grayscale: number;
}

export interface ChromaKey {
  enabled: boolean;
  /** Hex key colour. */
  color: string;
  /** 0..1 — how far from the key colour still counts as background. */
  similarity: number;
  /** 0..1 — softness of the matte edge. */
  smoothness: number;
  /** 0..1 — how much key-coloured fringe to desaturate. */
  spill: number;
}

/* ------------------------------------------------------------------ *
 * Transitions
 * ------------------------------------------------------------------ */

export type TransitionKind = 'dissolve' | 'fade-to-black' | 'wipe-left' | 'wipe-right' | 'slide-left' | 'zoom-in';

export interface TransitionSpec {
  kind: TransitionKind;
  durationUs: number;
}

export const TRANSITION_LABELS: Record<TransitionKind, string> = {
  dissolve: 'Dissolve',
  'fade-to-black': 'Fade to black',
  'wipe-left': 'Wipe left',
  'wipe-right': 'Wipe right',
  'slide-left': 'Slide',
  'zoom-in': 'Zoom'
};

/* ------------------------------------------------------------------ *
 * Clips
 * ------------------------------------------------------------------ */

export type ClipKind = 'video' | 'audio' | 'image' | 'text';

interface ClipCommon {
  id: string;
  trackId: string;
  name: string;
  startUs: number;
  /** Length on the timeline (already accounts for `speed`). */
  durationUs: number;
  opacity: number;
  fadeInUs: number;
  fadeOutUs: number;
  animations: Animations;
  /** Transition covering this clip's incoming edge. */
  transitionIn: TransitionSpec | null;
  /** Colour swatch in the timeline. */
  color: string;
  /** Clips sharing a group id move and delete together. */
  groupId: string | null;
  locked: boolean;
  transform: Transform;
  crop: Crop;
  colorAdjust: ColorAdjust;
}

export interface MediaClip extends ClipCommon {
  kind: 'video' | 'audio' | 'image';
  assetId: string;
  /** In-point within the source asset. */
  inUs: number;
  speed: number;
  reversed: boolean;
  volume: number;
  muted: boolean;
  chromaKey: ChromaKey;
}

export type TextAlign = 'left' | 'center' | 'right';
export type TextAnimation = 'none' | 'fade' | 'rise' | 'pop' | 'typewriter';

export interface TextClip extends ClipCommon {
  kind: 'text';
  text: string;
  fontFamily: string;
  /** Fraction of project height. */
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  textColor: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  align: TextAlign;
  /** Centre of the text block, as a fraction of the frame, offset from middle. */
  x: number;
  y: number;
  animation: TextAnimation;
}

export type Clip = MediaClip | TextClip;

/** Line spacing is fixed rather than exposed — one less dial for one rare need. */
export const TEXT_LINE_HEIGHT = 1.25;

export type TrackKind = 'video' | 'audio';

export interface Track {
  id: string;
  kind: TrackKind;
  name: string;
  muted: boolean;
  hidden: boolean;
  locked: boolean;
  height: number;
  volume: number;
}

export interface Marker {
  id: string;
  atUs: number;
  label: string;
  color: string;
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
  bitrate: number;
  audioBitrate: number;
  includeAudio: boolean;
  /** Encode only the region between the in/out points when set. */
  rangeUs: { startUs: number; endUs: number } | null;
}

/* ------------------------------------------------------------------ *
 * Guards & helpers
 * ------------------------------------------------------------------ */

export const isMediaClip = (clip: Clip): clip is MediaClip => clip.kind !== 'text';
export const isTextClip = (clip: Clip): clip is TextClip => clip.kind === 'text';

/** Clips that put pixels on screen. */
export const isVisualClip = (clip: Clip) => clip.kind !== 'audio';
/** Clips that can produce sound. */
export const isAudibleKind = (clip: Clip) => clip.kind === 'video' || clip.kind === 'audio';

export const clipEndUs = (clip: Clip) => clip.startUs + clip.durationUs;

/**
 * Maps a timeline instant onto a position inside the clip's source asset.
 * Returns null when the instant lies outside the clip.
 */
export const sourceTimeUs = (clip: MediaClip, timelineUs: number): number | null => {
  if (timelineUs < clip.startUs || timelineUs >= clipEndUs(clip)) return null;
  const elapsed = timelineUs - clip.startUs;
  const consumed = clip.reversed ? clip.durationUs - elapsed : elapsed;
  return clip.inUs + consumed * clip.speed;
};

/* ------------------------------------------------------------------ *
 * Defaults
 * ------------------------------------------------------------------ */

export const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 1, rotation: 0, flipH: false, flipV: false };

export const DEFAULT_CROP: Crop = { top: 0, right: 0, bottom: 0, left: 0 };

export const DEFAULT_COLOR: ColorAdjust = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  blur: 0,
  grayscale: 0
};

export const DEFAULT_CHROMA: ChromaKey = {
  enabled: false,
  color: '#00b140',
  similarity: 0.4,
  smoothness: 0.1,
  spill: 0.2
};

export const CLIP_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6'];

export const COLOR_PRESETS: { name: string; color: ColorAdjust }[] = [
  { name: 'None', color: DEFAULT_COLOR },
  { name: 'Vivid', color: { ...DEFAULT_COLOR, saturation: 1.45, contrast: 1.15 } },
  { name: 'Warm', color: { ...DEFAULT_COLOR, temperature: 0.35, saturation: 1.15 } },
  { name: 'Cool', color: { ...DEFAULT_COLOR, temperature: -0.35, saturation: 1.1 } },
  { name: 'Mono', color: { ...DEFAULT_COLOR, grayscale: 1, contrast: 1.15 } },
  { name: 'Faded', color: { ...DEFAULT_COLOR, contrast: 0.82, brightness: 1.12, saturation: 0.75 } },
  { name: 'Cinematic', color: { ...DEFAULT_COLOR, contrast: 1.25, saturation: 0.9, brightness: 0.95 } },
  { name: 'Dreamy', color: { ...DEFAULT_COLOR, blur: 1.5, brightness: 1.1, saturation: 1.2 } }
];
