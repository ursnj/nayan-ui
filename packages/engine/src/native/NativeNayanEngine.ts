import { TurboModuleRegistry, type TurboModule } from "react-native";

/**
 * Bridge to the Rust core. Use the `World`, `audio` and `haptics` APIs instead of calling this.
 *
 * Worlds are identified by the number `createWorld` returns; entity ids are opaque numbers.
 * Entities are created and changed with one call each: `spawnDesc` / `setDesc` take a
 * Float64Array's ArrayBuffer encoding every option (layout in core/include/engine_core.h).
 * Capacity is fixed at creation, so the buffers returned by `get*` alias Rust memory (zero-copy)
 * and stay valid until `destroyWorld`.
 */
export interface Spec extends TurboModule {
  createWorld(capacity: number): number;
  destroyWorld(world: number): void;

  /** Returns the entity id, or -1 if the world is full or the description is rejected. */
  spawnDesc(world: number, desc: Object): number;
  /** Returns false if the entity is gone or a field was rejected (the rest still apply). */
  setDesc(world: number, entity: number, desc: Object): boolean;
  /** Returns false for stale or unknown ids. */
  despawn(world: number, entity: number): boolean;
  /** Instant change in momentum (dynamic bodies only). */
  impulse(world: number, entity: number, x: number, y: number, z: number): void;

  setGravity(world: number, x: number, y: number, z: number): void;
  setBounds(world: number, minX: number, minZ: number, maxX: number, maxZ: number): void;
  /** Entity used to pan/attenuate impact sounds (-1 clears). */
  setListener(world: number, entity: number): void;

  /** Returns the hit entity or -1; on a hit the scratch buffer holds distance, normal, point. */
  raycast(
    world: number,
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    maxDistance: number,
    mask: number,
  ): number;
  /** Nearest pickable entity along a ray (as last drawn), or -1; on a hit the scratch buffer holds distance, point. */
  pick(world: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): number;
  /**
   * Write position / velocity to the scratch buffer (`getScratch`). Return false if not alive.
   * `rendered`: where it was last drawn, in world space (otherwise simulated, relative to its parent).
   */
  readPosition(world: number, entity: number, rendered: boolean): boolean;
  readVelocity(world: number, entity: number): boolean;

  /** Replaces the entity's animation (Float64Array buffer, layout in engine_core.h). False if it didn't start. */
  animate(world: number, entity: number, animation: Object): boolean;
  stopAnimation(world: number, entity: number): boolean;
  /** Spawns a particle burst (Float64Array buffer). Returns how many particles were spawned. */
  burst(world: number, burst: Object): number;

  update(world: number, dt: number): void;
  count(world: number): number;

  /** capacity * 16 floats, column-major, grouped by mesh. */
  getMatrices(world: number): Object;
  /** capacity * 4 floats (rgba), same order as the matrices. */
  getColors(world: number): Object;
  /** capacity * 4 floats: texture region (u0 v0 u1 v1), same order as the matrices. */
  getRegions(world: number): Object;
  /** 1024 u32: [first, count] per mesh id (256) for opaque instances, then for transparent ones. */
  getRanges(world: number): Object;
  /** Entities whose animation ended during the last update (room for `capacity`). */
  getDone(world: number): Object;
  doneLength(world: number): number;
  /** Collision events from the last update, 4 u32 each: [a, b, flags, speed as f32 bits]. */
  getEvents(world: number): Object;
  eventLength(world: number): number;
  /** 16 floats. */
  getScratch(world: number): Object;

  // Meshes, models, textures, fonts (global)
  /** Parses a glTF/GLB ArrayBuffer. Returns its mesh id, or -1 (see `loadError`). */
  modelLoad(data: Object, center: boolean, fit: number): number;
  /** 11 floats per vertex (position, normal, color, uv); aliases native memory. */
  modelVertices(mesh: number): Object;
  /** u32 triangle indices; aliases native memory. */
  modelIndices(mesh: number): Object;
  /** Full bounding-box size [x, y, z]. */
  modelSize(mesh: number): Array<number>;
  /** The model's base color texture id, or -1. */
  modelTexture(mesh: number): number;
  /** A new mesh id with `base`'s geometry (to give it another texture), or -1. */
  meshAlias(base: number): number;
  /** Decodes a PNG/JPEG ArrayBuffer. Returns the texture id, or -1. */
  textureLoad(data: Object): number;
  /** RGBA8 pixels, top row first; aliases native memory. */
  texturePixels(texture: number): Object;
  /** [width, height]. */
  textureSize(texture: number): Array<number>;
  /** Builds extruded glyph meshes for `chars`. Returns the font id, or -1. */
  fontLoad(data: Object, depth: number, chars: string): number;
  /** [codepoint, mesh (-1 = nothing drawn), advance, ...] followed by the cap height. */
  fontGlyphs(font: number): Array<number>;
  /** Why the last model / texture / font / alias load failed ("" after a success). */
  loadError(): string;

  // Audio (global)
  /** Decodes a WAV ArrayBuffer. Returns a sound id, or -1. */
  audioLoad(data: Object): number;
  /** Returns a voice id (> 0), or 0 if nothing played. */
  audioPlay(sound: number, volume: number, pan: number, pitch: number, loop: boolean): number;
  audioStop(voice: number): void;
  audioSetVolume(volume: number): void;
  audioSetMuted(muted: boolean): void;
  audioIsRunning(): boolean;

  // Haptics (global)
  hapticsSupported(): boolean;
  /** Taps as flat [time, intensity, sharpness, ...] triples. */
  hapticsPlay(taps: Array<number>, throttle: boolean): void;
}

export default TurboModuleRegistry.get<Spec>("NativeNayanEngine");
