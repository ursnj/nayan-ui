// Car Racing's rules, tuning, colors, and its models, textures and sounds (loaded once, shared by every run).
import {
  audio,
  type Color,
  type Font,
  type Light,
  loadTexture,
  type Model,
  type SoundBank,
  type Texture,
  type Vec3,
  warmUpEngine
} from '@nayan-ui/engine';
import { loadHudFonts } from '../shared/EngineHud';
import { loadCarMeshes, treeMesh } from './CarMeshes';
import { type SceneryMeshes, sceneryMeshes } from './CarRacingScenery';

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
export const START_SPEED = 20; // m/s, held for the whole race
export const CAMERA_FOV = 0.95; // Fixed perspective, matching the working engine example
export const LATERAL_SPEED = 9; // m/s across the road
export const STEER_RESPONSE = 10.5; // how quickly the sideways speed eases toward what the finger asks for
export const STEER_WIDTH = 0.6; // a swipe across this much of the screen crosses the whole road
export const TRAFFIC_SPEED = 12; // one speed: cars keep the gaps they spawned with, so no wall forms later
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
export const NIGHT_LIGHT: Light = { direction: [0.25, 0.9, 0.35], ambient: 0.66, shadowExtent: 26, color: [0.84, 0.88, 1] };
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
  [0.55, 0.2, 0.75]
];
export const PLAYER_PAINT: Color = [0.92, 0.08, 0.1];

// Demo / QA mode: a bot drives and restarts. Run Metro with EXPO_PUBLIC_AUTOPLAY=1.
export const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === '1';

// ── Assets ────────────────────────────────────────────────────────────

// Decode only when a race opens, including when the catalog is imported by a web server.
let racingSounds: SoundBank<'engine' | 'nitro' | 'point' | 'hit' | 'win' | 'die' | 'bump'> | undefined;
export const getRacingSounds = () =>
  (racingSounds ??= audio.load({
    engine: require('../../assets/sfx/engine.wav'),
    nitro: require('../../assets/sfx/nitro.wav'),
    point: require('../../assets/sfx/point.wav'),
    hit: require('../../assets/sfx/hit.wav'),
    win: require('../../assets/sfx/win.wav'),
    die: require('../../assets/sfx/die.wav'),
    bump: require('../../assets/sfx/bump.wav')
  }));

/**
 * One car for everyone, loaded from glTF (CarMeshes): a glossy white body each entity paints its own
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
  scenery: SceneryMeshes;
  font: Font;
};

let assets: Promise<Assets> | undefined;
let cachedAssets: Assets | null = null;
export const getCachedAssets = (): Assets | null => cachedAssets;
export function loadAssets(): Promise<Assets> {
  assets ??= warmUpEngine()
    .then(() =>
      Promise.all([
        loadHudFonts(),
        loadTexture(require('../../assets/textures/asphalt.png')),
        loadTexture(require('../../assets/textures/facade.png')),
        loadTexture(require('../../assets/textures/grass.png')),
        Promise.all([
          loadTexture(require('../../assets/textures/ad_chevrons.png')),
          loadTexture(require('../../assets/textures/ad_bubbles.png')),
          loadTexture(require('../../assets/textures/ad_bolt.png'))
        ]),
        loadCarMeshes()
      ])
    )
    .then(([fonts, asphalt, facade, grass, ads, { body, glass, trim }]) => {
      return {
        car: {
          body,
          glass,
          trim,
          size: [Math.max(body.size[0], trim.size[0]), Math.max(body.size[1], trim.size[1]), Math.max(body.size[2], trim.size[2])] as Vec3
        },
        asphalt,
        facade,
        grass,
        ads,
        tree: treeMesh(),
        scenery: sceneryMeshes(),
        font: fonts.semi
      };
    });
  assets.then(
    (value) => {
      cachedAssets = value;
    },
    () => {}
  );
  assets.catch(() => (assets = undefined)); // a failed load is retried next time
  return assets;
}

/** Starts loading the game's textures and models and building its scenery (they're cached), so opening it is quick. */
export function preloadRacing() {
  loadAssets().catch(() => {}); // the game screen reports any error
}

/** Decode one texture per job before the asset bundle's cached assembly. */
export function* warmAssets(): Iterable<() => unknown> {
  yield loadCarMeshes;
  yield treeMesh;
  yield sceneryMeshes;
  yield () => loadTexture(require('../../assets/textures/asphalt.png'));
  yield () => loadTexture(require('../../assets/textures/facade.png'));
  yield () => loadTexture(require('../../assets/textures/grass.png'));
  yield () => loadTexture(require('../../assets/textures/ad_chevrons.png'));
  yield () => loadTexture(require('../../assets/textures/ad_bubbles.png'));
  yield () => loadTexture(require('../../assets/textures/ad_bolt.png'));
  yield loadAssets;
  yield () => getRacingSounds().ready;
}
