import NativeEngine from "./specs/NativeNayanEngine";
import { Mesh, type MeshKind, type RenderSource, type Vec3 } from "./types";

/** True when the native Rust core is linked into this build (it is not in Expo Go). */
export const isRustAvailable = NativeEngine != null;

/** Opaque entity handle. Stale handles (entity despawned) are safely ignored. */
export type Entity = number & { readonly __entity: unique symbol };

export type Color = readonly [number, number, number] | readonly [number, number, number, number];

export type SpawnOptions = {
  mesh?: MeshKind;
  position?: Vec3;
  /** A number scales uniformly. */
  scale?: Vec3 | number;
  color?: Color;
  /** Quaternion (x, y, z, w). */
  rotation?: readonly [number, number, number, number];
  /** Units per second. */
  velocity?: Vec3;
  /** Radians per second about each world axis. */
  angularVelocity?: Vec3;
  /** Bob the entity: position += amplitude * sin(phase), phase advancing `frequency` rad/s. */
  oscillation?: { amplitude: Vec3; frequency: number; phase?: number };
  /** Sphere collider. Collides with entities whose `layer` intersects this `mask` (or vice versa). */
  collider?: { radius: number; layer?: number; mask?: number };
  /** Chase `target` on the XZ plane. Stops if the target is despawned. */
  follow?: { target: Entity; speed: number };
};

/**
 * A simulation backed by the Rust core. Transforms, motion, chasing and collision detection run
 * natively; JS only issues a handful of calls per frame. Implements `RenderSource`, so it can be
 * handed straight to `<GameView>`.
 *
 * Capacity is fixed up front. Despawn frees room for new entities.
 */
export class World implements RenderSource {
  readonly matrices: Float32Array;
  readonly colors: Float32Array;
  readonly ranges: Uint32Array;
  private readonly events: Uint32Array;
  private readonly scratch: Float32Array;
  private readonly id: number;
  private disposed = false;

  constructor(readonly capacity: number) {
    if (!NativeEngine) {
      throw new Error("@nayan-ui/engine: the native Rust core is not available in this build.");
    }
    this.id = NativeEngine.createWorld(capacity);
    const buffer = (o: Object) => o as ArrayBuffer;
    this.matrices = new Float32Array(buffer(NativeEngine.getMatrices(this.id)));
    this.colors = new Float32Array(buffer(NativeEngine.getColors(this.id)));
    this.ranges = new Uint32Array(buffer(NativeEngine.getRanges(this.id)));
    this.events = new Uint32Array(buffer(NativeEngine.getEvents(this.id)));
    this.scratch = new Float32Array(buffer(NativeEngine.getScratch(this.id)));
  }

  /** Number of live entities. */
  get count() {
    return this.disposed ? 0 : NativeEngine!.count(this.id);
  }

  /** Adds an entity. Throws if the world is full. */
  spawn(options: SpawnOptions = {}): Entity {
    const n = NativeEngine!;
    const {
      mesh = Mesh.Cube,
      position = [0, 0, 0],
      scale = 1,
      color = [1, 1, 1, 1],
      rotation,
      velocity,
      angularVelocity,
      oscillation,
      collider,
      follow,
    } = options;
    const [sx, sy, sz] = typeof scale === "number" ? [scale, scale, scale] : scale;
    const e = n.spawn(this.id, mesh, ...position, sx, sy, sz, color[0], color[1], color[2], color[3] ?? 1);
    if (e < 0) throw new Error(`World: cannot spawn (capacity ${this.capacity} reached, or invalid mesh ${mesh})`);

    if (rotation) n.setRotation(this.id, e, ...rotation);
    if (velocity) n.setVelocity(this.id, e, ...velocity);
    if (angularVelocity) n.setAngularVelocity(this.id, e, ...angularVelocity);
    if (oscillation) n.setOscillation(this.id, e, ...oscillation.amplitude, oscillation.frequency, oscillation.phase ?? 0);
    if (collider) n.setCollider(this.id, e, collider.radius, collider.layer ?? 1, collider.mask ?? 0);
    if (follow) n.setFollow(this.id, e, follow.target, follow.speed);
    return e as Entity;
  }

  /** Removes an entity. Returns false if it was already gone. */
  despawn(e: Entity): boolean {
    return NativeEngine!.despawn(this.id, e);
  }

  setPosition(e: Entity, [x, y, z]: Vec3) {
    NativeEngine!.setPosition(this.id, e, x, y, z);
  }

  setVelocity(e: Entity, [x, y, z]: Vec3) {
    NativeEngine!.setVelocity(this.id, e, x, y, z);
  }

  setColor(e: Entity, [r, g, b, a = 1]: Color) {
    NativeEngine!.setColor(this.id, e, r, g, b, a);
  }

  setScale(e: Entity, [x, y, z]: Vec3) {
    NativeEngine!.setScale(this.id, e, x, y, z);
  }

  setFollow(e: Entity, target: Entity, speed: number) {
    NativeEngine!.setFollow(this.id, e, target, speed);
  }

  /** Moving entities are clamped to this XZ rectangle. */
  setBounds(minX: number, minZ: number, maxX: number, maxZ: number) {
    NativeEngine!.setBounds(this.id, minX, minZ, maxX, maxZ);
  }

  /** Base position (without oscillation), or null if the entity is gone. */
  position(e: Entity): [number, number, number] | null {
    if (!NativeEngine!.readPosition(this.id, e)) return null;
    return [this.scratch[0]!, this.scratch[1]!, this.scratch[2]!];
  }

  update(dt: number) {
    NativeEngine!.update(this.id, dt);
  }

  /**
   * Calls `fn` for every overlapping collider pair found by the last `update` (each frame while
   * they overlap). Either id may already be despawned by an earlier callback; `despawn` and the
   * setters ignore stale ids.
   */
  forEachCollision(fn: (a: Entity, b: Entity) => void) {
    const length = NativeEngine!.eventLength(this.id);
    for (let i = 0; i + 1 < length; i += 2) fn(this.events[i]! as Entity, this.events[i + 1]! as Entity);
  }

  /** Frees the native world. The buffers must not be used afterwards. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    NativeEngine!.destroyWorld(this.id);
  }
}
