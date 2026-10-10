import { TurboModuleRegistry, type TurboModule } from "react-native";

/**
 * Bridge to the Rust core. Use the `World` class instead of calling this directly.
 *
 * Worlds are identified by the number `createWorld` returns. Entity ids are opaque numbers.
 * Capacity is fixed at creation, so the buffers returned by `get*` alias Rust memory
 * (zero-copy) and stay valid until `destroyWorld`.
 */
export interface Spec extends TurboModule {
  createWorld(capacity: number): number;
  destroyWorld(world: number): void;

  /** Returns the entity id, or -1 if the world is full or `mesh` is invalid. */
  spawn(
    world: number,
    mesh: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ): number;
  /** Returns false for stale or unknown ids. */
  despawn(world: number, entity: number): boolean;

  setPosition(world: number, entity: number, x: number, y: number, z: number): void;
  /** Rotation as a quaternion (x, y, z, w). */
  setRotation(world: number, entity: number, x: number, y: number, z: number, w: number): void;
  setScale(world: number, entity: number, x: number, y: number, z: number): void;
  setColor(world: number, entity: number, r: number, g: number, b: number, a: number): void;
  setVelocity(world: number, entity: number, x: number, y: number, z: number): void;
  setAngularVelocity(world: number, entity: number, x: number, y: number, z: number): void;
  /** Offsets position by `amplitude * sin(phase)`; `phase` starts at `phase` and advances `frequency` rad/s. */
  setOscillation(
    world: number,
    entity: number,
    ax: number,
    ay: number,
    az: number,
    frequency: number,
    phase: number,
  ): void;
  setCollider(world: number, entity: number, radius: number, layer: number, mask: number): void;
  /** Move toward `target` on the XZ plane at `speed`; speed <= 0 stops. */
  setFollow(world: number, entity: number, target: number, speed: number): void;
  setBounds(world: number, minX: number, minZ: number, maxX: number, maxZ: number): void;

  /** Writes the position to the scratch buffer (`getScratch`). Returns false if not alive. */
  readPosition(world: number, entity: number): boolean;

  update(world: number, dt: number): void;
  count(world: number): number;

  /** capacity * 16 floats, column-major, grouped by mesh. */
  getMatrices(world: number): Object;
  /** capacity * 4 floats (rgba), same order as the matrices. */
  getColors(world: number): Object;
  /** 16 u32: [first, count] per mesh id (8 meshes). */
  getRanges(world: number): Object;
  /** Collision pairs from the last update, as u32 [a0, b0, a1, b1, ...]; valid length is `eventLength`. */
  getEvents(world: number): Object;
  eventLength(world: number): number;
  /** 16 floats. */
  getScratch(world: number): Object;
}

export default TurboModuleRegistry.get<Spec>("NativeNayanEngine");
