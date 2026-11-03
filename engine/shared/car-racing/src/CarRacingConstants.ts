import {
  type AssetSource,
  audio,
  type Light,
  loadModel,
  loadTexture,
  type Model,
  type SoundBank,
  type SoundSource,
  type Texture
} from '@nayan-ui/engine';
import { sources } from './CarRacingAssets';

// Tuning. Forward is -z; x is across the road.
export const LANES = [-3.4, 0, 3.4];
export const ROAD_WIDTH = 11;
export const EDGE = 4.4; // how far the player may steer from the centre line
export const SPEED = 20; // m/s
export const TRAFFIC_SPEED = 11; // m/s, so the player overtakes
export const LATERAL_SPEED = 9; // m/s across the road with the keys
export const TRACK_LENGTH = 1500; // m to the finish
export const LIVES = 3;
export const PASS_POINTS = 10;
export const TILE = 10; // length of one road tile
export const TILES = 26; // tiles kept in front of the camera, recycled as the car drives
export const TRAFFIC = 8;
export const CAPACITY = 400; // entities: road, trees, cars, particles

// Look. Every color option takes CSS strings or 0..1 tuples.
export const SKY = '#9FD3F5';
export const FOG = 0.012;
export const LIGHT: Light = { direction: [0.3, 1, 0.45], ambient: 0.55, shadowExtent: 40 };
export const PLAYER_COLOR = '#E53935';
export const TRAFFIC_COLORS = ['#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FB8C00', '#ECEFF1'];

export type SoundName = 'engine' | 'point' | 'hit' | 'win' | 'die';

/** Where the files come from: Metro `require(...)` on React Native, Vite URLs on the web (`CarRacingAssets.web.ts`). */
export type AssetSources = {
  car: Record<CarPart, AssetSource>;
  textures: Record<'asphalt' | 'grass', AssetSource>;
  sounds: Record<SoundName, SoundSource>;
};

/** Khronos' Car Concept in three models: white paint each car tints, glossy windows, and trim. */
export type CarPart = 'body' | 'glass' | 'trim';
export type Assets = { car: Record<CarPart, Model>; asphalt: Texture; grass: Texture; sounds: SoundBank<SoundName> };

let loading: Promise<Assets> | undefined;

/**
 * Loads once per app: models and textures decode on native background threads, sounds in the Rust
 * mixer. The car stands on y = 0 facing -z (`center: false` keeps that origin).
 */
export function loadAssets(): Promise<Assets> {
  loading ??= Promise.all([
    loadModel(sources.car.body, { center: false, shine: 0.85 }),
    loadModel(sources.car.glass, { center: false, shine: 0.95 }),
    loadModel(sources.car.trim, { center: false, shine: 0.25 }),
    loadTexture(sources.textures.asphalt),
    loadTexture(sources.textures.grass)
  ]).then(([body, glass, trim, asphalt, grass]) => ({
    car: { body, glass, trim },
    asphalt,
    grass,
    sounds: audio.load(sources.sounds)
  }));
  loading.catch(() => (loading = undefined)); // a failed load is retried next time
  return loading;
}
