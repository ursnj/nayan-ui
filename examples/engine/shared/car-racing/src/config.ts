// Car Racing's rules, tuning, colors, and its models, textures and sounds (loaded once, shared by every run).
import {
  audio,
  loadModel,
  loadTexture,
  type SoundBank,
  type SoundSource,
  type Color,
  type Light,
  type Model,
  type Texture,
  type Vec3,
} from "@nayan-ui/engine";

// ── Rules and tuning ──────────────────────────────────────────────────

// Rules follow Playtura's Car Racing: a 2-minute timer, 3 lives, 500 points per car passed. The run
// ends when the timer runs out ("TIME UP!") or the last life is lost ("CRASHED!").
export const GAME_DURATION = 120; // seconds
export const LIVES = 3;
export const POINTS_PER_CAR_PASSED = 500;
export const LOW_TIME = 10; // the timer turns red from here

// The road is a track that curves and climbs. Everything on it is placed by distance along it (s)
// and offset across it (d, metres to the right of the centre line).
export const LANE_W = 3.4;
export const LANES = [-LANE_W, 0, LANE_W];
export const ROAD_HALF = LANE_W * 1.5;
export const EDGE = ROAD_HALF - 1.05; // furthest a car's centre goes before scraping the rail
export const START_SPEED = 26;
export const MAX_SPEED = 52;
export const ACCELERATION = 0.22; // m/s per second
export const LATERAL_SPEED = 15; // m/s across the road
export const STEER_RESPONSE = 9; // how quickly the sideways speed eases toward what the finger asks for
export const STEER_WIDTH = 0.6; // a swipe across this much of the screen crosses the whole road
export const TRAFFIC_SPEED = 14; // one speed: cars keep the gaps they spawned with, so no wall forms later
export const SPAWN_AHEAD = 170; // hidden by fog
export const CRASH_SLOWDOWN = 0.55;
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
  ambient: 0.62,
  shadowExtent: 26,
  color: [0.56, 0.6, 0.82],
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

// Set to true for a hands-free driving bot during local development.
export const AUTOPLAY = false;

// ── Assets ────────────────────────────────────────────────────────────

// Decoded once by the Rust mixer, shared by every run.
export type SoundName = "engine" | "nitro" | "point" | "hit" | "die" | "bump";
export type AssetSources = {
  models: Record<"car_body" | "car_glass" | "car_trim" | "tree", string | number>;
  textures: Record<
    "asphalt" | "facade" | "grass" | "ad_chevrons" | "ad_bubbles" | "ad_bolt",
    string | number
  >;
  sounds: Record<SoundName, SoundSource>;
};
export let sfx: SoundBank<SoundName>;

/**
 * One car for everyone: Khronos' "Car Concept" (CC-BY 4.0, converted by scripts/import-car.py). A
 * glossy white body each entity paints its own color, the windows, and untinted trim (tyres, lights).
 */
export type CarModel = { body: Model; glass: Model; trim: Model; size: Vec3 };
export type Assets = {
  car: CarModel;
  asphalt: Texture;
  facade: Texture;
  grass: Texture;
  ads: Texture[];
  tree: Model;
};

let assets: Promise<Assets> | undefined;
export function loadAssets(sources: AssetSources): Promise<Assets> {
  sfx ??= audio.load(sources.sounds);
  assets ??= Promise.all([
    loadModel(sources.models.car_body, { center: false, shine: 0.85 }),
    loadModel(sources.models.car_glass, { center: false, shine: 0.95 }),
    loadModel(sources.models.car_trim, { center: false, shine: 0.25 }),
    loadTexture(sources.textures.asphalt),
    loadTexture(sources.textures.facade),
    loadTexture(sources.textures.grass),
    Promise.all([
      loadTexture(sources.textures.ad_chevrons),
      loadTexture(sources.textures.ad_bubbles),
      loadTexture(sources.textures.ad_bolt),
    ]),
    loadModel(sources.models.tree, { center: false }),
  ]).then(([body, glass, trim, asphalt, facade, grass, ads, tree]) => ({
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
    tree,
  }));
  assets.catch(() => (assets = undefined)); // a failed load is retried next time
  return assets;
}
