import type { Entity } from "./world/World";

export type Vec3 = readonly [number, number, number];

/** Number of mesh ids: built-in shapes (0..15), then loaded models, glyphs and textured variants. */
export const MAX_MESHES = 256;

/** What the renderer draws. `World` implements it; so can any custom simulation. */
export interface RenderSource {
  /** Column-major mat4 per instance (16 floats), grouped by mesh. Only the first `count` are valid. */
  readonly matrices: Float32Array;
  /** RGBA per instance (4 floats), same order as `matrices`. Alpha below 1 draws see-through. */
  readonly colors: Float32Array;
  /** Texture region per instance (u0 v0 u1 v1), same order. Optional: the whole texture by default. */
  readonly regions?: Float32Array;
  /**
   * `[first, count]` per mesh id, in instances: opaque instances at `ranges[2 * mesh]`, transparent ones
   * at `ranges[2 * (MAX_MESHES + mesh)]`. Shorter arrays just have no transparent part.
   */
  readonly ranges: Uint32Array;
  /** Total number of valid instances. */
  readonly count: number;
  /** Maximum number of instances (sizes the GPU buffers). */
  readonly capacity: number;
  /** Called by GameView after each frame with the camera it drew with (for picking and `toScreen`). */
  setView?(viewProj: Float32Array, width: number, height: number): void;
}

/**
 * Built-in shapes, each 1 unit across before scaling. "none" isn't drawn (groups, pivots, trigger zones).
 * "puff" is a soft, round sprite that always faces the camera and is always see-through: overlapping
 * puffs blend into smoke, dust, steam and clouds. "flame" is the same sprite drawn additively: it adds
 * light to what's behind it, so overlapping flames build up to a hot white core and stay bright over
 * smoke (fire, sparks, explosions, magic, glows). Use them as a burst's `mesh`.
 */
export type Shape = "cube" | "sphere" | "plane" | "cylinder" | "cone" | "capsule" | "torus" | "roundedBox" | "puff" | "flame" | "none";

/** Mesh ids of the built-in shapes, as the core and renderer know them. */
export const SHAPE_MESH: Record<Shape, number> = {
  cube: 0,
  sphere: 1,
  plane: 2,
  cylinder: 3,
  cone: 4,
  capsule: 5,
  torus: 6,
  roundedBox: 7,
  puff: 8,
  flame: 9,
  none: 15,
};

export type Camera = {
  eye: [number, number, number];
  target: [number, number, number];
  /** Vertical field of view in radians (ignored when `ortho` is set). */
  fov: number;
  /** Orthographic: half the visible height in world units. Board and puzzle games look flat and tidy. */
  ortho?: number;
  /**
   * Chase an entity: each frame the target moves toward it and the eye keeps `offset` from the target.
   * `smoothing` is roughly the seconds it takes to catch up (0 = rigid, default 0.15).
   */
  follow?: { target: Entity; offset: Vec3; smoothing?: number } | null;
  /** Shake strength in world units (e.g. 0.3 for a hit). Fades out by itself. */
  shake?: number;
};

export type Light = {
  /** Direction *towards* the light. Need not be normalized. */
  direction: [number, number, number];
  /** 0..1 ambient term. */
  ambient: number;
  /** Cast shadows (one directional shadow map centred on the camera target). Default true. */
  shadows?: boolean;
  /** Half-size in world units of the shadowed area around the camera target. Default 30. */
  shadowExtent?: number;
  /**
   * Color and brightness of the light, multiplying both sun and ambient: e.g. [0.35, 0.38, 0.6] for
   * moonlight. Glowing colors (channels above 1) aren't affected. Default [1, 1, 1].
   */
  color?: [number, number, number];
};
