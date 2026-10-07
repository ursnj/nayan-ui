import {
  CLIP_COLORS,
  DEFAULT_CHROMA,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_FIT,
  DEFAULT_TRANSFORM,
} from "../types";
import type { MediaAsset, MediaClip, TextClip, Track, TrackKind } from "../types";
import { uid } from "./utils";

let colorCursor = 0;
/** Cycles the palette so adjacent new clips are visually distinct on the timeline. */
const nextClipColor = () => CLIP_COLORS[colorCursor++ % CLIP_COLORS.length];

export const makeTrack = (kind: TrackKind, count: number): Track => ({
  id: uid("track"),
  kind,
  name: `${kind === "video" ? "Video" : "Audio"} ${count}`,
  muted: false,
  hidden: false,
  locked: false,
  height: kind === "video" ? 72 : 48,
  volume: 1,
});

export const makeMediaClip = (
  asset: MediaAsset,
  trackId: string,
  startUs: number,
  durationUs: number,
): MediaClip => ({
  id: uid("clip"),
  trackId,
  name: asset.name,
  startUs,
  durationUs,
  opacity: 1,
  fadeInUs: 0,
  fadeOutUs: 0,
  transitionIn: null,
  color: nextClipColor(),
  groupId: null,
  locked: false,
  transform: { ...DEFAULT_TRANSFORM },
  crop: { ...DEFAULT_CROP },
  colorAdjust: { ...DEFAULT_COLOR },
  filter: null,
  kind: asset.kind,
  assetId: asset.id,
  fit: DEFAULT_FIT,
  inUs: 0,
  speed: 1,
  reversed: false,
  volume: 1,
  muted: false,
  chromaKey: { ...DEFAULT_CHROMA },
});

export const makeTextClip = (
  trackId: string,
  startUs: number,
  preset?: Partial<TextClip>,
): TextClip => ({
  id: uid("clip"),
  trackId,
  name: preset?.text ? preset.text.slice(0, 24) : "Text",
  startUs,
  durationUs: 3_000_000,
  opacity: 1,
  fadeInUs: 0,
  fadeOutUs: 0,
  transitionIn: null,
  color: nextClipColor(),
  groupId: null,
  locked: false,
  transform: { ...DEFAULT_TRANSFORM },
  crop: { ...DEFAULT_CROP },
  colorAdjust: { ...DEFAULT_COLOR },
  filter: null,
  kind: "text",
  text: "Your text here",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 0.08,
  fontWeight: 700,
  italic: false,
  textColor: "#ffffff",
  backgroundColor: "transparent",
  strokeColor: "#000000",
  strokeWidth: 0,
  align: "center",
  x: 0,
  y: 0,
  animation: "none",
  ...preset,
});

export const TEXT_PRESETS: { name: string; preset: Partial<TextClip> }[] = [
  {
    name: "Title",
    preset: { text: "Title", fontSize: 0.1, fontWeight: 800, textColor: "#ffffff" },
  },
  {
    name: "Subtitle",
    preset: { text: "Subtitle", fontSize: 0.05, fontWeight: 500, textColor: "#ffffff" },
  },
  {
    name: "Caption",
    preset: {
      text: "Caption",
      fontSize: 0.045,
      fontWeight: 600,
      textColor: "#ffffff",
      backgroundColor: "#000000cc",
    },
  },
  {
    name: "Bold Statement",
    preset: { text: "BOLD STATEMENT", fontSize: 0.09, fontWeight: 900, textColor: "#fde047" },
  },
  {
    name: "Lower Third",
    preset: {
      text: "Name — Role",
      fontSize: 0.04,
      fontWeight: 600,
      textColor: "#ffffff",
      backgroundColor: "#1e3a8acc",
      y: 0.35,
    },
  },
  {
    name: "Outline",
    preset: {
      text: "Outline",
      fontSize: 0.08,
      fontWeight: 800,
      textColor: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 2,
    },
  },
];
