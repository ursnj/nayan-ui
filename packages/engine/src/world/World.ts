import type { Sound } from "../media/audio";
import NativeEngine from "../native/NativeNayanEngine";
import type { MeshKind, RenderSource, Vec3 } from "../types";
import { DESC_LEN, encode } from "./desc";

/** True when the native Rust core is linked into this build (it is not in Expo Go). */
export const isRustAvailable = NativeEngine != null;

/** Opaque entity handle. Handles of despawned entities are safely ignored. */
export type Entity = number & { readonly __entity: unique symbol };

export type Color = readonly [number, number, number] | readonly [number, number, number, number];
export type Quat = readonly [number, number, number, number];

/**
 * - `dynamic`: moved by physics (gravity, collisions, impulses).
 * - `kinematic`: moved by you; pushes dynamic bodies out of the way.
 * - `fixed`: never moves (floors, walls).
 */
export type BodyType = "dynamic" | "kinematic" | "fixed";

export type PhysicsOptions = {
  type: BodyType;
  /** Default: from the mesh (spheres get a ball, everything else a box). */
  shape?: "ball" | "box";
  /** Ball radius. Default: half the entity's largest scale axis. */
  radius?: number;
  /** Box size (full width, height, depth). Default: the entity's scale. */
  size?: Vec3;
  /** Layer bits this collider is on. Default 1. */
  layer?: number;
  /** Layers it interacts with. Either side's mask is enough. Default: all. */
  mask?: number;
  /** Reports touches but doesn't push: pickups, trigger zones. */
  sensor?: boolean;
  /** How grippy, default 0.5. */
  friction?: number;
  /** Bounciness 0..1, default 0. */
  bounce?: number;
  /** Mass per volume, default 1. */
  density?: number;
  /** Slows movement over time (air resistance), default 0. */
  drag?: number;
  /** Slows spinning over time, default 0.05. */
  angularDrag?: number;
  /** Multiplier on world gravity, default 1. */
  gravityScale?: number;
  /** Stays upright: never tumbles. */
  upright?: boolean;
  /** Stops fast, small bodies passing through walls. */
  ccd?: boolean;
};

/** Sound/haptic the core plays by itself when the entity hits something solid. */
export type ImpactFeedback = {
  /** A loaded sound, e.g. `sfx.get("bump")`. Omit for haptics only. */
  sound?: Sound;
  /** Slower impacts are silent. Default 1. */
  minSpeed?: number;
  /** Full volume and strength at this speed. Default 10. */
  maxSpeed?: number;
  /** Volume at full strength, 0..2. Default 1. */
  volume?: number;
  /** Vibration at full strength, 0..1. Default 0 (none). */
  haptic?: number;
};

/**
 * Everything about an entity. `spawn` and `set` take the same options; in `set`, only what you
 * pass changes, and `null` removes something (physics, parent, follow, bob, lifetime, impact).
 */
export type EntityOptions = {
  mesh?: MeshKind;
  /** Relative to the parent when attached. */
  position?: Vec3;
  rotation?: Quat;
  /** A number scales uniformly. Visual only after the body exists. */
  scale?: Vec3 | number;
  color?: Color;
  /** Units per second. */
  velocity?: Vec3;
  /** Sets horizontal speed [x, z] and keeps the vertical one: steer a body and it still falls. */
  groundVelocity?: readonly [number, number];
  /** Radians per second around each axis. */
  spin?: Vec3;
  /** Visual bob: the drawn position moves by amplitude * sin(phase), phase advancing at `speed`. */
  bob?: { amplitude: Vec3; speed: number; phase?: number } | null;
  /** Chase `target` along the ground at `speed`. */
  follow?: { target: Entity; speed: number } | null;
  /** Seconds until it shrinks away and is despawned. */
  lifetime?: number | null;
  /** Attach to another entity: it follows the parent exactly and is despawned with it. Visual only. */
  parent?: Entity | null;
  physics?: BodyType | PhysicsOptions | null;
  impact?: ImpactFeedback | null;
};

export type CollisionInfo = {
  /** True when the touch started; false when it ended. */
  started: boolean;
  /** A sensor was involved. */
  sensor: boolean;
  /** Impact speed (0 when a touch ends). */
  speed: number;
};

export type RaycastHit = {
  entity: Entity;
  distance: number;
  normal: [number, number, number];
  point: [number, number, number];
};

export type Bounds = readonly [minX: number, minZ: number, maxX: number, maxZ: number];

const EVENT_STRIDE = 4;
const EVENT_STARTED = 1;
const EVENT_SENSOR = 2;

/**
 * A game world, simulated by the Rust core: entities, motion, Rapier physics, collisions and
 * raycasts at a fixed 60 Hz, with rendering smoothed between steps. Pass it to `<GameView>`.
 *
 * ```ts
 * const world = new World(500);
 * const ball = world.spawn({ mesh: Mesh.Sphere, position: [0, 5, 0], physics: "dynamic" });
 * world.set(ball, { color: [1, 0, 0] });
 * ```
 */
export class World implements RenderSource {
  readonly matrices: Float32Array;
  readonly colors: Float32Array;
  readonly ranges: Uint32Array;
  private readonly events: Uint32Array;
  private readonly eventFloats: Float32Array;
  private readonly scratch: Float32Array;
  private readonly desc = new Float64Array(DESC_LEN);
  private readonly info: CollisionInfo = { started: false, sensor: false, speed: 0 };
  private readonly id: number;
  private disposed = false;
  private gravityValue: Vec3 = [0, -9.81, 0];
  private boundsValue: Bounds | null = null;
  private listenerValue: Entity | null = null;

  constructor(readonly capacity: number) {
    if (!NativeEngine) {
      throw new Error("@nayan-ui/engine: the native core is not linked into this build (Expo Go?).");
    }
    this.id = NativeEngine.createWorld(capacity);
    const buffer = (o: Object) => o as ArrayBuffer;
    this.matrices = new Float32Array(buffer(NativeEngine.getMatrices(this.id)));
    this.colors = new Float32Array(buffer(NativeEngine.getColors(this.id)));
    this.ranges = new Uint32Array(buffer(NativeEngine.getRanges(this.id)));
    const events = buffer(NativeEngine.getEvents(this.id));
    this.events = new Uint32Array(events);
    this.eventFloats = new Float32Array(events);
    this.scratch = new Float32Array(buffer(NativeEngine.getScratch(this.id)));
  }

  private get native() {
    if (this.disposed) throw new Error("World: used after dispose()");
    return NativeEngine!;
  }

  /** Live entities. */
  get count() {
    return this.disposed ? 0 : this.native.count(this.id);
  }

  // ── Entities ─────────────────────────────────────────────────────────

  /** Adds an entity (one native call). Throws if the world is full or an option is invalid. */
  spawn(options: EntityOptions = {}): Entity {
    if (options.parent != null && options.physics != null) {
      throw new Error("World.spawn: attached entities can't have physics (put it on the parent)");
    }
    encode(this.desc, options);
    const e = this.native.spawnDesc(this.id, this.desc.buffer);
    if (e < 0) {
      throw new Error(
        this.count >= this.capacity
          ? `World.spawn: the world is full (capacity ${this.capacity})`
          : "World.spawn: invalid options (sizes and density must be positive, the parent must exist)",
      );
    }
    return e as Entity;
  }

  /**
   * Changes an entity (one native call). Only the options you pass change; `null` removes.
   * Returns false if the entity is gone or an option was rejected (the others still apply).
   */
  set(e: Entity, options: EntityOptions): boolean {
    encode(this.desc, options);
    return this.native.setDesc(this.id, e, this.desc.buffer);
  }

  /** Removes an entity and anything attached to it. Returns false if it was already gone. */
  despawn(e: Entity): boolean {
    return this.native.despawn(this.id, e);
  }

  /** A one-off push: jump, explosion, knockback (dynamic bodies only). */
  impulse(e: Entity, [x, y, z]: Vec3) {
    this.native.impulse(this.id, e, x, y, z);
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /** Current position, or null if the entity is gone. Pass `out` to avoid allocating every frame. */
  position(e: Entity, out: [number, number, number] = [0, 0, 0]): [number, number, number] | null {
    return this.native.readPosition(this.id, e) ? this.copyScratch(out) : null;
  }

  /** Current velocity, or null if the entity is gone. Pass `out` to avoid allocating every frame. */
  velocity(e: Entity, out: [number, number, number] = [0, 0, 0]): [number, number, number] | null {
    return this.native.readVelocity(this.id, e) ? this.copyScratch(out) : null;
  }

  /** True while the entity exists. */
  has(e: Entity): boolean {
    return this.native.readPosition(this.id, e);
  }

  /** First solid (non-sensor) collider along the ray whose layer is in `mask`, as of the last update. */
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask = -1): RaycastHit | null {
    const hit = this.native.raycast(this.id, ...origin, ...direction, maxDistance, mask);
    if (hit < 0) return null;
    const s = this.scratch;
    return { entity: hit as Entity, distance: s[0]!, normal: [s[1]!, s[2]!, s[3]!], point: [s[4]!, s[5]!, s[6]!] };
  }

  private copyScratch(out: [number, number, number]) {
    out[0] = this.scratch[0]!;
    out[1] = this.scratch[1]!;
    out[2] = this.scratch[2]!;
    return out;
  }

  // ── World settings ───────────────────────────────────────────────────

  /** Default [0, -9.81, 0]. */
  get gravity(): Vec3 {
    return this.gravityValue;
  }
  set gravity(g: Vec3) {
    this.gravityValue = g;
    this.native.setGravity(this.id, g[0], g[1], g[2]);
  }

  /** Keeps moving non-physics entities inside [minX, minZ, maxX, maxZ]. Physics bodies need walls. */
  get bounds(): Bounds | null {
    return this.boundsValue;
  }
  set bounds(b: Bounds | null) {
    this.boundsValue = b;
    const [minX, minZ, maxX, maxZ] = b ?? [-1e9, -1e9, 1e9, 1e9];
    this.native.setBounds(this.id, minX, minZ, maxX, maxZ);
  }

  /** Impact sounds pan and fade relative to this entity (usually the player). */
  get listener(): Entity | null {
    return this.listenerValue;
  }
  set listener(e: Entity | null) {
    this.listenerValue = e;
    this.native.setListener(this.id, e ?? -1);
  }

  // ── Simulation ───────────────────────────────────────────────────────

  /** Advances the simulation (fixed 60 Hz steps) and refreshes what GameView draws. */
  update(dt: number) {
    this.native.update(this.id, dt);
  }

  /**
   * Calls `fn` for each touch that started or ended during the last `update`. `info` is reused:
   * copy what you need. Either entity may already be despawned by an earlier callback.
   */
  forEachCollision(fn: (a: Entity, b: Entity, info: CollisionInfo) => void) {
    const length = this.native.eventLength(this.id);
    const info = this.info;
    for (let i = 0; i + EVENT_STRIDE <= length; i += EVENT_STRIDE) {
      const flags = this.events[i + 2]!;
      info.started = (flags & EVENT_STARTED) !== 0;
      info.sensor = (flags & EVENT_SENSOR) !== 0;
      info.speed = this.eventFloats[i + 3]!;
      fn(this.events[i]! as Entity, this.events[i + 1]! as Entity, info);
    }
  }

  /** Frees the native world. Any later call throws. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    NativeEngine!.destroyWorld(this.id);
  }
}
