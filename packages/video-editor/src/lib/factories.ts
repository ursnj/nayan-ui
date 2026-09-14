import { CLIP_COLORS, DEFAULT_CHROMA, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, US } from '../types';
import type { MediaAsset, MediaClip, TextClip, Track, TrackKind } from '../types';
import { uid } from './utils';

let colorCursor = 0;
const nextColor = () => CLIP_COLORS[colorCursor++ % CLIP_COLORS.length];

/** Fields every clip carries, so a new kind can't forget one. */
const clipBase = (trackId: string, name: string, startUs: number, durationUs: number) => ({
  id: uid('clip'),
  trackId,
  name,
  startUs,
  durationUs,
  opacity: 1,
  fadeInUs: 0,
  fadeOutUs: 0,
  animations: {},
  transitionIn: null,
  color: nextColor(),
  groupId: null,
  locked: false,
  transform: { ...DEFAULT_TRANSFORM },
  crop: { ...DEFAULT_CROP },
  colorAdjust: { ...DEFAULT_COLOR }
});

export const makeMediaClip = (asset: MediaAsset, trackId: string, startUs: number, durationUs: number): MediaClip => ({
  ...clipBase(trackId, asset.name, startUs, durationUs),
  kind: asset.kind,
  assetId: asset.id,
  inUs: 0,
  speed: 1,
  reversed: false,
  volume: 1,
  muted: false,
  chromaKey: { ...DEFAULT_CHROMA }
});

export const makeTextClip = (trackId: string, startUs: number, preset?: Partial<TextClip>): TextClip => ({
  ...clipBase(trackId, 'Text', startUs, 3 * US),
  kind: 'text',
  text: 'Your text here',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 0.08,
  fontWeight: 700,
  italic: false,
  textColor: '#ffffff',
  backgroundColor: 'transparent',
  strokeColor: '#000000',
  strokeWidth: 0,
  align: 'center',
  x: 0,
  y: 0.3,
  animation: 'none',
  ...preset
});

export const makeTrack = (kind: TrackKind, index: number): Track => ({
  id: uid('track'),
  kind,
  name: `${kind === 'video' ? 'Video' : 'Audio'} ${index}`,
  muted: false,
  hidden: false,
  locked: false,
  height: kind === 'video' ? 68 : 56,
  volume: 1
});

/** The handful of text looks worth offering as one-click starts. */
export const TEXT_PRESETS: { name: string; preset: Partial<TextClip> }[] = [
  { name: 'Title', preset: { fontSize: 0.11, fontWeight: 800, y: 0, text: 'Title' } },
  { name: 'Subtitle', preset: { fontSize: 0.05, fontWeight: 500, y: 0.35, text: 'Subtitle' } },
  {
    name: 'Caption',
    preset: { fontSize: 0.045, fontWeight: 600, y: 0.38, backgroundColor: 'rgba(0,0,0,0.75)', text: 'Caption text' }
  },
  { name: 'Outline', preset: { fontSize: 0.1, fontWeight: 800, strokeWidth: 3, strokeColor: '#000000', text: 'Outline' } }
];
