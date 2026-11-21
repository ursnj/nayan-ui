// Data-driven procedural worlds and meshes, built by the native core. A game describes its fields
// (terrain height, material contours, walkable clearance, placement rules, model surfaces) with a
// `FieldGraph`, puts them in a recipe, and the core generates terrain, scenery, reachable ground and
// picked spots, and answers walker queries, without any of that work running in JavaScript.
import type { EngineBridge, NativeGeometry } from '../../native/EngineBridge';
import NativeEngine from '../../native/NativeNayanEngine';
import type { MeshGeometry } from '../render/meshes';

/** A node of a field graph. Plain numbers are constants wherever a field is expected. */
export class FieldRef {
  constructor(readonly id: number) {}
}
export type FieldInput = FieldRef | number;

/** A 2D primitive in a field's (x, z) plane; `offset` is subtracted from its distance, `width` is its fade length. */
export type FieldShape =
  | { kind: 'point'; x: number; z: number; offset?: number; width?: number }
  | { kind: 'segment'; ax: number; az: number; bx: number; bz: number; offset?: number; width?: number }
  | { kind: 'box'; x: number; z: number; halfX: number; halfZ: number; yaw?: number; offset?: number; width?: number };

type Node = { op: string } & Record<string, unknown>;

/**
 * Builds a field graph: generic math and geometry nodes evaluated by the native core. Shared nodes
 * are computed once per sample point and `select` evaluates only the branch it takes.
 *
 * ```ts
 * const f = new FieldGraph();
 * const bank = f.sub(f.abs(f.sub(f.x, f.sines(f.x, f.z, 10, [[0, 0.035, 0, 11]]))), 5);
 * f.output('bank', bank);
 * ```
 */
export class FieldGraph {
  private nodes: Node[] = [];
  private outputs: Record<string, number> = {};
  private constants = new Map<number, FieldRef>();
  private inputs = new Map<string, FieldRef>();

  private node(node: Node): FieldRef {
    this.nodes.push(node);
    return new FieldRef(this.nodes.length - 1);
  }
  private ref(value: FieldInput): number {
    return (value instanceof FieldRef ? value : this.constant(value)).id;
  }
  private refs(values: FieldInput[]): number[] {
    return values.map((v) => this.ref(v));
  }

  constant(value: number): FieldRef {
    if (!Number.isFinite(value)) throw new Error('FieldGraph: constants must be finite');
    let ref = this.constants.get(value);
    if (!ref || Object.is(value, -0) !== Object.is(this.nodes[ref.id]?.value, -0)) {
      ref = this.node({ op: 'const', value });
      this.constants.set(value, ref);
    }
    return ref;
  }
  /** A named input: `x`/`z` (local frame) for terrain fields; u, v, row, col, i, count, r0… elsewhere. */
  input(name: string): FieldRef {
    let ref = this.inputs.get(name);
    if (!ref) {
      ref = this.node({ op: 'var', name });
      this.inputs.set(name, ref);
    }
    return ref;
  }
  get x(): FieldRef {
    return this.input('x');
  }
  get z(): FieldRef {
    return this.input('z');
  }

  add(a: FieldInput, b: FieldInput) {
    return this.node({ op: 'add', a: this.ref(a), b: this.ref(b) });
  }
  sub(a: FieldInput, b: FieldInput) {
    return this.node({ op: 'sub', a: this.ref(a), b: this.ref(b) });
  }
  mul(a: FieldInput, b: FieldInput) {
    return this.node({ op: 'mul', a: this.ref(a), b: this.ref(b) });
  }
  div(a: FieldInput, b: FieldInput) {
    return this.node({ op: 'div', a: this.ref(a), b: this.ref(b) });
  }
  /** a + b + c… left to right. */
  sum(...values: FieldInput[]): FieldRef {
    if (!values.length) return this.constant(0);
    let total = values[0] instanceof FieldRef ? values[0] : this.constant(values[0]!);
    for (const value of values.slice(1)) total = this.add(total, value);
    return total;
  }
  /** a · b · c… left to right. */
  product(...values: FieldInput[]): FieldRef {
    if (!values.length) return this.constant(1);
    let total = values[0] instanceof FieldRef ? values[0] : this.constant(values[0]!);
    for (const value of values.slice(1)) total = this.mul(total, value);
    return total;
  }
  min(...args: FieldInput[]) {
    return this.node({ op: 'min', args: this.refs(args) });
  }
  max(...args: FieldInput[]) {
    return this.node({ op: 'max', args: this.refs(args) });
  }
  neg(a: FieldInput) {
    return this.node({ op: 'neg', a: this.ref(a) });
  }
  abs(a: FieldInput) {
    return this.node({ op: 'abs', a: this.ref(a) });
  }
  sqrt(a: FieldInput) {
    return this.node({ op: 'sqrt', a: this.ref(a) });
  }
  floor(a: FieldInput) {
    return this.node({ op: 'floor', a: this.ref(a) });
  }
  square(a: FieldInput) {
    return this.node({ op: 'square', a: this.ref(a) });
  }
  sin(a: FieldInput) {
    return this.node({ op: 'sin', a: this.ref(a) });
  }
  cos(a: FieldInput) {
    return this.node({ op: 'cos', a: this.ref(a) });
  }
  exp(a: FieldInput) {
    return this.node({ op: 'exp', a: this.ref(a) });
  }
  /** `a` to the power `b`. */
  pow(a: FieldInput, b: FieldInput) {
    return this.node({ op: 'pow', a: this.ref(a), b: this.ref(b) });
  }
  /** `a − floor(a)`. */
  fract(a: FieldInput) {
    return this.node({ op: 'fract', a: this.ref(a) });
  }
  /**
   * Value noise in 0..1 on a unit lattice: the common sine-hash shader noise, smoothstep-blended.
   * With `period`, it repeats every `period` cells in x (to wrap around a lathe without a seam).
   */
  noise(x: FieldInput, z: FieldInput, period = 0) {
    return this.node({ op: 'noise', x: this.ref(x), z: this.ref(z), period });
  }
  /** a + (b − a) · t, componentwise on numbers or fields. */
  mix(a: FieldInput, b: FieldInput, t: FieldInput) {
    return this.add(a, this.mul(this.sub(b, a), t));
  }
  hypot(...args: FieldInput[]) {
    return this.node({ op: 'hypot', args: this.refs(args) });
  }
  /** Hermite smoothstep of `a` clamped to 0..1. */
  smooth(a: FieldInput) {
    return this.node({ op: 'smooth', a: this.ref(a) });
  }
  clamp(a: FieldInput, lo: FieldInput, hi: FieldInput) {
    return this.node({ op: 'clamp', a: this.ref(a), lo: this.ref(lo), hi: this.ref(hi) });
  }
  /** `le` where `test` <= 0, otherwise `gt` (only the chosen branch is evaluated). */
  select(test: FieldInput, le: FieldInput, gt: FieldInput) {
    return this.node({ op: 'select', test: this.ref(test), le: this.ref(le), gt: this.ref(gt) });
  }
  /** base + Σ amp · sin(fx·x + fz·z + phase), terms as [fx, fz, phase, amp]. */
  sines(x: FieldInput, z: FieldInput, base: number, terms: readonly (readonly [number, number, number, number])[]) {
    return this.node({ op: 'sines', x: this.ref(x), z: this.ref(z), base, terms });
  }
  /** Σ height · max(0, 1 − u² − v²)^power over oriented ellipses [x, z, height, radiusU, radiusV, yaw]. */
  bumps(x: FieldInput, z: FieldInput, items: readonly (readonly [number, number, number, number, number, number])[], power = 2) {
    return this.node({ op: 'bumps', x: this.ref(x), z: this.ref(z), items, power });
  }
  /** The smallest signed distance to the shapes (minus each one's offset); +∞ with none. */
  distance(x: FieldInput, z: FieldInput, shapes: readonly FieldShape[]) {
    return this.node({ op: 'distance', x: this.ref(x), z: this.ref(z), shapes });
  }
  /** Π smoothstep((distance − offset) / width): 0 at the shapes, 1 beyond their fade. */
  falloff(x: FieldInput, z: FieldInput, shapes: readonly FieldShape[]) {
    return this.node({ op: 'falloff', x: this.ref(x), z: this.ref(z), shapes });
  }
  /** The largest depth inside any of the boxes (min of side clearances, minus offset); −∞ with none. */
  depth(x: FieldInput, z: FieldInput, shapes: readonly FieldShape[]) {
    return this.node({ op: 'depth', x: this.ref(x), z: this.ref(z), shapes });
  }

  /** Names a field so recipes can refer to it. Returns the name. */
  output(name: string, value: FieldInput): string {
    this.outputs[name] = this.ref(value);
    return name;
  }

  toJSON() {
    return { nodes: this.nodes, outputs: this.outputs };
  }
}

// Field functions: per-point model functions (colors, displacement) evaluated by the native core.

type Inputs<K extends string> = { readonly [P in K]: FieldRef };
type Color3 = readonly [FieldInput, FieldInput, FieldInput];

/**
 * A function of named inputs written as a field graph, for model options that would otherwise call
 * a JS function per vertex: `lathe`/`tube`/`loft` colors and `lathe` displacement, `recolor`. Build
 * one with `surfaceColor`, `faceColor`, `sectionColor` or `surfaceDisplacement`.
 */
export class FieldFunction {
  constructor(
    readonly fields: FieldGraph,
    readonly outputs: number
  ) {}
  toJSON() {
    return { fields: this.fields, out: Array.from({ length: this.outputs }, (_, i) => `out${i}`) };
  }
}

function fieldFunction<K extends string>(names: readonly K[], build: (f: FieldGraph, inputs: Inputs<K>) => FieldInput | Color3): FieldFunction {
  const f = new FieldGraph();
  const inputs = Object.fromEntries(names.map((name) => [name, f.input(name)])) as Inputs<K>;
  const result = build(f, inputs);
  const out = Array.isArray(result) ? result : [result as FieldInput];
  out.forEach((value, i) => f.output(`out${i}`, value));
  return new FieldFunction(f, out.length);
}

/**
 * A color of each surface point: `u`, `v` (texture coordinates; around and along a lathe or tube),
 * position `x`, `y`, `z` and normal `nx`, `ny`, `nz`. Returns [r, g, b].
 */
export const surfaceColor = (build: (f: FieldGraph, p: Inputs<'u' | 'v' | 'x' | 'y' | 'z' | 'nx' | 'ny' | 'nz'>) => Color3) =>
  fieldFunction(['u', 'v', 'x', 'y', 'z', 'nx', 'ny', 'nz'], build);
/** A color across a round end face: `r` from its center (0) to its rim (1), `angle` around it (radians). */
export const faceColor = (build: (f: FieldGraph, p: Inputs<'r' | 'angle'>) => Color3) => fieldFunction(['r', 'angle'], build);
/** A color across a lathe's cut face: `r` from the axis (0) to the skin (1) at that height, and the height `y`. */
export const sectionColor = (build: (f: FieldGraph, p: Inputs<'r' | 'y'>) => Color3) => fieldFunction(['r', 'y'], build);
/** A lathe's displacement along its normal at (`u` around, `v` down the profile). */
export const surfaceDisplacement = (build: (f: FieldGraph, p: Inputs<'u' | 'v'>) => FieldInput) => fieldFunction(['u', 'v'], build);

// Recipes (mirrors of the native core's schema).

type Three = readonly [string, string, string];
export type MeshPart =
  | {
      kind: 'surface';
      rows: number;
      cols: number;
      position: Three;
      normal: Three;
      uv: readonly [string, string];
      color: Three;
      double?: boolean;
      flip?: boolean;
    }
  | {
      kind: 'cards';
      count: number;
      seed: number;
      randoms: number;
      /** [cu, cv, texU, texV] per corner (3 or 4): center + right·cu + up·cv. */
      corners: readonly (readonly [number, number, number, number])[];
      center: Three;
      right: Three;
      up: Three;
      normal: Three;
      color: Three;
      double?: boolean;
    };
export interface MeshRecipe {
  fields: FieldGraph;
  parts: readonly MeshPart[];
}

export type Frame = 'local' | 'world';
export interface TerrainRecipe {
  /** Grid lines along both axes, ascending. */
  axis: readonly number[];
  height: string;
  normalStep?: number;
  uvSize?: readonly [number, number];
  shade?: string;
  tint?: readonly [number, number, number];
  /** Tested in order: a point belongs to the first region whose field is <= 0. */
  regions?: readonly { field: string; surface: number; material: number }[];
  fallback: { surface: number; material: number };
  materials: number;
}
export type SolidRecipe =
  | { kind: 'box'; x: number; z: number; halfX: number; halfZ: number; yaw?: number; bottom: number; top: number; frame?: Frame }
  | { kind: 'circle'; x: number; z: number; radius: number; bottom: number; top: number; frame?: Frame }
  | { kind: 'hull'; template: number; x: number; y: number; z: number; scale: readonly [number, number, number]; yaw?: number; frame?: Frame };
export type ScatterFilter =
  | { kind: 'field'; field: string; min?: number; max?: number }
  | { kind: 'walkable'; radius: number }
  | { kind: 'surface'; surfaces: readonly number[] }
  | { kind: 'spawn'; minDistance: number };
export type ItemSolid =
  | { kind: 'none' }
  | { kind: 'circle'; radius: string; bottom: string; top: string }
  | { kind: 'hull'; template: string; scale: Three; y: string; yaw: string };
export interface ScatterLayer {
  name: string;
  count: number;
  randoms?: number;
  /** Layers with the same salt draw the same random values (paired scenery); by default each step has its own. */
  salt?: number;
  source?: 'none' | 'reachable' | { anchors: readonly (readonly number[])[] };
  frame?: Frame;
  x: string;
  z: string;
  filters?: readonly ScatterFilter[];
  y: string;
  attributes?: readonly string[];
  solid?: { variant?: string; shapes: readonly ItemSolid[] };
}
export type WorldStep =
  | { kind: 'spawn'; near: readonly [number, number]; rings: number; samples: number; radius: number; surfaces?: readonly number[] }
  | ({ kind: 'scatter' } & ScatterLayer)
  | { kind: 'reach'; cell: number; steps: number; radius: number; extent: number }
  | { kind: 'pick'; groups: readonly { name: string; count: number; spacing: number; fromSpawn?: number }[]; attempts?: number }
  | { kind: 'overview'; size: number; extent: number };
export interface WorldRecipe {
  seed: number;
  /** Turns the local frame (fields, platforms, local solids) into the world. */
  rotation?: number;
  fields: FieldGraph;
  terrain: TerrainRecipe;
  platforms?: readonly { x: number; z: number; halfX: number; halfZ: number; y: number; surface: number }[];
  /** Mesh recipes whose convex hulls are solid templates (rendered rocks block exactly their outline). */
  templates?: readonly MeshRecipe[];
  solids?: readonly SolidRecipe[];
  walk: {
    boundary: number;
    clearance: string;
    footprint?: number;
    step?: readonly [number, number];
    height: number;
    lift?: number;
    cell?: number;
  };
  steps: readonly WorldStep[];
}

export interface WorldOptions {
  /** Saves the world under this storage key, and restores one saved there from the same recipe. */
  key?: string;
  /** Also builds the terrain meshes (on the build's thread with `generateWorldAsync`). */
  prepareTerrain?: boolean;
}

export interface Spot {
  x: number;
  z: number;
}

const engine = (): EngineBridge => {
  const native = NativeEngine;
  if (!native) throw new Error('procedural worlds: the native core is not linked into this build');
  if (typeof native.worldgenBuild !== 'function') throw new Error("procedural worlds: this app's native core predates them: rebuild it");
  return native;
};

const recipeText = (recipe: WorldRecipe | MeshRecipe) =>
  JSON.stringify(recipe, (_key, value: unknown) => (value instanceof FieldGraph ? value.toJSON() : value));

const geometry = (buffers: NativeGeometry): MeshGeometry => ({
  vertices: new Float32Array(buffers.vertices),
  indices: new Uint32Array(buffers.indices)
});

const spots = (points: readonly (readonly [number, number])[]): Spot[] => points.map(([x, z]) => ({ x, z }));

interface Info {
  spawn: [number, number];
  restored: boolean;
  layers: Record<string, { stride: number; count: number }>;
  picks: Record<string, [number, number][]>;
}

const bodyBuffers = new Map<number, Float64Array>();

/** A generated world held by the native core; queries take world coordinates. */
export class ProceduralWorld {
  readonly spawn: Spot;
  /** True when it was restored from storage rather than generated. */
  readonly restored: boolean;
  readonly layers: Readonly<Record<string, { stride: number; count: number }>>;
  picks: Record<string, Spot[]>;
  private fields = new Map<string, number>();
  private disposed = false;

  constructor(readonly handle: number) {
    const info = JSON.parse(engine().worldgenInfo(handle)) as Info;
    this.spawn = { x: info.spawn[0], z: info.spawn[1] };
    this.restored = info.restored;
    this.layers = info.layers;
    this.picks = Object.fromEntries(Object.entries(info.picks).map(([name, points]) => [name, spots(points)]));
  }

  private get id() {
    if (this.disposed) throw new Error('ProceduralWorld: used after dispose');
    return this.handle;
  }

  /** A scatter layer's items: [x, y, z, ...attributes] per item (see `layers[name].stride`). */
  layer(name: string): Float64Array {
    return new Float64Array(engine().worldgenLayer(this.id, name));
  }
  /** Reachable cells as [x, z] pairs. */
  reachable(): Float64Array {
    return new Float64Array(engine().worldgenReachable(this.id));
  }
  /** The overview step's surface codes, row by row (0 outside the walk boundary). */
  overview(): Uint8Array {
    return new Uint8Array(engine().worldgenOverview(this.id));
  }
  /** Re-picks the spots for run `run` (0 = as generated); false keeps the previous ones. */
  pick(run: number): boolean {
    const native = engine();
    if (!native.worldgenPick(this.id, run)) return false;
    const info = JSON.parse(native.worldgenInfo(this.id)) as Info;
    this.picks = Object.fromEntries(Object.entries(info.picks).map(([name, points]) => [name, spots(points)]));
    return true;
  }
  /** The terrain mesh of `material` (built once; each material is handed over once). */
  terrain(material: number): MeshGeometry {
    return geometry(engine().worldgenTerrain(this.id, material));
  }
  ground(x: number, z: number): number {
    return engine().worldgenGround(this.id, x, z);
  }
  surface(x: number, z: number): number {
    return engine().worldgenSurface(this.id, x, z);
  }
  /** The platform (recipe index) under a point, or -1. */
  platformAt(x: number, z: number): number {
    return engine().worldgenPlatform(this.id, x, z);
  }
  walkable(x: number, z: number, radius: number): boolean {
    return engine().worldgenWalkable(this.id, x, z, radius);
  }
  /** How far a walker of `radius` is from anything blocking it (negative when blocked). */
  clearance(x: number, z: number, radius: number): number {
    return engine().worldgenClearance(this.id, x, z, radius);
  }
  solidClearance(x: number, z: number, radius: number, bottom: number, top: number): number {
    return engine().worldgenSolidClearance(this.id, x, z, radius, bottom, top);
  }
  /** A named field of the recipe at a world point. */
  field(name: string, x: number, z: number): number {
    let index = this.fields.get(name);
    if (index === undefined) {
      index = engine().worldgenFieldIndex(this.id, name);
      if (index < 0) throw new Error(`ProceduralWorld: no field named ${name}`);
      this.fields.set(name, index);
    }
    return engine().worldgenField(this.id, index, x, z);
  }
  /** The ground's tilt as a quaternion [x, y, z, w], in a frame turned by `yaw`. */
  tilt(x: number, z: number, yaw = 0): [number, number, number, number] {
    return engine().worldgenTilt(this.id, x, z, yaw);
  }
  /** Whether a walker of `radius` could walk straight from a to b, ends at most `rise` apart in height. */
  canSee(a: Spot, b: Spot, { radius = 0.25, step = 0.4, rise = Infinity }: { radius?: number; step?: number; rise?: number } = {}): boolean {
    return engine().worldgenSight(this.id, a.x, a.z, b.x, b.z, radius, step, rise === Infinity ? Number.MAX_VALUE : rise);
  }
  /** Sweeps a walker by (dx, dz), sliding along obstacles and other `bodies`; updates `point`. */
  move(point: Spot, dx: number, dz: number, radius: number, bodies: readonly (Spot & { radius: number })[] = []): void {
    let buffer = bodyBuffers.get(bodies.length);
    if (!buffer) bodyBuffers.set(bodies.length, (buffer = new Float64Array(bodies.length * 3)));
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]!;
      buffer[i * 3] = b.x;
      buffer[i * 3 + 1] = b.z;
      buffer[i * 3 + 2] = b.radius;
    }
    const [x, z] = engine().worldgenMove(this.id, point.x, point.z, dx, dz, radius, buffer.buffer);
    point.x = x;
    point.z = z;
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    engine().worldgenFree(this.handle);
  }
}

const opened = (handle: number): ProceduralWorld => {
  if (!handle) throw new Error(`procedural world: ${engine().worldgenError() || 'generation failed'}`);
  return new ProceduralWorld(handle);
};

/** Generates (or restores, see `WorldOptions.key`) a world on this thread. */
export function generateWorld(recipe: WorldRecipe, options: WorldOptions = {}): ProceduralWorld {
  return opened(engine().worldgenBuild(recipeText(recipe), options.key ?? '', options.prepareTerrain ?? false));
}

/** `generateWorld` on a background native thread (the web core builds at once). */
export async function generateWorldAsync(recipe: WorldRecipe, options: WorldOptions = {}): Promise<ProceduralWorld> {
  return opened(await engine().worldgenBuildAsync(recipeText(recipe), options.key ?? '', options.prepareTerrain ?? false));
}

/** Whether a world was saved under `key` (cheap: doesn't read the world). */
export function isWorldKept(key: string): boolean {
  return engine().worldgenKept(key);
}

/** Builds a procedural mesh (parametric surfaces and seeded cards) in the native core. */
export function generateMesh(recipe: MeshRecipe): MeshGeometry {
  return geometry(engine().worldgenMesh(recipeText(recipe)));
}

/** Recolors geometry in place (and returns it) by a `surfaceColor`, in the native core. */
export function paintGeometry<G extends MeshGeometry>(geometry: G, color: FieldFunction): G {
  const v = geometry.vertices;
  const whole = v.byteOffset === 0 && v.byteLength === v.buffer.byteLength;
  const buffer = whole ? v.buffer : v.slice().buffer;
  if (!engine().worldgenPaint(buffer, JSON.stringify(color))) throw new Error(`recolor: ${engine().worldgenError()}`);
  if (!whole) v.set(new Float32Array(buffer));
  return geometry;
}
