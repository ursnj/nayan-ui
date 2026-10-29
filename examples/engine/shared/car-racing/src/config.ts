// Car Racing's rules, tuning, colors, and its models, textures and sounds (loaded once, shared by every run).
import {
  audio,
  loadFont,
  loadTexture,
  type Font,
  type SoundBank,
  type SoundSource,
  type Color,
  type Light,
  type Model,
  type Texture,
  type Vec3,
} from "@nayan-ui/engine";
import { carMeshes, treeMesh } from "./meshes";

// ── Rules and tuning ──────────────────────────────────────────────────

// A sprint from the start line to the finish gate, as Penguin Run's track: 3 lives, 500 points per car
// passed. Crossing the finish wins ("FINISHED!"); losing the last life ends it ("CRASHED!").
export const TRACK_LENGTH = 2000; // metres, shared by Car Racing and Bike Racing
export const LIVES = 3;
export const POINTS_PER_CAR_PASSED = 500;
/** No traffic is spawned this close to the finish, so the line is clear to cross. */
export const FINISH_CLEAR = 30;

// The road is a track that curves and climbs. Everything on it is placed by distance along it (s)
// and offset across it (d, metres to the right of the centre line).
export const LANE_W = 3.4;
export const LANES = [-LANE_W, 0, LANE_W];
export const ROAD_HALF = LANE_W * 1.5;
export const EDGE = ROAD_HALF - 1.05; // furthest a car's centre goes before scraping the rail
export const START_SPEED = 20; // m/s (72 km/h), held for the whole race
export const CAMERA_FOV = 0.95; // Fixed perspective: no speed-driven zoom
export const LATERAL_SPEED = 15;
export const STEER_RESPONSE = 8.5;
export const CRASH_SLOWDOWN = 0.55; // m/s across the road
export const STEER_WIDTH = 0.6; // a swipe across this much of the screen crosses the whole road
export const TRAFFIC_SPEED = 12; // one speed: cars keep the gaps they spawned with, so no wall forms later
export const SPAWN_AHEAD = 170; // hidden by fog
export const INVULNERABLE = 1.6; // seconds after a crash
export const SEG_LEN = 6;
export const SEGMENTS = 42;
export const RS = 0.2; // road segment roots sit this far below the surface: their colliders are 0.4 thick
export const BEHIND = 8; // segments kept behind the player, so neither camera sees where the road ends

export const SKY = [0.62, 0.78, 0.95] as const;
// Dark mode drives at night, as Playtura repaints its outdoor scenes (NIGHT_SCENE): its night sky,
// dim bluish moonlight, and glowing lamps, lights and billboards (colors above 1 glow).
export const NIGHT_SKY = [0.227, 0.192, 0.376] as const; // NIGHT_SCENE.SKY's lightest, at the horizon: #3A3160
export const DAY_LIGHT: Light = { direction: [0.45, 0.85, 0.3], ambient: 0.5, shadowExtent: 26 };
export const NIGHT_LIGHT: Light = {
  direction: [0.25, 0.9, 0.35],
  ambient: 0.66,
  shadowExtent: 26,
  color: [0.84, 0.88, 1],
};
export const LAMP: Color = [1, 0.97, 0.82];
export const LAMP_LIT: Color = [2, 1.85, 1.3];
export const LINE: Color = [0.95, 0.95, 0.9];
export const RAIL: Color = [0.72, 0.74, 0.78];
export const PAINTS: Color[] = [
  [0.15, 0.32, 0.95],
  [0.1, 0.75, 0.35],
  [1, 0.8, 0.15],
  [0.92, 0.92, 0.95],
  [0.12, 0.12, 0.14],
  [0.95, 0.45, 0.1],
  [0.55, 0.2, 0.75],
];
export const PLAYER_PAINT: Color = [0.92, 0.08, 0.1];

// Enable the hands-free driving bot for local development.
export const AUTOPLAY = false;

// ── Assets ────────────────────────────────────────────────────────────

// Decoded once by the Rust mixer, shared by every run.
export type SoundName = "engine" | "nitro" | "point" | "hit" | "win" | "die" | "bump";
export type AssetSources = {
  font: string | number;
  textures: Record<
    "asphalt" | "facade" | "grass" | "ad_chevrons" | "ad_bubbles" | "ad_bolt",
    string | number
  >;
  sounds: Record<SoundName, SoundSource>;
};
export let sfx: SoundBank<SoundName>;

/**
 * One car for everyone, built in code (CarMeshes): a glossy white body each entity paints its own
 * color, the windows, and untinted trim (tyres, lights).
 */
export type CarModel = { body: Model; glass: Model; trim: Model; size: Vec3 };
export type Assets = {
  car: CarModel;
  asphalt: Texture;
  facade: Texture;
  grass: Texture;
  ads: Texture[];
  tree: Model;
  font: Font;
};

let assets: Promise<Assets> | undefined;
let cachedAssets: Assets | null = null;
export const getCachedAssets = (): Assets | null => cachedAssets;
export function loadAssets(sources: AssetSources): Promise<Assets> {
  sfx ??= audio.load(sources.sounds);
  assets ??= Promise.all([
    loadFont(sources.font, { depth: 0, chars: "FINISH" }),
    loadTexture(sources.textures.asphalt),
    loadTexture(sources.textures.facade),
    loadTexture(sources.textures.grass),
    Promise.all([
      loadTexture(sources.textures.ad_chevrons),
      loadTexture(sources.textures.ad_bubbles),
      loadTexture(sources.textures.ad_bolt),
    ]),
  ]).then(([font, asphalt, facade, grass, ads]) => {
    const { body, glass, trim } = carMeshes();
    return {
      font,
      car: {
        body,
        glass,
        trim,
        size: [
          Math.max(body.size[0], trim.size[0]),
          Math.max(body.size[1], trim.size[1]),
          Math.max(body.size[2], trim.size[2]),
        ] as Vec3,
      },
      asphalt,
      facade,
      grass,
      ads,
      tree: treeMesh(),
    };
  });
  assets.then(
    (value) => {
      cachedAssets = value;
    },
    () => {},
  );
  assets.catch(() => (assets = undefined)); // a failed load is retried next time
  return assets;
}
