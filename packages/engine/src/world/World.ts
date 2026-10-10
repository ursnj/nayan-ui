import { mat4, vec4 } from "wgpu-matrix";
import { layoutText, type Font, type TextAlign } from "../assets/font";
import type { Model } from "../assets/model";
import { texturedMesh, type Texture } from "../assets/texture";
import type { Sound } from "../media/audio";
import NativeEngine from "../native/NativeNayanEngine";
import { SHAPE_MESH, type RenderSource, type Shape, type Vec3 } from "../types";
import { ANIM_HEADER, ANIM_KEY_LEN, BURST_LEN, DESC_LEN, EASING, encode } from "./desc";

/** True when the engine's native code is linked into this build (it is not in Expo Go). */
export const isEngineAvailable = NativeEngine != null;

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
  /** Default: matches the mesh (spheres get a ball, cylinders a cylinder, ...; anything else a box). */
  shape?: "ball" | "box" | "cylinder" | "capsule" | "cone";
  /** Ball, cylinder, capsule or cone radius. Default: from the entity's size. */
  radius?: number;
  /** Cylinder, capsule or cone height (total). Default: from the entity's size. */
  height?: number;
  /** Box size (full width, height, depth). Default: the entity's size. */
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
  /** 2D games: stays in its XY plane (moves in x/y, spins only around z). Keep the camera looking down -z. */
  planar?: boolean;
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
  /** A built-in shape or a model from `loadModel`. Default "cube". */
  mesh?: Shape | Model;
  /** An image from `loadTexture`, drawn on the mesh (`null` = none). In `set`, pass `mesh` with it. */
  texture?: Texture | null;
  /** Part of the texture to show, [u0, v0, u1, v1] from 0..1 (sprite sheets, card atlases). */
  textureRegion?: readonly [number, number, number, number];
  /** 3D text instead of a mesh (needs `font`). Letters are 1 unit tall at scale 1. */
  text?: string;
  /** A font from `loadFont`, for `text`. */
  font?: Font;
  /** Text alignment around `position`. Default "center". */
  align?: TextAlign;
  /** Relative to the parent when attached. */
  position?: Vec3;
  rotation?: Quat;
  /** A number scales uniformly. Children scale with their parent. Visual only after the body exists. */
  scale?: Vec3 | number;
  /** Alpha below 1 makes it see-through. */
  color?: Color;
  /** Units per second. */
  velocity?: Vec3;
  /** Sets horizontal speed [x, z] and keeps the vertical one: steer a body and it still falls. */
  groundVelocity?: readonly [number, number];
  /** Units per second², for entities without a dynamic body (falling debris, thrown items). */
  acceleration?: Vec3;
  /** Radians per second around each axis. */
  spin?: Vec3;
  /** Visual bob: the drawn position moves by amplitude * sin(phase), phase advancing at `speed`. */
  bob?: { amplitude: Vec3; speed: number; phase?: number } | null;
  /** Chase `target` along the ground at `speed`. */
  follow?: { target: Entity; speed: number } | null;
  /** Seconds until it shrinks away and is despawned. */
  lifetime?: number | null;
  /** Attach to another entity: it moves, turns and scales with the parent and is despawned with it. Visual only. */
  parent?: Entity | null;
  physics?: BodyType | PhysicsOptions | null;
  impact?: ImpactFeedback | null;
  /** Whether `pick` can hit it. Default true. */
  pickable?: boolean;
};

export type Easing = keyof typeof EASING;

/** What `animate` changes. Anything left out stays as it is (and keeps any animation it already has). */
export type AnimateTarget = {
  position?: Vec3;
  rotation?: Quat;
  scale?: Vec3 | number;
  color?: Color;
  /** Move by this offset from where the animation starts (instead of to a `position`). */
  moveBy?: Vec3;
  /** Turn by these angles (radians around x, y, z) from the starting rotation. 2π spins once; more spins more. */
  turn?: Vec3;
  /** Shake by up to this distance, fading out. Only the drawn position shakes (hits, wrong moves). */
  shake?: number;
};

/** A step of a keyframed animation: values to pass through, and when (0..1 of the duration; default evenly spaced). */
export type Keyframe = AnimateTarget & { at?: number };

export type SpringOptions = {
  /** How strongly it pulls toward the target. Default 170. */
  stiffness?: number;
  /** How quickly it calms down. Lower bounces more. Default 26 (no overshoot). */
  damping?: number;
  /** Heavier moves slower and swings further. Default 1. */
  mass?: number;
};

export type AnimateOptions = {
  /** Seconds (ignored by springs). Default 0.3. */
  duration?: number;
  /** Seconds before it starts. Default 0. */
  delay?: number;
  /** Default "easeOut". "back" overshoots, "bounce" bounces, "elastic" springs. */
  easing?: Easing;
  /** Extra runs after the first, or "forever". Default 0. */
  repeat?: number | "forever";
  /** Every other run plays backwards (pulses, ping-pong). */
  yoyo?: boolean;
  /** With several entities: extra delay for each next one, in seconds (waves, board reveals). */
  stagger?: number;
  /** "smooth" moves along a curve through the keyframes (arcs, hops) instead of straight lines. */
  path?: "linear" | "smooth";
  /**
   * Physically simulated motion instead of a fixed duration: true (smooth), "bouncy", or your own
   * settings. Interrupting a spring with another keeps its speed, so it never jerks.
   */
  spring?: boolean | "bouncy" | SpringOptions;
};

const KEY_FLAG = { position: 1, rotation: 2, scale: 4, color: 8, moveBy: 16, turn: 32, shake: 64, at: 128 } as const;

export type BurstOptions = {
  position: Vec3;
  /** How many particles. Default 16. */
  count?: number;
  /** Main direction. Default up. */
  direction?: Vec3;
  /** Half-angle of the cone around `direction`, in radians. Default π (every direction). */
  spread?: number;
  /** Default "cube". */
  mesh?: Shape | Model;
  /** Particle size. Default 0.15. */
  size?: number;
  /** Top speed. Default 5. */
  speed?: number;
  /** Seconds. Default 0.8. */
  lifetime?: number;
  /** Vertical acceleration. Default -9.81 (falls); 0 floats. */
  gravity?: number;
  /** One color, or up to 4 to pick from at random. Default white. */
  color?: Color | readonly Color[];
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

export type PickHit = {
  entity: Entity;
  /** Where the tap ray hit the entity's bounding box, in world space. */
  point: [number, number, number];
  distance: number;
};

export type Bounds = readonly [minX: number, minZ: number, maxX: number, maxZ: number];

type TextState = { font: Font; text: string; align: TextAlign; color: Color; glyphs: Entity[] };

const EVENT_STRIDE = 4;
const EVENT_STARTED = 1;
const EVENT_SENSOR = 2;

const meshId = (mesh: Shape | Model) => (typeof mesh === "string" ? SHAPE_MESH[mesh] : mesh.id);

/**
 * A game world, simulated by the Rust core: entities, motion, Rapier physics, collisions,
 * animations and raycasts at a fixed 60 Hz, with rendering smoothed between steps. Pass it to `<GameView>`.
 *
 * ```ts
 * const world = new World(500);
 * const ball = world.spawn({ mesh: "sphere", position: [0, 5, 0], physics: "dynamic" });
 * world.set(ball, { color: [1, 0, 0] });
 * ```
 */
export class World implements RenderSource {
  readonly matrices: Float32Array;
  readonly colors: Float32Array;
  readonly regions: Float32Array;
  readonly ranges: Uint32Array;
  private readonly events: Uint32Array;
  private readonly eventFloats: Float32Array;
  private readonly finished: Uint32Array;
  private readonly scratch: Float32Array;
  private readonly desc = new Float64Array(DESC_LEN);
  private anim = new Float64Array(ANIM_HEADER + 1 + ANIM_KEY_LEN);
  private readonly burstDesc = new Float64Array(BURST_LEN);
  private readonly info: CollisionInfo = { started: false, sensor: false, speed: 0 };
  /** Promise resolvers of running animations, by animation id. */
  private readonly pending = new Map<number, () => void>();
  private readonly texts = new Map<number, TextState>();
  private readonly id: number;
  private disposed = false;
  private gravityValue: Vec3 = [0, -9.81, 0];
  private boundsValue: Bounds | null = null;
  private listenerValue: Entity | null = null;
  private view: { viewProj: Float32Array; inverse: Float32Array | null; width: number; height: number } | null = null;

  constructor(readonly capacity: number) {
    if (!NativeEngine) {
      throw new Error("@nayan-ui/engine: the native core is not linked into this build (Expo Go?).");
    }
    this.id = NativeEngine.createWorld(capacity);
    const buffer = (o: Object) => o as ArrayBuffer;
    this.matrices = new Float32Array(buffer(NativeEngine.getMatrices(this.id)));
    this.colors = new Float32Array(buffer(NativeEngine.getColors(this.id)));
    this.regions = new Float32Array(buffer(NativeEngine.getRegions(this.id)));
    this.ranges = new Uint32Array(buffer(NativeEngine.getRanges(this.id)));
    const events = buffer(NativeEngine.getEvents(this.id));
    this.events = new Uint32Array(events);
    this.eventFloats = new Float32Array(events);
    this.finished = new Uint32Array(buffer(NativeEngine.getDone(this.id)));
    this.scratch = new Float32Array(buffer(NativeEngine.getScratch(this.id)));
  }

  private get native() {
    if (this.disposed) throw new Error("World: used after dispose()");
    return NativeEngine!;
  }

  /** Live entities (text letters count too). */
  get count() {
    return this.disposed ? 0 : this.native.count(this.id);
  }

  // ── Entities ─────────────────────────────────────────────────────────

  /** Adds an entity (one native call; text adds one per letter). Throws if the world is full or an option is invalid. */
  spawn(options: EntityOptions = {}): Entity {
    if (options.parent != null && options.physics != null) {
      throw new Error("World.spawn: attached entities can't have physics (put it on the parent)");
    }
    if (options.text !== undefined && !options.font) throw new Error("World.spawn: text needs a font (see loadFont)");
    encode(this.desc, options, this.resolveMesh(options, "spawn"));
    const e = this.native.spawnDesc(this.id, this.desc.buffer);
    if (e < 0) {
      throw new Error(
        this.count >= this.capacity
          ? `World.spawn: the world is full (capacity ${this.capacity})`
          : "World.spawn: invalid options (sizes and density must be positive, the parent must exist)",
      );
    }
    if (options.text !== undefined) {
      const state: TextState = {
        font: options.font!,
        text: options.text,
        align: options.align ?? "center",
        color: options.color ?? [1, 1, 1],
        glyphs: [],
      };
      this.texts.set(e, state);
      this.buildText(e as Entity, state);
    }
    return e as Entity;
  }

  /**
   * Changes an entity (one native call). Only the options you pass change; `null` removes.
   * Returns false if the entity is gone or an option was rejected (the others still apply).
   */
  set(e: Entity, options: EntityOptions): boolean {
    const text = this.texts.get(e);
    // A text entity stays an invisible root; its letters are rebuilt or recolored below.
    encode(this.desc, options, text ? undefined : this.resolveMesh(options, "set"));
    const ok = this.native.setDesc(this.id, e, this.desc.buffer);
    if (ok && text) {
      const rebuild =
        (options.text !== undefined && options.text !== text.text) ||
        (options.font !== undefined && options.font !== text.font) ||
        (options.align !== undefined && options.align !== text.align);
      text.text = options.text ?? text.text;
      text.font = options.font ?? text.font;
      text.align = options.align ?? text.align;
      if (options.color) text.color = options.color;
      if (rebuild) this.buildText(e, text);
      else if (options.color) for (const g of text.glyphs) this.native.setDesc(this.id, g, this.encodeColor(options.color));
    }
    return ok;
  }

  /** Removes an entity and anything attached to it. Returns false if it was already gone. */
  despawn(e: Entity): boolean {
    const existed = this.native.despawn(this.id, e);
    this.texts.delete(e);
    this.resolveFinished(); // its animations, and those of attached entities that went with it
    return existed;
  }

  /** A one-off push: jump, explosion, knockback (dynamic bodies only). */
  impulse(e: Entity, [x, y, z]: Vec3) {
    this.native.impulse(this.id, e, x, y, z);
  }

  private resolveMesh(o: EntityOptions, method: "spawn" | "set"): number | undefined {
    if (o.text !== undefined) return SHAPE_MESH.none;
    if (o.texture) {
      if (o.mesh === undefined && method === "set") throw new Error("World.set: pass `mesh` together with `texture`");
      return texturedMesh(meshId(o.mesh ?? "cube"), o.texture);
    }
    return o.mesh === undefined ? undefined : meshId(o.mesh);
  }

  private encodeColor(color: Color) {
    encode(this.desc, { color }, undefined);
    return this.desc.buffer;
  }

  /** (Re)creates a text entity's letters as children laid out along x. */
  private buildText(root: Entity, text: TextState) {
    for (const g of text.glyphs) this.native.despawn(this.id, g);
    text.glyphs = [];
    for (const { mesh, x, y } of layoutText(text.font, text.text, text.align)) {
      encode(this.desc, { parent: root, position: [x, y, 0], color: text.color, pickable: false }, mesh);
      const g = this.native.spawnDesc(this.id, this.desc.buffer);
      if (g < 0) throw new Error(`World: no room for text "${text.text}" (capacity ${this.capacity})`);
      text.glyphs.push(g as Entity);
    }
  }

  // ── Animation and effects ────────────────────────────────────────────

  /**
   * Animates in Rust, with no per-frame JS: from where things are to `to`, or through keyframes.
   * Each property (position, rotation, scale, color, shake) runs on its own, so a piece can move
   * while it pulses; animating a property again replaces only that property. Pass several entities
   * to animate them together (with `stagger` for waves). Resolves when every part has finished, been
   * replaced or stopped, or its entity was despawned.
   *
   * ```ts
   * await world.animate(piece, { position: [2, 0, 3] }, { duration: 0.25, easing: "back" });
   * world.animate(coin, { scale: 1.2 }, { repeat: "forever", yoyo: true }); // pulse
   * world.animate(piece, [{ moveBy: [1, 1.5, 0] }, { moveBy: [2, 0, 0] }], { path: "smooth" }); // hop
   * world.animate(card, { turn: [0, Math.PI, 0] }); // flip
   * world.animate(tiles, { scale: 1 }, { stagger: 0.03, easing: "back" }); // reveal a board
   * world.animate(cursor, { position: [x, 0, z] }, { spring: true }); // follows the finger smoothly
   * world.animate(wrongTile, { shake: 0.15 }, { duration: 0.4 });
   * ```
   */
  animate(targets: Entity | readonly Entity[], to: AnimateTarget | readonly Keyframe[], options: AnimateOptions = {}): Promise<void> {
    const entities: readonly number[] = typeof targets === "number" ? [targets] : targets;
    const keys: readonly Keyframe[] = Array.isArray(to) ? to : [to as AnimateTarget];
    if (entities.length === 0 || keys.length === 0) return Promise.resolve();
    if (keys.length > 64) throw new Error("World.animate: at most 64 keyframes");
    const length = ANIM_HEADER + entities.length + keys.length * ANIM_KEY_LEN;
    if (this.anim.length < length) this.anim = new Float64Array(length * 2);
    const a = this.anim;
    a.fill(0, 0, length);
    const spring =
      options.spring === true ? {} : options.spring === "bouncy" ? { stiffness: 220, damping: 12 } : options.spring || null;
    a[0] = entities.length;
    a[1] = keys.length;
    a[2] = options.duration ?? 0.3;
    a[3] = options.delay ?? 0;
    a[4] = EASING[options.easing ?? "easeOut"];
    a[5] = options.repeat === "forever" ? -1 : (options.repeat ?? 0);
    a[6] = options.yoyo ? 1 : 0;
    a[7] = options.stagger ?? 0;
    a[8] = options.path === "smooth" ? 1 : 0;
    a[9] = spring ? (spring.stiffness ?? 170) : 0;
    a[10] = spring?.damping ?? 26;
    a[11] = spring?.mass ?? 1;
    a.set(entities, ANIM_HEADER);
    keys.forEach((k, j) => this.encodeKeyframe(a, ANIM_HEADER + entities.length + j * ANIM_KEY_LEN, k));
    const id = this.native.animate(this.id, a.buffer);
    this.resolveFinished(); // animations this one replaced
    if (id === 0) return Promise.resolve();
    return new Promise((resolve) => this.pending.set(id, resolve));
  }

  private encodeKeyframe(a: Float64Array, o: number, k: Keyframe) {
    let flags = 0;
    if (k.at !== undefined) {
      flags |= KEY_FLAG.at;
      a[o + 1] = k.at;
    }
    if (k.position) {
      flags |= KEY_FLAG.position;
      a.set(k.position, o + 2);
    }
    if (k.rotation) {
      flags |= KEY_FLAG.rotation;
      a.set(k.rotation, o + 5);
    }
    if (k.scale !== undefined) {
      flags |= KEY_FLAG.scale;
      if (typeof k.scale === "number") a.fill(k.scale, o + 9, o + 12);
      else a.set(k.scale, o + 9);
    }
    if (k.color) {
      flags |= KEY_FLAG.color;
      a.set([k.color[0], k.color[1], k.color[2], k.color[3] ?? 1], o + 12);
    }
    if (k.moveBy) {
      flags |= KEY_FLAG.moveBy;
      a.set(k.moveBy, o + 16);
    }
    if (k.turn) {
      flags |= KEY_FLAG.turn;
      a.set(k.turn, o + 19);
    }
    if (k.shake !== undefined) {
      flags |= KEY_FLAG.shake;
      a[o + 22] = k.shake;
    }
    a[o] = flags;
  }

  /** Stops every animation on the entity where it is (their promises resolve). */
  stopAnimation(e: Entity) {
    this.native.stopAnimation(this.id, e);
    this.resolveFinished();
  }

  /**
   * Particles: many small, short-lived pieces flying out of a point (explosions, sparks, dust,
   * confetti). One native call; they fall, spin, shrink away and clean themselves up.
   * Returns how many were spawned (fewer if the world is nearly full).
   */
  burst(options: BurstOptions): number {
    const b = this.burstDesc;
    const color = options.color ?? [1, 1, 1];
    const colors = (typeof color[0] === "number" ? [color] : color) as readonly Color[];
    b.set(options.position, 0);
    b.set(options.direction ?? [0, 1, 0], 3);
    b[6] = options.spread ?? Math.PI;
    b[7] = options.count ?? 16;
    b[8] = meshId(options.mesh ?? "cube");
    b[9] = options.size ?? 0.15;
    b[10] = options.speed ?? 5;
    b[11] = options.lifetime ?? 0.8;
    b[12] = options.gravity ?? -9.81;
    b[13] = Math.max(1, Math.min(4, colors.length));
    colors.slice(0, 4).forEach((c, k) => b.set([c[0], c[1], c[2], c[3] ?? 1], 14 + k * 4));
    return this.native.burst(this.id, b.buffer);
  }

  /** Resolves the promises of animations the core reports as ended. */
  private resolveFinished() {
    if (this.pending.size === 0) return;
    const n = this.native.doneLength(this.id);
    for (let i = 0; i < n; i++) {
      const id = this.finished[i]!;
      const resolve = this.pending.get(id);
      if (resolve) {
        this.pending.delete(id);
        resolve();
      }
    }
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /**
   * Current simulated position (relative to the parent when attached), or null if the entity is gone.
   * Pass `out` to avoid allocating every frame.
   */
  position(e: Entity, out: [number, number, number] = [0, 0, 0]): [number, number, number] | null {
    return this.native.readPosition(this.id, e, false) ? this.copyScratch(out) : null;
  }

  /** Where the entity was last drawn, in world space (parents and smoothing included), or null if it's gone. */
  worldPosition(e: Entity, out: [number, number, number] = [0, 0, 0]): [number, number, number] | null {
    return this.native.readPosition(this.id, e, true) ? this.copyScratch(out) : null;
  }

  /** Current velocity, or null if the entity is gone. Pass `out` to avoid allocating every frame. */
  velocity(e: Entity, out: [number, number, number] = [0, 0, 0]): [number, number, number] | null {
    return this.native.readVelocity(this.id, e) ? this.copyScratch(out) : null;
  }

  /** True while the entity exists. */
  has(e: Entity): boolean {
    return this.native.readPosition(this.id, e, false);
  }

  /** First solid (non-sensor) collider along the ray whose layer is in `mask`, as of the last update. */
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask = -1): RaycastHit | null {
    const hit = this.native.raycast(this.id, ...origin, ...direction, maxDistance, mask);
    if (hit < 0) return null;
    const s = this.scratch;
    return { entity: hit as Entity, distance: s[0]!, normal: [s[1]!, s[2]!, s[3]!], point: [s[4]!, s[5]!, s[6]!] };
  }

  /**
   * The entity under a point of the GameView (e.g. a tap's `x, y`), tested against what was last
   * drawn. Needs no physics. Returns null if nothing pickable is there.
   */
  pick(x: number, y: number): PickHit | null {
    const ray = this.screenRay(x, y);
    if (!ray) return null;
    const hit = this.native.pick(this.id, ray[0]!, ray[1]!, ray[2]!, ray[3]!, ray[4]!, ray[5]!);
    if (hit < 0) return null;
    const s = this.scratch;
    return { entity: hit as Entity, distance: s[0]!, point: [s[1]!, s[2]!, s[3]!] };
  }

  /**
   * Where a world position appears in the GameView, in points from its top-left, or null if it's behind
   * the camera (or nothing has been drawn yet). Place React Native views over 3D objects with it.
   */
  toScreen(position: Vec3): [number, number] | null {
    const v = this.view;
    if (!v) return null;
    const p = vec4.transformMat4([position[0], position[1], position[2], 1], v.viewProj);
    if (p[3]! <= 0) return null;
    return [((p[0]! / p[3]! + 1) / 2) * v.width, ((1 - p[1]! / p[3]!) / 2) * v.height];
  }

  /** World-space ray [origin xyz, direction xyz] through a GameView point. */
  private screenRay(x: number, y: number): number[] | null {
    const v = this.view;
    if (!v) return null;
    v.inverse ??= mat4.inverse(v.viewProj) as Float32Array;
    const nx = (x / v.width) * 2 - 1;
    const ny = 1 - (y / v.height) * 2;
    const near = vec4.transformMat4([nx, ny, 0, 1], v.inverse);
    const far = vec4.transformMat4([nx, ny, 1, 1], v.inverse);
    const o = [near[0]! / near[3]!, near[1]! / near[3]!, near[2]! / near[3]!];
    const f = [far[0]! / far[3]!, far[1]! / far[3]!, far[2]! / far[3]!];
    return [o[0]!, o[1]!, o[2]!, f[0]! - o[0]!, f[1]! - o[1]!, f[2]! - o[2]!];
  }

  /** Called by GameView after drawing a frame, with the camera matrix and the view size in points. */
  setView(viewProj: Float32Array, width: number, height: number) {
    this.view ??= { viewProj: new Float32Array(16), inverse: null, width, height };
    this.view.viewProj.set(viewProj);
    this.view.inverse = null;
    this.view.width = width;
    this.view.height = height;
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

  /** Advances the simulation (fixed 60 Hz steps), resolves finished animations, refreshes what GameView draws. */
  update(dt: number) {
    this.native.update(this.id, dt);
    this.resolveFinished();
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

  /** Frees the native world. Pending animation promises resolve; any later call throws. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const resolve of this.pending.values()) resolve();
    this.pending.clear();
    NativeEngine!.destroyWorld(this.id);
  }
}
