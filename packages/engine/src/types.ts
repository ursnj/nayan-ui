export type Vec3 = readonly [number, number, number];

/** What the renderer draws. `World` implements it; so can any custom simulation. */
export interface RenderSource {
  /** Column-major mat4 per instance (16 floats), grouped by mesh. Only the first `count` are valid. */
  readonly matrices: Float32Array;
  /** RGBA per instance (4 floats), same order as `matrices`. */
  readonly colors: Float32Array;
  /** `[first, count]` per mesh id, in instances: ranges[2 * mesh], ranges[2 * mesh + 1]. */
  readonly ranges: Uint32Array;
  /** Total number of valid instances. */
  readonly count: number;
  /** Maximum number of instances (sizes the GPU buffers). */
  readonly capacity: number;
}

/** Built-in shapes, each 1 unit in size before scaling. */
export type Shape = "cube" | "sphere" | "plane";

/** Mesh ids of the built-in shapes, as the core and renderer know them. Loaded models get ids from 3 up. */
export const SHAPE_MESH: Record<Shape, number> = { cube: 0, sphere: 1, plane: 2 };

export type Camera = {
  eye: [number, number, number];
  target: [number, number, number];
  /** Vertical field of view in radians. */
  fov: number;
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
};
