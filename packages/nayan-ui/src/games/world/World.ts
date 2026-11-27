import NativeEngine from '../../native/NativeNayanEngine';
import { type Font, layoutText, type TextAlign, type TextLayout } from '../assets/font';
import type { Model } from '../assets/model';
import { texturedMesh } from '../assets/texture';
import { type RenderSource, type Shape, SHAPE_MESH, type Vec3 } from '../types';
import { type ColorInput, resolveColor, resolveColors } from './color';
import { ANIM_HEADER, ANIM_KEY_LEN, BURST_LEN, DESC_LEN, EASING, encode } from './desc';
import { Scoreboard } from './Scoreboard';
import { TRANSFORM_STRIDE, TransformBatch } from './TransformBatch';
import type {
  AnimateOptions,
  AnimateTarget,
  Bounds,
  BurstOptions,
  ClipOptions,
  CollisionInfo,
  Color,
  Entity,
  EntityOptions,
  Keyframe,
  PickHit,
  RaycastHit,
  ScreenPlane
} from './types';

/** True when the engine's native code is linked into this build (it is not in Expo Go). */
export const isEngineAvailable = NativeEngine != null;

const KEY_FLAG = {
  position: 1,
  rotation: 2,
  scale: 4,
  color: 8,
  moveBy: 16,
  turn: 32,
  shake: 64,
  at: 128
} as const;

type TextState = {
  font: Font;
  text: string;
  align: TextAlign;
  layout: TextLayout;
  color: Color;
  glyphs: Entity[];
};

const EVENT_STRIDE = 4;
const EVENT_STARTED = 1;
const EVENT_SENSOR = 2;

const meshId = (mesh: Shape | Model) => (typeof mesh === 'string' ? SHAPE_MESH[mesh] : mesh.id);
const WHITE: Color = [1, 1, 1];
const ORIGIN: Vec3 = [0, 0, 0];
const UP: Vec3 = [0, 1, 0];

function writeRgba(target: Float64Array, offset: number, c: Color) {
  target[offset] = c[0];
  target[offset + 1] = c[1];
  target[offset + 2] = c[2];
  target[offset + 3] = c[3] ?? 1;
}

/** Writes into a hit's tuple in place (typed readonly for callers, owned by the `out` object). */
function writeVec3(target: Vec3, x: number, y: number, z: number) {
  const t = target as unknown as number[];
  t[0] = x;
  t[1] = y;
  t[2] = z;
}

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
  private readonly info: CollisionInfo = {
    started: false,
    sensor: false,
    speed: 0
  };
  /** Promise resolvers of running animations, by animation id. */
  private readonly pending = new Map<number, () => void>();
  /** Callbacks of pending `after` timers, by timer id (the core counts the time). */
  private readonly timers = new Map<number, () => void>();
  /** Timers for a native core built before `after` existed: [fire time, callback], on `clock`. */
  private fallbackTimers: { id: number; at: number; run: () => void }[] = [];
  private fallbackTimerId = 0;
  private transformsValue: TransformBatch | null = null;
  private clock = 0;
  private scoreboardValue: Scoreboard | null = null;
  private readonly texts = new Map<number, TextState>();
  private readonly id: number;
  private disposed = false;
  private gravityValue: Vec3 = [0, -9.81, 0];
  private boundsValue: Bounds | null = null;
  private listenerValue: Entity | null = null;
  private updates = 0;
  /** The layer still entities live in, the stand-in each one has here, and whether one changed. */
  private backdropValue: World | null = null;
  private readonly stills = new Map<number, Entity>();
  private stillChanged = false;

  constructor(readonly capacity: number) {
    if (!NativeEngine) {
      throw new Error('nayan-ui: the native core is not linked into this build (Expo Go?).');
    }
    this.id = NativeEngine.createWorld(capacity);
    this.matrices = new Float32Array(NativeEngine.getMatrices(this.id));
    this.colors = new Float32Array(NativeEngine.getColors(this.id));
    this.regions = new Float32Array(NativeEngine.getRegions(this.id));
    this.ranges = new Uint32Array(NativeEngine.getRanges(this.id));
    const events = NativeEngine.getEvents(this.id);
    this.events = new Uint32Array(events);
    this.eventFloats = new Float32Array(events);
    this.finished = new Uint32Array(NativeEngine.getDone(this.id));
    this.scratch = new Float32Array(NativeEngine.getScratch(this.id));
  }

  private get native() {
    if (this.disposed) throw new Error('World: used after dispose()');
    return NativeEngine!;
  }

  /** True once `dispose()` has run. Cleanup calls (despawn, set, has, queries, stopping animations
   * and timers) are safe no-ops afterwards, so late animation promises and timers need no guard.
   */
  get isDisposed(): boolean {
    return this.disposed;
  }

  /** Live entities (text letters count too). */
  get count() {
    return this.disposed ? 0 : this.native.count(this.id);
  }

  // ── Entities ─────────────────────────────────────────────────────────

  /** Adds an entity (one native call; text adds one per letter). Throws if the world is full or an option is invalid. */
  spawn(options: EntityOptions = {}): Entity {
    if (options.still) return this.spawnStill(options);
    if (options.parent != null && options.physics != null) {
      throw new Error("World.spawn: attached entities can't have physics (put it on the parent)");
    }
    if (options.text !== undefined && !options.font) throw new Error('World.spawn: text needs a font (see loadFont)');
    encode(this.desc, options, this.resolveMesh(options, 'spawn'));
    const e = this.native.spawnDesc(this.id, this.desc.buffer);
    if (e < 0) {
      throw new Error(
        this.count >= this.capacity
          ? `World.spawn: the world is full (capacity ${this.capacity})`
          : 'World.spawn: invalid options (sizes and density must be positive, the parent must exist)'
      );
    }
    if (options.text !== undefined) {
      const state: TextState = {
        font: options.font!,
        text: options.text,
        align: options.align ?? 'center',
        layout: {
          letterSpacing: options.letterSpacing,
          tabular: options.tabular
        },
        color: resolveColor(options.color ?? WHITE),
        glyphs: []
      };
      try {
        this.buildText(e as Entity, state);
      } catch (error) {
        this.native.despawn(this.id, e); // takes the letters spawned so far with it
        throw error;
      }
      this.texts.set(e, state);
    }
    return e as Entity;
  }

  /**
   * The still entities' layer (see `EntityOptions.still`), drawn once into a cached image behind this
   * world; null until it's first used. GameView draws it; it's disposed with this world.
   */
  get backdrop(): World | null {
    return this.backdropValue;
  }

  /**
   * The still layer itself, made on first use with room for `capacity` entities: for a whole still
   * scene (a meadow) spawned straight into it. Step it (`update(0)`) after changing it, which is
   * what tells GameView to draw it again; it isn't stepped otherwise, so nothing in it moves.
   */
  backdropLayer(capacity = 64): World {
    if (this.disposed) throw new Error('World: used after dispose()');
    return (this.backdropValue ??= new World(capacity));
  }

  private spawnStill({ still: _, ...options }: EntityOptions): Entity {
    if (options.parent != null || options.physics != null || options.text !== undefined) {
      throw new Error("World.spawn: a still entity can't be attached or have physics or text");
    }
    const layer = this.backdropLayer();
    const entity = layer.spawn({ pickable: false, ...options });
    // A stand-in here keeps the handle this world's own (unique, and cleared with it)
    const standIn = this.spawn({ mesh: 'none', pickable: false });
    this.stills.set(standIn, entity);
    this.stillChanged = true;
    return standIn;
  }

  /**
   * Changes an entity (one native call). Only the options you pass change; `null` removes.
   * Returns false if the entity is gone, the world is disposed, or an option was rejected (the others still apply).
   */
  set(e: Entity, options: EntityOptions): boolean {
    if (this.disposed) return false;
    const still = this.stills.get(e);
    if (still !== undefined) {
      if (options.parent != null || options.physics != null) throw new Error("World.set: a still entity can't be attached or have physics");
      this.stillChanged = true;
      return this.backdropValue!.set(still, options);
    }
    const text = this.texts.get(e);
    // A text entity stays an invisible root; its letters are rebuilt or recolored below.
    encode(this.desc, options, text ? undefined : this.resolveMesh(options, 'set'));
    const ok = this.native.setDesc(this.id, e, this.desc.buffer);
    if (ok && text) {
      const rebuild =
        (options.text !== undefined && options.text !== text.text) ||
        (options.font !== undefined && options.font !== text.font) ||
        (options.align !== undefined && options.align !== text.align) ||
        (options.letterSpacing !== undefined && options.letterSpacing !== text.layout.letterSpacing) ||
        (options.tabular !== undefined && options.tabular !== text.layout.tabular);
      text.text = options.text ?? text.text;
      text.font = options.font ?? text.font;
      text.align = options.align ?? text.align;
      text.layout = {
        letterSpacing: options.letterSpacing ?? text.layout.letterSpacing,
        tabular: options.tabular ?? text.layout.tabular
      };
      if (options.color) text.color = resolveColor(options.color);
      if (rebuild) this.buildText(e, text);
      else if (options.color) {
        const desc = this.encodeColor(options.color);
        for (const g of text.glyphs) this.native.setDesc(this.id, g, desc);
      }
    }
    return ok;
  }

  /**
   * This world's shared draw-only transform batch (created on first use). Queue per-frame moves with
   * its allocation-free methods; the next `update()` applies them first (or `flush()` them yourself
   * before reading positions or animating).
   */
  get transforms(): TransformBatch {
    return (this.transformsValue ??= this.createTransformBatch());
  }

  /** Reusable draw-only transforms; use set() for text entities and flush before animations/queries. */
  createTransformBatch(): TransformBatch {
    return new TransformBatch((data, count) => {
      const native = this.native;
      if (typeof native.setTransforms === 'function') return native.setTransforms(this.id, data.buffer, count);
      // Existing native builds remain usable until the host app is rebuilt.
      let applied = 0;
      for (let i = 0; i < count; i++) {
        const offset = i * TRANSFORM_STRIDE;
        this.desc[0] = data[offset + 1]!;
        for (let k = 2; k < TRANSFORM_STRIDE; k++) this.desc[k] = data[offset + k]!;
        if (native.setDesc(this.id, data[offset]!, this.desc.buffer)) applied++;
      }
      return applied;
    });
  }

  /** Removes an entity and anything attached to it. Returns false if it was already gone. */
  despawn(e: Entity): boolean {
    if (this.disposed) return false;
    const still = this.stills.get(e);
    if (still !== undefined) {
      this.stills.delete(e);
      this.backdropValue!.despawn(still);
      this.stillChanged = true;
    }
    const existed = this.native.despawn(this.id, e);
    this.texts.delete(e);
    this.resolveFinished(); // its animations, and those of attached entities that went with it
    return existed;
  }

  /** A one-off push: jump, explosion, knockback (dynamic bodies only). */
  impulse(e: Entity, impulse: Vec3) {
    if (this.disposed) return;
    this.native.impulse(this.id, e, impulse[0], impulse[1], impulse[2]);
  }

  private resolveMesh(o: EntityOptions, method: 'spawn' | 'set'): number | undefined {
    if (o.text !== undefined) return SHAPE_MESH.none;
    if (o.texture) {
      if (o.mesh === undefined && method === 'set') throw new Error('World.set: pass `mesh` together with `texture`');
      return texturedMesh(meshId(o.mesh ?? 'cube'), o.texture);
    }
    return o.mesh === undefined ? undefined : meshId(o.mesh);
  }

  private encodeColor(color: ColorInput) {
    encode(this.desc, { color }, undefined);
    return this.desc.buffer;
  }

  /** Updates a text entity's letters in place, growing or shrinking only when needed. */
  private buildText(root: Entity, text: TextState) {
    let used = 0;
    for (const { mesh, x, y } of layoutText(text.font, text.text, text.align, text.layout)) {
      encode(
        this.desc,
        {
          parent: root,
          position: [x, y, 0],
          color: text.color,
          pickable: false
        },
        mesh
      );
      const existing = text.glyphs[used];
      if (existing !== undefined && this.native.setDesc(this.id, existing, this.desc.buffer)) {
        used++;
      } else {
        const g = this.native.spawnDesc(this.id, this.desc.buffer);
        if (g < 0) throw new Error(`World: no room for text "${text.text}" (capacity ${this.capacity})`);
        text.glyphs[used++] = g as Entity;
      }
    }
    for (let i = used; i < text.glyphs.length; i++) this.native.despawn(this.id, text.glyphs[i]!);
    text.glyphs.length = used;
  }

  /** Native world backing this render source; bone palettes stay in Rust. */
  get nativeWorld(): number {
    return this.id;
  }

  /** Play a named GLB clip. Re-selecting it changes speed without restarting; `time` explicitly seeks.
   * `fade` crossfades from the current pose (seconds). A speed of zero holds a pose for a ready screen.
   */
  playClip(entity: Entity, clip: string, options: ClipOptions = {}): boolean {
    if (this.disposed) return false;
    return this.native.playClip(this.id, entity, clip, options.loop ?? true, options.speed ?? 1, options.fade ?? 0.15, options.time ?? -1);
  }

  /** Hold the current GLB pose, or return to its bind pose with `reset`. */
  stopClip(entity: Entity, reset = false): boolean {
    if (this.disposed) return false;
    return this.native.stopClip(this.id, entity, reset);
  }

  /** Sample selected animated vertices in model space for foot contact and attachments.
   * Reuse both arrays. `after` previews the interpolated pose following the next update.
   */
  sampleSkinnedVertices(entity: Entity, vertices: Uint32Array, output: Float32Array, after = 0): boolean {
    const indices = vertices.byteOffset === 0 && vertices.byteLength === vertices.buffer.byteLength ? vertices : vertices.slice();
    const points = output.byteOffset === 0 && output.byteLength === output.buffer.byteLength ? output : new Float32Array(output.length);
    const ok = this.native.skinPoints(this.id, entity, indices.buffer, points.buffer, after);
    if (ok && points !== output) output.set(points);
    return ok;
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
    if (this.disposed) return Promise.resolve();
    const single = typeof targets === 'number';
    const entityCount = single ? 1 : targets.length;
    const keyed = Array.isArray(to);
    const keyCount = keyed ? to.length : 1;
    if (entityCount === 0 || keyCount === 0) return Promise.resolve();
    if (keyCount > 64) throw new Error('World.animate: at most 64 keyframes');
    const length = ANIM_HEADER + entityCount + keyCount * ANIM_KEY_LEN;
    if (this.anim.length < length) this.anim = new Float64Array(length * 2);
    const a = this.anim;
    a.fill(0, 0, length);
    const spring = options.spring === true ? {} : options.spring === 'bouncy' ? { stiffness: 220, damping: 12 } : options.spring || null;
    a[0] = entityCount;
    a[1] = keyCount;
    a[2] = options.duration ?? 0.3;
    a[3] = options.delay ?? 0;
    a[4] = EASING[options.easing ?? 'easeOut'];
    a[5] = options.repeat === 'forever' ? -1 : (options.repeat ?? 0);
    a[6] = options.yoyo ? 1 : 0;
    a[7] = options.stagger ?? 0;
    a[8] = options.path === 'smooth' ? 1 : 0;
    a[9] = spring ? (spring.stiffness ?? 170) : 0;
    a[10] = spring?.damping ?? 26;
    a[11] = spring?.mass ?? 1;
    if (single) a[ANIM_HEADER] = targets;
    else a.set(targets, ANIM_HEADER);
    const first = ANIM_HEADER + entityCount;
    if (keyed) for (let j = 0; j < keyCount; j++) this.encodeKeyframe(a, first + j * ANIM_KEY_LEN, to[j]!);
    else this.encodeKeyframe(a, first, to as AnimateTarget);
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
      if (typeof k.scale === 'number') a.fill(k.scale, o + 9, o + 12);
      else a.set(k.scale, o + 9);
    }
    if (k.color) {
      flags |= KEY_FLAG.color;
      const c = resolveColor(k.color);
      a[o + 12] = c[0];
      a[o + 13] = c[1];
      a[o + 14] = c[2];
      a[o + 15] = c[3] ?? 1;
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
    if (this.disposed) return;
    this.native.stopAnimation(this.id, e);
    this.resolveFinished();
  }

  /**
   * Particles: many small, short-lived pieces flying out of a point (explosions, sparks, dust,
   * confetti). One native call; they fall, spin, shrink away and clean themselves up. `endSize` and
   * `endColor` grow / shrink and recolor them over their life (fire cooling, smoke thinning out).
   * Returns how many were spawned (fewer if the world is nearly full).
   */
  burst(options: BurstOptions): number {
    const b = this.burstDesc;
    const colors = resolveColors(options.color ?? WHITE);
    const colorCount = Math.max(1, Math.min(4, colors.length));
    b.set(options.position, 0);
    b.set(options.direction ?? UP, 3);
    b[6] = options.spread ?? Math.PI;
    b[7] = options.count ?? 16;
    b[8] = meshId(options.mesh ?? 'cube');
    b[9] = options.size ?? 0.15;
    b[10] = options.speed ?? 5;
    b[11] = options.lifetime ?? 0.8;
    b[12] = options.gravity ?? -9.81;
    b[13] = colorCount;
    for (let k = 0; k < colorCount; k++) writeRgba(b, 14 + k * 4, colors[k]!);
    b[30] = options.endSize ?? 1;
    const end = options.endColor;
    b[31] = end ? 1 : 0;
    if (end) writeRgba(b, 32, resolveColor(end));
    return this.native.burst(this.id, b.buffer);
  }

  /**
   * Runs `fn` after `seconds` of `update` time (game time: it pauses when updates stop). The clock is
   * kept in Rust, so there's no JS timer list to scan every frame. Due callbacks run inside `update`,
   * earliest first. Returns the timer's id for `cancelTimer`; `cancelTimers()` drops every pending one.
   * After `dispose()` it does nothing and returns 0.
   *
   * ```ts
   * world.after(0.3, () => checkMatches());
   * ```
   */
  after(seconds: number, fn: () => void): number {
    if (this.disposed) return 0;
    const native = this.native;
    if (typeof native.after !== 'function') {
      // Negative ids keep native-core builds without `after` cancellable too.
      const id = -++this.fallbackTimerId;
      this.fallbackTimers.push({
        id,
        at: this.clock + Math.max(0, seconds || 0),
        run: fn
      });
      return id;
    }
    const id = native.after(this.id, seconds);
    if (id > 0) this.timers.set(id, fn);
    return id;
  }

  /** Drops one pending `after` timer so its callback never runs. Returns false if it already ran or was dropped. */
  cancelTimer(id: number): boolean {
    if (id < 0) {
      const index = this.fallbackTimers.findIndex((t) => t.id === id);
      if (index < 0) return false;
      this.fallbackTimers.splice(index, 1);
      return true;
    }
    // The core still reports the id when it falls due; without a callback it is ignored.
    return this.timers.delete(id);
  }

  /** Drops every pending `after` timer: their callbacks never run (a new round, a reset). */
  cancelTimers() {
    this.fallbackTimers = [];
    if (this.timers.size === 0 || this.disposed) return;
    this.timers.clear();
    const native = this.native;
    if (typeof native.cancelTimers === 'function') native.cancelTimers(this.id);
  }

  /** Score, lives and the game clock, kept in Rust (created on first use). */
  get scoreboard(): Scoreboard {
    return (this.scoreboardValue ??= new Scoreboard(this.id));
  }

  /** How many times `update` has run. GameView reads it to step the world only when `onUpdate` didn't. */
  get updateCount(): number {
    return this.updates;
  }

  /** Timers waiting to fire. */
  get timerCount() {
    return this.timers.size + this.fallbackTimers.length;
  }

  /** Resolves the promises of animations the core reports as ended, then runs due timers. */
  private resolveFinished() {
    if (this.pending.size === 0 && this.timers.size === 0) return;
    const n = this.native.doneLength(this.id);
    let due: (() => void)[] | null = null;
    for (let i = 0; i < n; i++) {
      const id = this.finished[i]!;
      const resolve = this.pending.get(id);
      if (resolve) {
        this.pending.delete(id);
        resolve();
        continue;
      }
      const run = this.timers.get(id);
      if (run) {
        this.timers.delete(id);
        (due ??= []).push(run);
      }
    }
    // Collected first: a callback may start timers or animations (which read the done list again).
    if (due) for (const run of due) if (!this.disposed) run();
  }

  private runFallbackTimers(dt: number) {
    if (dt > 0 && Number.isFinite(dt)) this.clock += dt;
    if (this.fallbackTimers.length === 0) return;
    const now = this.clock;
    const due = this.fallbackTimers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at);
    if (due.length === 0) return;
    this.fallbackTimers = this.fallbackTimers.filter((t) => t.at > now);
    for (const t of due) if (!this.disposed) t.run();
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /**
   * Current simulated position (relative to the parent when attached), or null if the entity is gone.
   * Pass `out` to avoid allocating every frame.
   */
  position(e: Entity, out?: [number, number, number]): [number, number, number] | null {
    if (this.disposed) return null;
    return this.native.readPosition(this.id, e, false) ? this.copyScratch(out) : null;
  }

  /** Where the entity was last drawn, in world space (parents and smoothing included), or null if it's gone. */
  worldPosition(e: Entity, out?: [number, number, number]): [number, number, number] | null {
    if (this.disposed) return null;
    return this.native.readPosition(this.id, e, true) ? this.copyScratch(out) : null;
  }

  /** Current velocity, or null if the entity is gone. Pass `out` to avoid allocating every frame. */
  velocity(e: Entity, out?: [number, number, number]): [number, number, number] | null {
    if (this.disposed) return null;
    return this.native.readVelocity(this.id, e) ? this.copyScratch(out) : null;
  }

  /** True while the entity exists (false after `dispose()`). */
  has(e: Entity): boolean {
    if (this.disposed) return false;
    return this.native.readPosition(this.id, e, false);
  }

  /**
   * First solid (non-sensor) collider along the ray whose layer is in `mask`, as of the last update.
   * Pass `out` to reuse a hit object every frame.
   */
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask = -1, out?: RaycastHit): RaycastHit | null {
    if (this.disposed) return null;
    const hit = this.native.raycast(this.id, origin[0], origin[1], origin[2], direction[0], direction[1], direction[2], maxDistance, mask);
    if (hit < 0) return null;
    const s = this.scratch;
    if (!out) return { entity: hit as Entity, distance: s[0]!, normal: [s[1]!, s[2]!, s[3]!], point: [s[4]!, s[5]!, s[6]!] };
    out.entity = hit as Entity;
    out.distance = s[0]!;
    writeVec3(out.normal, s[1]!, s[2]!, s[3]!);
    writeVec3(out.point, s[4]!, s[5]!, s[6]!);
    return out;
  }

  /**
   * The entity under a point of the GameView (e.g. a tap's `x, y`), tested against what was last
   * drawn. Needs no physics. Returns null if nothing pickable is there. Pass `out` to reuse a hit object.
   */
  pick(x: number, y: number, out?: PickHit): PickHit | null {
    if (this.disposed) return null;
    const hit = this.native.pickScreen(this.id, x, y);
    if (hit < 0) return null;
    const s = this.scratch;
    if (!out) return { entity: hit as Entity, distance: s[0]!, point: [s[1]!, s[2]!, s[3]!] };
    out.entity = hit as Entity;
    out.distance = s[0]!;
    writeVec3(out.point, s[1]!, s[2]!, s[3]!);
    return out;
  }

  /**
   * Where a world position appears in the GameView, in points from its top-left, or null if it's behind
   * the camera (or nothing has been drawn yet). Place React Native views over 3D objects with it.
   * Pass `out` to avoid allocating every frame.
   */
  toScreen(position: Vec3, out?: [number, number]): [number, number] | null {
    if (this.disposed || !this.native.toScreen(this.id, position[0], position[1], position[2])) return null;
    if (!out) return [this.scratch[0]!, this.scratch[1]!];
    out[0] = this.scratch[0]!;
    out[1] = this.scratch[1]!;
    return out;
  }

  /**
   * Where a GameView point (a finger's `x, y`) lands on a plane, or null if the plane is behind the
   * camera or edge-on. Defaults to the ground (y = 0). Drag a piece across a board with it:
   * `world.screenToWorld(x, y, { point: [0, pieceHeight, 0] })`. 2D games looking down -z use
   * `{ normal: [0, 0, 1] }`. Like `toScreen`, it needs a drawn frame (null before the first one).
   * Pass `out` to avoid allocating every frame.
   */
  screenToWorld(x: number, y: number, plane?: ScreenPlane, out?: [number, number, number]): [number, number, number] | null {
    if (this.disposed) return null;
    const p = plane?.point ?? ORIGIN;
    const n = plane?.normal ?? UP;
    if (!this.native.screenToWorld(this.id, x, y, p[0], p[1], p[2], n[0], n[1], n[2])) return null;
    return this.copyScratch(out);
  }

  /** Called by GameView after drawing a frame, with the camera matrix and the view size in points. */
  setView(viewProj: Float32Array, width: number, height: number) {
    this.native.setView(this.id, viewProj.buffer, width, height);
  }

  private copyScratch(out: [number, number, number] = [0, 0, 0]) {
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

  /**
   * Advances the simulation (fixed 60 Hz steps), resolves finished animations, runs due timers and
   * scoreboard handlers, and refreshes what GameView draws. `GameView` calls it for you each frame;
   * call it yourself from `onUpdate` only to step with a different `dt` (it is then not stepped twice).
   */
  update(dt: number) {
    this.updates++;
    this.transformsValue?.flush(); // moves queued this frame land before the step
    this.native.update(this.id, dt);
    this.resolveFinished();
    this.runFallbackTimers(dt);
    if (!this.disposed) this.scoreboardValue?.dispatch();
    // Still entities changed: step their layer once, which tells GameView to have it drawn again
    if (this.stillChanged && this.backdropValue && !this.disposed) {
      this.stillChanged = false;
      this.backdropValue.update(0);
    }
  }

  /**
   * Calls `fn` for each touch that started or ended during the last `update`. `info` is reused:
   * copy what you need. Either entity may already be despawned by an earlier callback.
   */
  forEachCollision(fn: (a: Entity, b: Entity, info: CollisionInfo) => void) {
    if (this.disposed) return;
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

  /**
   * Frees the native world. Pending animation promises resolve and timers are dropped. Later cleanup
   * calls and queries are no-ops (see `isDisposed`); `spawn` and `update` throw.
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.transformsValue?.clear();
    for (const resolve of this.pending.values()) resolve();
    this.pending.clear();
    this.timers.clear();
    this.fallbackTimers = [];
    this.stills.clear();
    this.backdropValue?.dispose();
    NativeEngine!.destroyWorld(this.id);
  }
}
