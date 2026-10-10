import type { Sound } from "../media/audio";
import NativeEngine from "../native/NativeNayanEngine";
import { Mesh, type MeshKind, type RenderSource, type Vec3 } from "../types";

/** True when the native Rust core is linked into this build (it is not in Expo Go). */
export const isRustAvailable = NativeEngine != null;

/** Opaque entity handle. Stale handles (entity despawned) are safely ignored. */
export type Entity = number & { readonly __entity: unique symbol };

export type Color = readonly [number, number, number] | readonly [number, number, number, number];

/**
 * - `dynamic`: moved by physics (gravity, contacts, impulses).
 * - `kinematic`: moved by you (position, velocity, follow); pushes dynamic bodies.
 * - `fixed`: never moves (floors, walls).
 */
export type BodyType = "dynamic" | "kinematic" | "fixed";

export type BodyOptions = {
  type: BodyType;
  /** Slows linear motion over time (air drag). Default 0. */
  linearDamping?: number;
  /** Slows spinning over time. Default 0.05. */
  angularDamping?: number;
  /** Multiplier on world gravity. Default 1. */
  gravityScale?: number;
  /** Keep the body upright (no tumbling). */
  lockRotations?: boolean;
  /** Continuous collision detection for fast, small bodies that could tunnel through walls. */
  ccd?: boolean;
};

export type ColliderOptions = {
  /** Defaults from the mesh: spheres get a ball, everything else a box. */
  shape?: "ball" | "box";
  /** Ball radius. Default: half the largest scale axis. */
  radius?: number;
  /** Box half extents. Default: half the scale (planes get a thin slab). */
  halfExtents?: Vec3;
  /** Layer bits this collider is on. Default 1. */
  layer?: number;
  /**
   * Layers it interacts with. A pair interacts if either side's mask includes the other's layer.
   * Default: everything.
   */
  mask?: number;
  /** Report contacts without pushing (pickups, trigger zones). */
  sensor?: boolean;
  /** Default 0.5. */
  friction?: number;
  /** Bounciness, 0..1. Default 0. */
  restitution?: number;
  /** Mass per volume. Default 1. */
  density?: number;
};

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
  /** Visual bob: rendered position += amplitude * sin(phase), phase advancing `frequency` rad/s. */
  oscillation?: { amplitude: Vec3; frequency: number; phase?: number };
  /** Rigid body. A collider without a body becomes kinematic. */
  body?: BodyType | BodyOptions;
  /** Collider. A body without a collider gets one sized from the mesh and scale. */
  collider?: ColliderOptions;
  /** Chase `target` on the XZ plane at `speed`. Stops if the target is despawned. */
  follow?: { target: Entity; speed: number };
  /** Despawn automatically after this many seconds (shrinks away at the end). */
  lifetime?: number;
  /** Sound/haptic played by the core on impacts, scaled by speed and panned to the listener. */
  impact?: ImpactFeedback;
  /**
   * Attach to another entity: `position`/`rotation` become local to it, the child follows the
   * parent's interpolated pose exactly and despawns with it. Visual only (no body/collider).
   */
  parent?: Entity;
};

/** Sound/haptic the Rust core plays itself when the entity starts touching something solid. */
export type ImpactFeedback = {
  /** A loaded sound (e.g. `bank.get("bump")`). Omit for haptics only. */
  sound?: Sound;
  /** Impacts slower than this are silent. Default 1. */
  minSpeed?: number;
  /** Full volume / strength at this speed and above. Default 10. */
  maxSpeed?: number;
  /** Volume at full strength, 0..2. Default 1. */
  volume?: number;
  /** Haptic intensity at full strength, 0..1. Default 0 (none). */
  haptic?: number;
};

export type CollisionInfo = {
  /** True when the pair started touching; false when it stopped. */
  started: boolean;
  /** A sensor was involved (no physical response). */
  sensor: boolean;
  /** Relative speed at the moment of impact (0 for "stopped"). Use it to scale sounds/haptics. */
  speed: number;
};

export type RaycastHit = {
  entity: Entity;
  distance: number;
  normal: [number, number, number];
  point: [number, number, number];
};

const BODY_KIND: Record<BodyType, number> = { dynamic: 1, kinematic: 2, fixed: 3 };
const EVENT_STRIDE = 4;
const EVENT_STARTED = 1;
const EVENT_SENSOR = 2;

/**
 * The game world, simulated by the Rust core: transforms, motion, chasing, Rapier rigid-body
 * physics, collision events and raycasts. JS issues a handful of calls per frame; the render
 * buffers alias Rust memory. Implements `RenderSource`, so it can go straight into `<GameView>`.
 *
 * Simulation runs at a fixed 60 Hz; rendering interpolates between steps.
 * Capacity is fixed up front; despawn frees room for new entities.
 */
export class World implements RenderSource {
  readonly matrices: Float32Array;
  readonly colors: Float32Array;
  readonly ranges: Uint32Array;
  private readonly events: Uint32Array;
  private readonly eventFloats: Float32Array;
  private readonly scratch: Float32Array;
  private readonly id: number;
  private readonly info: CollisionInfo = { started: false, sensor: false, speed: 0 };
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
    const events = buffer(NativeEngine.getEvents(this.id));
    this.events = new Uint32Array(events);
    this.eventFloats = new Float32Array(events);
    this.scratch = new Float32Array(buffer(NativeEngine.getScratch(this.id)));
  }

  /** Number of live entities. */
  get count() {
    return this.disposed ? 0 : this.native.count(this.id);
  }

  private get native() {
    if (this.disposed) throw new Error("World: used after dispose()");
    return NativeEngine!;
  }

  // ── Entities ─────────────────────────────────────────────────────────

  /** Adds an entity. Throws if the world is full or the physics description is invalid. */
  spawn(options: SpawnOptions = {}): Entity {
    const n = this.native;
    const {
      mesh = Mesh.Cube,
      position = [0, 0, 0],
      scale = 1,
      color = [1, 1, 1, 1],
      rotation,
      velocity,
      angularVelocity,
      oscillation,
      body,
      collider,
      follow,
      lifetime,
      parent,
      impact,
    } = options;
    if (parent !== undefined && (body || collider)) {
      throw new Error("World: attached entities can't have a body or collider");
    }
    const s: Vec3 = typeof scale === "number" ? [scale, scale, scale] : scale;
    const e = n.spawn(this.id, mesh, ...position, ...s, color[0], color[1], color[2], color[3] ?? 1);
    if (e < 0) throw new Error(`World: cannot spawn (capacity ${this.capacity} reached, or invalid mesh/position)`);
    const entity = e as Entity;

    if (rotation) n.setRotation(this.id, e, ...rotation);
    if (velocity) n.setVelocity(this.id, e, ...velocity);
    if (angularVelocity) n.setAngularVelocity(this.id, e, ...angularVelocity);
    if (oscillation) n.setOscillation(this.id, e, ...oscillation.amplitude, oscillation.frequency, oscillation.phase ?? 0);
    if (body || collider) {
      if (!this.setPhysics(entity, { mesh, scale: s, body, collider })) {
        n.despawn(this.id, e);
        throw new Error("World: invalid body/collider options (sizes and density must be positive)");
      }
    }
    if (follow) n.setFollow(this.id, e, follow.target, follow.speed);
    if (lifetime) n.setLifetime(this.id, e, lifetime);
    if (impact) this.setImpactFeedback(entity, impact);
    if (parent !== undefined && !n.setParent(this.id, e, parent)) {
      n.despawn(this.id, e);
      throw new Error("World: cannot attach (parent missing, parent is itself attached, or nesting too deep)");
    }
    return entity;
  }

  /** Removes an entity. Returns false if it was already gone. */
  despawn(e: Entity): boolean {
    return this.native.despawn(this.id, e);
  }

  /**
   * Attach to `parent` (null detaches; the child then keeps its local values as world values).
   * One level only, no bodies. Returns false if rejected.
   */
  setParent(e: Entity, parent: Entity | null): boolean {
    return this.native.setParent(this.id, e, parent ?? -1);
  }

  // ── Transform & appearance ───────────────────────────────────────────

  /** Teleports the entity (and its body). For attached entities this is the local offset. */
  setPosition(e: Entity, [x, y, z]: Vec3) {
    this.native.setPosition(this.id, e, x, y, z);
  }

  setRotation(e: Entity, [x, y, z, w]: readonly [number, number, number, number]) {
    this.native.setRotation(this.id, e, x, y, z, w);
  }

  /** Visual only; does not resize an existing collider. */
  setScale(e: Entity, [x, y, z]: Vec3) {
    this.native.setScale(this.id, e, x, y, z);
  }

  setColor(e: Entity, [r, g, b, a = 1]: Color) {
    this.native.setColor(this.id, e, r, g, b, a);
  }

  // ── Motion ───────────────────────────────────────────────────────────

  /** Units per second. For dynamic bodies this sets their current velocity. */
  setVelocity(e: Entity, [x, y, z]: Vec3) {
    this.native.setVelocity(this.id, e, x, y, z);
  }

  /** Sets X/Z velocity and keeps Y, so a steered dynamic body still falls. */
  setPlanarVelocity(e: Entity, x: number, z: number) {
    this.native.setPlanarVelocity(this.id, e, x, z);
  }

  setAngularVelocity(e: Entity, [x, y, z]: Vec3) {
    this.native.setAngularVelocity(this.id, e, x, y, z);
  }

  /** Instant change in momentum (dynamic bodies only). */
  applyImpulse(e: Entity, [x, y, z]: Vec3) {
    this.native.applyImpulse(this.id, e, x, y, z);
  }

  /** Visual bob: rendered position += amplitude * sin(phase). Pass a zero amplitude to stop. */
  setOscillation(e: Entity, { amplitude, frequency, phase = 0 }: { amplitude: Vec3; frequency: number; phase?: number }) {
    this.native.setOscillation(this.id, e, ...amplitude, frequency, phase);
  }

  setFollow(e: Entity, target: Entity, speed: number) {
    this.native.setFollow(this.id, e, target, speed);
  }

  /** Despawn after `seconds`; 0 clears it. */
  setLifetime(e: Entity, seconds: number) {
    this.native.setLifetime(this.id, e, seconds);
  }

  /** Non-dynamic movers are clamped to this XZ rectangle. Dynamic bodies need walls. */
  setBounds(minX: number, minZ: number, maxX: number, maxZ: number) {
    this.native.setBounds(this.id, minX, minZ, maxX, maxZ);
  }

  // ── Physics ──────────────────────────────────────────────────────────

  /**
   * The core plays `feedback` itself whenever this entity starts touching something solid: volume
   * and haptic strength scale with impact speed, and the sound is panned relative to the listener.
   * No JS runs per impact. `null` removes it.
   */
  setImpactFeedback(e: Entity, feedback: ImpactFeedback | null) {
    const { sound, minSpeed = 1, maxSpeed = 10, volume = 1, haptic = 0 } = feedback ?? {};
    this.native.setImpactFeedback(this.id, e, feedback !== null, sound ?? -1, minSpeed, maxSpeed, volume, haptic);
  }

  /** Impact sounds are panned/attenuated relative to this entity (usually the player). */
  setListener(e: Entity | null) {
    this.native.setListener(this.id, e ?? -1);
  }

  setGravity([x, y, z]: Vec3) {
    this.native.setGravity(this.id, x, y, z);
  }

  /**
   * Replaces the entity's body/collider (`null` removes them). `mesh`/`scale` size the default
   * collider. Returns false if the options are invalid.
   */
  setPhysics(
    e: Entity,
    options: { body?: BodyType | BodyOptions; collider?: ColliderOptions; mesh?: MeshKind; scale?: Vec3 } | null,
  ): boolean {
    const n = this.native;
    if (!options) {
      return n.setPhysics(this.id, e, 0, 0, 1, 1, 1, 0, 0, false, 0, 0, 1, 0, 0, 1, false, false);
    }
    const { mesh = Mesh.Cube, scale = [1, 1, 1], collider = {} } = options;
    const body: BodyOptions =
      typeof options.body === "string" ? { type: options.body } : (options.body ?? { type: "kinematic" });
    const ball = (collider.shape ?? (mesh === Mesh.Sphere ? "ball" : "box")) === "ball";
    const size: Vec3 = ball
      ? [collider.radius ?? Math.max(...scale) / 2, 0, 0]
      : (collider.halfExtents ?? [scale[0] / 2, mesh === Mesh.Plane ? 0.05 : scale[1] / 2, scale[2] / 2]);
    return n.setPhysics(
      this.id,
      e,
      BODY_KIND[body.type],
      ball ? 0 : 1,
      ...size,
      collider.layer ?? 1,
      collider.mask ?? -1,
      collider.sensor ?? false,
      collider.friction ?? 0.5,
      collider.restitution ?? 0,
      collider.density ?? 1,
      body.linearDamping ?? 0,
      body.angularDamping ?? 0.05,
      body.gravityScale ?? 1,
      body.lockRotations ?? false,
      body.ccd ?? false,
    );
  }

  /**
   * First solid (non-sensor) collider hit along the ray whose layer intersects `mask`,
   * as of the last `update`. `direction` need not be normalized.
   */
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask = -1): RaycastHit | null {
    const hit = this.native.raycast(this.id, ...origin, ...direction, maxDistance, mask);
    if (hit < 0) return null;
    const s = this.scratch;
    return {
      entity: hit as Entity,
      distance: s[0]!,
      normal: [s[1]!, s[2]!, s[3]!],
      point: [s[4]!, s[5]!, s[6]!],
    };
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /** Current position, or null if the entity is gone. */
  position(e: Entity): [number, number, number] | null {
    if (!this.native.readPosition(this.id, e)) return null;
    return [this.scratch[0]!, this.scratch[1]!, this.scratch[2]!];
  }

  /** Current linear velocity, or null if the entity is gone. */
  velocity(e: Entity): [number, number, number] | null {
    if (!this.native.readVelocity(this.id, e)) return null;
    return [this.scratch[0]!, this.scratch[1]!, this.scratch[2]!];
  }

  // ── Simulation ───────────────────────────────────────────────────────

  /** Advances the simulation (fixed 60 Hz steps) and refreshes the render buffers. */
  update(dt: number) {
    this.native.update(this.id, dt);
  }

  /**
   * Calls `fn` for each contact that started or stopped during the last `update`.
   * `info` is reused between calls: copy what you need. Either entity may already have been
   * despawned by an earlier callback; `despawn` and the setters ignore stale ids.
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

  /** Frees the native world. Any further call throws. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    NativeEngine!.destroyWorld(this.id);
  }
}
