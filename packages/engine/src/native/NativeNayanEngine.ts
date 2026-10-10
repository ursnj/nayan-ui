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
  /** Write position / velocity to the scratch buffer (`getScratch`). Return false if not alive. */
  readPosition(world: number, entity: number): boolean;
  readVelocity(world: number, entity: number): boolean;

  update(world: number, dt: number): void;
  count(world: number): number;

  /** capacity * 16 floats, column-major, grouped by mesh. */
  getMatrices(world: number): Object;
  /** capacity * 4 floats (rgba), same order as the matrices. */
  getColors(world: number): Object;
  /** 16 u32: [first, count] per mesh id (8 meshes). */
  getRanges(world: number): Object;
  /** Collision events from the last update, 4 u32 each: [a, b, flags, speed as f32 bits]. */
  getEvents(world: number): Object;
  eventLength(world: number): number;
  /** 16 floats. */
  getScratch(world: number): Object;

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
