import NativeEngine from "./specs/NativeNayanEngine";
import type { Simulation } from "./types";

/** True when the native Rust core is linked into this build (it is not in Expo Go). */
export const isRustAvailable = NativeEngine != null;

type Vec3 = readonly [number, number, number];

/**
 * Simulation backed by the Rust core. Transforms are computed natively and `matrices`
 * aliases Rust memory (zero-copy), so there is no per-frame marshalling.
 *
 * Capacity is fixed up front; spawn everything before mounting the GameView.
 */
export class RustSimulation implements Simulation {
  matrices: Float32Array<ArrayBuffer> = new Float32Array(0);
  private world: number;
  private disposed = false;

  constructor(readonly capacity: number) {
    if (!NativeEngine) {
      throw new Error("@nayan-ui/engine: the native Rust core is not available in this build.");
    }
    this.world = NativeEngine.createWorld(capacity);
  }

  get count() {
    return this.disposed ? 0 : NativeEngine!.count(this.world);
  }

  /** Adds an entity and returns its id. Throws when the world is full. */
  spawn(position: Vec3, options: { scale?: Vec3; angularVelocity?: Vec3 } = {}): number {
    const { scale = [1, 1, 1], angularVelocity } = options;
    const id = NativeEngine!.spawn(this.world, ...position, ...scale);
    if (id < 0) throw new Error(`RustSimulation: capacity (${this.capacity}) exceeded`);
    if (angularVelocity) NativeEngine!.setAngularVelocity(this.world, id, ...angularVelocity);
    // Capacity is fixed, so the pointer is stable; re-wrap so the view covers the new length.
    this.matrices = new Float32Array(NativeEngine!.getMatrices(this.world) as ArrayBuffer);
    return id;
  }

  update(dt: number) {
    NativeEngine!.update(this.world, dt);
  }

  /** Frees the native world. `matrices` must not be used afterwards. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.matrices = new Float32Array(0);
    NativeEngine!.destroyWorld(this.world);
  }
}
