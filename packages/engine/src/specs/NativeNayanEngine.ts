import { TurboModuleRegistry, type TurboModule } from "react-native";

/**
 * Bridge to the Rust core. Worlds are identified by the number `createWorld` returns.
 * Capacity is fixed at creation; `getMatrices` returns an ArrayBuffer that aliases Rust memory
 * (zero-copy) and stays valid until `destroyWorld`.
 */
export interface Spec extends TurboModule {
  createWorld(capacity: number): number;
  destroyWorld(world: number): void;
  /** Returns the entity id, or -1 if the world is full. */
  spawn(world: number, x: number, y: number, z: number, sx: number, sy: number, sz: number): number;
  setAngularVelocity(world: number, entity: number, x: number, y: number, z: number): void;
  /** Rotation as a quaternion (x, y, z, w). */
  setRotation(world: number, entity: number, x: number, y: number, z: number, w: number): void;
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
  update(world: number, dt: number): void;
  count(world: number): number;
  getMatrices(world: number): Object;
}

export default TurboModuleRegistry.get<Spec>("NativeNayanEngine");
