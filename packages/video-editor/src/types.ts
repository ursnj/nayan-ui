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
 * The grade applied to a layer.
 *
 * Everything here is resolution-independent and neutral at its default, so a
 * clip with an untouched `ColorAdjust` takes the cheap Canvas2D path and never
 * reaches the shader.
 *
 * Split toning is the one pair that isn't a plain number: `shadowTint` and
 * `highlightTint` name the two ends of the tone range and `splitTone` says how
 * far to push towards them. It is the single biggest contributor to a "look",
 * which is why the named filters lean on it.
 */
export interface ColorAdjust {
  /** Linear gain. 1 is neutral. */
  brightness: number;
  contrast: number;
  saturation: number;
  /** Saturation that spares pixels which are already colourful — protects skin. */
  vibrance: number;
  /** -1 (cool) .. 1 (warm) — the blue/amber axis of white balance. */
  temperature: number;
  /** -1 (green) .. 1 (magenta) — the other white-balance axis. */
  tint: number;
  /** -1 (recover) .. 1 (lift) — acts only on the top of the tone range. */
  highlights: number;
  /** -1 (crush) .. 1 (lift) — acts only on the bottom of the tone range. */
  shadows: number;
  /** 0..1 — milky lifted blacks, the matte-film look. */
  fade: number;
  /** 0..1 — darkened corners. */
  vignette: number;
  /** 0..1 — film grain. */
  grain: number;
  /** 0..1 — unsharp mask amount. */
  sharpen: number;
  /** Hex tints for the dark and bright ends of the range. */
  shadowTint: string;
  highlightTint: string;
  /** 0..1 — how strongly the two tints are applied. */
  splitTone: number;
  /** Pixels at 1080p; scaled with output height. */
  blur: number;
  grayscale: number;
}

/**
 * A named look, and how far it has been dialled in.
 *
 * The rendered grade always lives in `ColorAdjust`; this only records where it
 * came from, so the strength stays adjustable after the fact. Touching any
 * slider by hand clears it, because the grade is then no longer that look.
 */
export interface FilterRef {
  name: string;
  /** 0..1 blend between neutral and the preset. */
  intensity: number;
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

export type TransitionKind =
  | 'dissolve'
  | 'blur-dissolve'
  | 'fade-to-black'
  | 'fade-to-white'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'push-left'
  | 'push-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'whip-pan'
  | 'iris';

export interface TransitionSpec {
  kind: TransitionKind;
  durationUs: number;
}

export const TRANSITION_LABELS: Record<TransitionKind, string> = {
  dissolve: 'Dissolve',
  'blur-dissolve': 'Blur dissolve',
  'fade-to-black': 'Dip to black',
  'fade-to-white': 'Dip to white',
  'wipe-left': 'Wipe left',
  'wipe-right': 'Wipe right',
  'wipe-up': 'Wipe up',
  'wipe-down': 'Wipe down',
  'slide-left': 'Slide left',
  'slide-right': 'Slide right',
  'slide-up': 'Slide up',
  'slide-down': 'Slide down',
  'push-left': 'Push left',
  'push-right': 'Push right',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'whip-pan': 'Whip pan',
  iris: 'Iris'
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
  /** Provenance of `colorAdjust` when it came from a named look. */
  filter: FilterRef | null;
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

/* ------------------------------------------------------------------ *
 * Background
 * ------------------------------------------------------------------ */

export type BackgroundKind = 'solid' | 'linear-gradient' | 'radial-gradient' | 'image' | 'blur';

/**
 * What fills the frame behind every layer.
 *
 * This matters most when the footage does not match the output shape — a
 * landscape clip in a vertical project — where the alternative is black bars.
 * `blur` is the answer people actually reach for there: the clip itself,
 * scaled to cover and defocused, so the bars become part of the picture.
 *
 * One flat record rather than a discriminated union, because the panel lets
 * you switch kinds back and forth and a union would discard the settings of
 * whichever kind you just left.
 */
export interface Background {
  kind: BackgroundKind;
  /** The solid fill, and the base painted under every other kind. */
  color: string;
  /** Gradient stops. */
  from: string;
  to: string;
  /** Degrees clockwise from vertical. Linear gradients only. */
  angle: number;
  /** Which imported image to use, for `image`. */
  assetId: string | null;
  /** 0..1 — how far the picture is dimmed towards `color`. */
  dim: number;
  /** Defocus in pixels at 1080p, for `blur` and `image`. */
  blur: number;
  /** Zoom on top of cover-fit; a little hides the soft edge of a heavy blur. */
  scale: number;
}

export const DEFAULT_BACKGROUND: Background = {
  kind: 'solid',
  color: '#000000',
  from: '#1e3a8a',
  to: '#9333ea',
  angle: 135,
  assetId: null,
  dim: 0.25,
  blur: 48,
  scale: 1.15
};

export const BACKGROUND_LABELS: Record<BackgroundKind, string> = {
  solid: 'Solid',
  'linear-gradient': 'Linear',
  'radial-gradient': 'Radial',
  image: 'Image',
  blur: 'Blurred clip'
};

/** Ready-made gradients, so a decent backdrop is one click rather than two pickers. */
export const GRADIENT_PRESETS: { name: string; from: string; to: string; angle: number }[] = [
  { name: 'Midnight', from: '#0f2027', to: '#2c5364', angle: 135 },
  { name: 'Ember', from: '#f12711', to: '#f5af19', angle: 135 },
  { name: 'Violet', from: '#1e3a8a', to: '#9333ea', angle: 135 },
  { name: 'Mint', from: '#134e5e', to: '#71b280', angle: 135 },
  { name: 'Rose', from: '#ee9ca7', to: '#ffdde1', angle: 135 },
  { name: 'Slate', from: '#232526', to: '#414345', angle: 180 },
  { name: 'Sunset', from: '#ff512f', to: '#dd2476', angle: 90 },
  { name: 'Ocean', from: '#2193b0', to: '#6dd5ed', angle: 135 }
];

export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  fps: number;
  background: Background;
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
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  fade: 0,
  vignette: 0,
  grain: 0,
  sharpen: 0,
  shadowTint: '#2b4a6b',
  highlightTint: '#ffc48a',
  splitTone: 0,
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

/**
 * The filter shelf.
 *
 * Each look is a full `ColorAdjust`, so applying one is an assignment rather
 * than a merge, and dialling its strength is a blend against `DEFAULT_COLOR`.
 * `swatch` is the two-stop gradient the picker paints behind the name — a cheap
 * stand-in for the real thing, since rendering sixteen live previews per frame
 * would cost more than the preview itself.
 */
export interface ColorPreset {
  name: string;
  color: ColorAdjust;
  swatch: [string, string];
}

const look = (name: string, swatch: [string, string], color: Partial<ColorAdjust>): ColorPreset => ({
  name,
  swatch,
  color: { ...DEFAULT_COLOR, ...color }
});

export const COLOR_PRESETS: ColorPreset[] = [
  look('None', ['#3f3f46', '#71717a'], {}),
  look('Vivid', ['#ff5f6d', '#ffc371'], { saturation: 1.4, contrast: 1.15, vibrance: 0.2 }),
  look('Punch', ['#f7971e', '#ffd200'], { contrast: 1.3, vibrance: 0.45, sharpen: 0.3, saturation: 1.1 }),
  look('Warm Sun', ['#f6d365', '#fda085'], { temperature: 0.38, saturation: 1.12, highlights: -0.15 }),
  look('Cool Steel', ['#4b6cb7', '#182848'], { temperature: -0.35, tint: -0.06, contrast: 1.1 }),
  look('Golden Hour', ['#ff9966', '#ff5e62'], { temperature: 0.45, shadows: 0.12, splitTone: 0.35, highlightTint: '#ffb46b' }),
  look('Faded Film', ['#d7cfc3', '#a89f91'], { fade: 0.28, contrast: 0.88, saturation: 0.82, grain: 0.18 }),
  look('Matte Black', ['#232526', '#414345'], { fade: 0.35, contrast: 1.12, saturation: 0.7, splitTone: 0.3, shadowTint: '#1d2b3a' }),
  look('Mono', ['#ffffff', '#4b4b4b'], { grayscale: 1, contrast: 1.2 }),
  look('Noir', ['#0f0f0f', '#5a5a5a'], { grayscale: 1, contrast: 1.45, vignette: 0.45, grain: 0.22 }),
  look('Teal & Orange', ['#0f3443', '#ff8c42'], { splitTone: 0.45, shadowTint: '#0e3a4a', highlightTint: '#ffb07c', contrast: 1.2, saturation: 0.95 }),
  look('Vintage', ['#c79081', '#dfa579'], { temperature: 0.25, fade: 0.22, saturation: 0.8, vignette: 0.3, grain: 0.25 }),
  look('Dreamy', ['#e0c3fc', '#8ec5fc'], { blur: 1.5, brightness: 1.08, saturation: 1.15, fade: 0.15 }),
  look('Clarity', ['#e6f0f7', '#94b8d1'], { sharpen: 0.5, contrast: 1.12, vibrance: 0.25 }),
  look('Bleach', ['#eaeaea', '#c9c9c9'], { saturation: 0.45, contrast: 1.3, brightness: 1.08 }),
  look('Moody', ['#1f1c2c', '#928dab'], { shadows: -0.25, contrast: 1.18, saturation: 0.85, vignette: 0.35, splitTone: 0.25 })
];

/**
 * Blends a look towards neutral.
 *
 * Only the amounts interpolate; the two tint hexes are taken wholesale from
 * the preset, because a `splitTone` of zero already means they have no effect
 * and mixing hex values would just muddy the look on the way in.
 */
export const blendColor = (preset: ColorAdjust, intensity: number): ColorAdjust => {
  const t = Math.max(0, Math.min(1, intensity));
  const mix = (from: number, to: number) => from + (to - from) * t;
  return {
    brightness: mix(DEFAULT_COLOR.brightness, preset.brightness),
    contrast: mix(DEFAULT_COLOR.contrast, preset.contrast),
    saturation: mix(DEFAULT_COLOR.saturation, preset.saturation),
    vibrance: mix(DEFAULT_COLOR.vibrance, preset.vibrance),
    temperature: mix(DEFAULT_COLOR.temperature, preset.temperature),
    tint: mix(DEFAULT_COLOR.tint, preset.tint),
    highlights: mix(DEFAULT_COLOR.highlights, preset.highlights),
    shadows: mix(DEFAULT_COLOR.shadows, preset.shadows),
    fade: mix(DEFAULT_COLOR.fade, preset.fade),
    vignette: mix(DEFAULT_COLOR.vignette, preset.vignette),
    grain: mix(DEFAULT_COLOR.grain, preset.grain),
    sharpen: mix(DEFAULT_COLOR.sharpen, preset.sharpen),
    shadowTint: preset.shadowTint,
    highlightTint: preset.highlightTint,
    splitTone: mix(DEFAULT_COLOR.splitTone, preset.splitTone),
    blur: mix(DEFAULT_COLOR.blur, preset.blur),
    grayscale: mix(DEFAULT_COLOR.grayscale, preset.grayscale)
  };
};
