import type { NativeGeometry } from '../../native/EngineBridge';
// Declarative solid modelling and native mesh preparation. These produce ordinary Geometry,
// so solids, lathes, lofts, imported geometry and hand-authored parts compose through merge().
import NativeEngine from '../../native/NativeNayanEngine';
import type { Vec3 } from '../types';
import type { Color, Quat } from '../world/types';
import type { Model } from './model';
import { type Geometry, preparedModel, prepareOptions, type ShapeOptions, smoothNormals } from './shape';

type Node =
  | { readonly kind: 'sphere'; readonly radius: number }
  | { readonly kind: 'ellipsoid'; readonly radii: Vec3 }
  | { readonly kind: 'box'; readonly size: Vec3; readonly radius: number }
  | {
      readonly kind: 'capsule';
      readonly start: Vec3;
      readonly end: Vec3;
      readonly radius: number;
    }
  | {
      readonly kind: 'cylinder';
      readonly radius: number;
      readonly height: number;
    }
  | { readonly kind: 'torus'; readonly radius: number; readonly tube: number }
  | {
      readonly kind: 'union';
      readonly a: Node;
      readonly b: Node;
      readonly blend: number;
    }
  | {
      readonly kind: 'subtract' | 'intersect';
      readonly a: Node;
      readonly b: Node;
    }
  | {
      readonly kind: 'transform';
      readonly child: Node;
      readonly position: Vec3;
      readonly rotation: Quat;
      readonly scale: Vec3;
    }
  | { readonly kind: 'paint'; readonly child: Node; readonly color: Color }
  | { readonly kind: 'shell'; readonly child: Node; readonly thickness: number }
  | {
      readonly kind: 'displace';
      readonly child: Node;
      readonly amplitude: number;
      readonly frequency: number;
      readonly seed: number;
      readonly octaves: number;
    };

const vector = (v: Vec3): Vec3 => [v[0], v[1], v[2]];

/**
 * An immutable, code-authored solid. Join primitives into a single surface, blend organic forms,
 * drill holes, hollow shells and add reproducible rock/terrain detail before tessellating once.
 * Distances use world units; primitives are centered at the origin, cylinders/tori use the Y axis.
 *
 * const torso = Solid.ellipsoid([0.5, 0.7, 0.3]).paint([0.5, 0.1, 0.9]);
 * const neck = Solid.capsule([0, 0.5, 0], [0, 0.9, 0], 0.15);
 * const geometry = solidGeometry(torso.blend(neck, 0.15), { resolution: 48 });
 */
export class Solid {
  private constructor(private readonly node: Node) {}

  static sphere(radius = 0.5): Solid {
    return new Solid({ kind: 'sphere', radius });
  }
  static ellipsoid(radii: Vec3): Solid {
    return new Solid({ kind: 'ellipsoid', radii: vector(radii) });
  }
  /** Full width/height/depth. Rounding stays inside these dimensions. */
  static box(size: Vec3, radius = 0): Solid {
    return new Solid({ kind: 'box', size: vector(size), radius });
  }
  static capsule(start: Vec3, end: Vec3, radius: number): Solid {
    return new Solid({
      kind: 'capsule',
      start: vector(start),
      end: vector(end),
      radius
    });
  }
  static cylinder(radius: number, height: number): Solid {
    return new Solid({ kind: 'cylinder', radius, height });
  }
  /** Major radius to the tube center; minor radius of the tube itself. */
  static torus(radius: number, tube: number): Solid {
    return new Solid({ kind: 'torus', radius, tube });
  }
  /** Balanced union for many parts; avoids building a deeply nested operation chain. */
  static union(...solids: readonly Solid[]): Solid {
    if (solids.length === 0) throw new Error('Solid.union needs at least one solid');
    if (solids.length === 1) return solids[0]!;
    const middle = Math.floor(solids.length / 2);
    return Solid.union(...solids.slice(0, middle)).union(Solid.union(...solids.slice(middle)));
  }
  union(other: Solid): Solid {
    return new Solid({ kind: 'union', a: this.node, b: other.node, blend: 0 });
  }
  /** Smoothly weld overlapping forms; blend controls the transition width in world units. */
  blend(other: Solid, blend: number): Solid {
    return new Solid({ kind: 'union', a: this.node, b: other.node, blend });
  }
  subtract(other: Solid): Solid {
    return new Solid({ kind: 'subtract', a: this.node, b: other.node });
  }
  intersect(other: Solid): Solid {
    return new Solid({ kind: 'intersect', a: this.node, b: other.node });
  }
  translate(position: Vec3): Solid {
    return this.transform(position, [0, 0, 0, 1], [1, 1, 1]);
  }
  rotate(rotation: Quat): Solid {
    return this.transform([0, 0, 0], rotation, [1, 1, 1]);
  }
  scale(scale: number | Vec3): Solid {
    return this.transform([0, 0, 0], [0, 0, 0, 1], typeof scale === 'number' ? [scale, scale, scale] : scale);
  }
  private transform(position: Vec3, rotation: Quat, scale: Vec3): Solid {
    return new Solid({
      kind: 'transform',
      child: this.node,
      position: vector(position),
      rotation: [...rotation],
      scale: vector(scale)
    });
  }
  /** Vertex colors blend with the surface at smooth joins. Apply after subtract() to color cut walls. */
  paint(color: Color): Solid {
    return new Solid({
      kind: 'paint',
      child: this.node,
      color: [color[0], color[1], color[2]]
    });
  }
  /** A shell centered on the original surface; thickness is its full wall thickness. */
  shell(thickness: number): Solid {
    return new Solid({ kind: 'shell', child: this.node, thickness });
  }
  /** Seeded fractal value noise. Use a resolution fine enough to sample its smallest features. */
  displace(options: DisplacementOptions): Solid {
    return new Solid({
      kind: 'displace',
      child: this.node,
      amplitude: options.amplitude,
      frequency: options.frequency ?? 2,
      seed: options.seed ?? 0,
      octaves: options.octaves ?? 3
    });
  }
  /** Serializable recipe for caching or inspecting a generated asset. */
  toJSON(): Node {
    return this.node;
  }
}

export interface DisplacementOptions {
  amplitude: number;
  frequency?: number;
  seed?: number;
  /** 1..6 octaves. Default 3. */
  octaves?: number;
}

export interface SolidOptions {
  /** Cells across the longest dimension, 8..128. Default 48. Higher costs cubic sampling work. */
  resolution?: number;
  /** Planar UV projection. Use parametricSurface/loft for explicitly authored UVs. Default xy. */
  uv?: 'xy' | 'xz' | 'yz';
}

function unpack(buffers: NativeGeometry): Geometry {
  if (!(buffers.vertices instanceof ArrayBuffer) || !(buffers.indices instanceof ArrayBuffer))
    throw new Error('modelling: invalid native geometry result');
  return {
    vertices: new Float32Array(buffers.vertices),
    indices: new Uint32Array(buffers.indices)
  };
}

/** Tessellates into editable, unregistered geometry. Prefer createSolid() for automatic model reuse. */
export function solidGeometry(solid: Solid, options: SolidOptions = {}): Geometry {
  if (typeof NativeEngine?.geometrySolid !== 'function') throw new Error("solidGeometry: rebuild the app with the engine's native modelling tools");
  return unpack(
    NativeEngine.geometrySolid(
      JSON.stringify({
        solid,
        resolution: options.resolution ?? 48,
        uv: options.uv ?? 'xy'
      })
    )
  );
}

/**
 * Tessellates, cleans and registers a solid once, then returns its cached model on later calls
 * with the same recipe/options. White vertex colors can be tinted per spawned entity. Temporary
 * intermediate meshes consume no IDs. Prepared solids persist automatically when platform storage
 * is available; storage failure falls back to building. Call after warmUpEngine(), before spawning a run.
 */
export function createSolid(solid: Solid, options: SolidOptions & ShapeOptions = {}): Model {
  if (typeof NativeEngine?.solidPrepare !== 'function') throw new Error("createSolid: rebuild the app with the engine's Rust asset preparation");
  const { resolution = 48, uv = 'xy', shine = 0, optimize = true } = options;
  const mesh = NativeEngine.solidPrepare(JSON.stringify({ solid, resolution, uv }), prepareOptions({ ...options, optimize }));
  if (mesh < 0) throw new Error(`createSolid: ${NativeEngine.loadError()}`);
  return preparedModel(mesh, shine);
}

export interface OptimizeOptions {
  /** Target triangle fraction in (0,1]. Default 1: lossless cleanup, welding and GPU cache ordering. */
  ratio?: number;
  /** Maximum relative error, 0..1, against the largest dimension, with attribute error included. Default 0.001. */
  error?: number;
  /** Keep open borders fixed, useful for separately generated terrain chunks. Default true. */
  lockBorders?: boolean;
}

const wholeBuffer = (array: Float32Array | Uint32Array): ArrayBuffer =>
  (array.byteOffset === 0 && array.byteLength === array.buffer.byteLength ? array.buffer : array.slice().buffer) as ArrayBuffer;

/**
 * Returns new geometry, preserving the input and its normal/color/UV seams. Removes degenerate
 * triangles and unused/identical vertices, simplifies within the error bound, then orders buffers
 * for GPU reuse. The error bound may prevent reaching the requested ratio. Opaque static meshes only:
 * do not use on skinning buffers or meshes whose vertex indices are used by external code.
 */
export function optimizeGeometry(geometry: Geometry, options: OptimizeOptions = {}): Geometry {
  if (typeof NativeEngine?.geometryOptimize !== 'function')
    throw new Error("optimizeGeometry: rebuild the app with the engine's native modelling tools");
  return unpack(
    NativeEngine.geometryOptimize(
      wholeBuffer(geometry.vertices),
      wholeBuffer(geometry.indices),
      options.ratio ?? 1,
      options.error ?? 0.001,
      options.lockBorders ?? true
    )
  );
}

/**
 * Independently simplifies the original at each requested ratio, avoiding accumulated error.
 * Cache/register the results once. The caller selects a level when camera distance changes.
 */
export function createGeometryLods(
  geometry: Geometry,
  ratios: readonly number[] = [1, 0.5, 0.25],
  options: Omit<OptimizeOptions, 'ratio'> = {}
): Geometry[] {
  if (ratios.length === 0 || ratios.some((r, i) => !Number.isFinite(r) || r <= 0 || r > 1 || (i > 0 && r >= ratios[i - 1]!)))
    throw new Error('createGeometryLods: ratios must strictly decrease within (0, 1]');
  return ratios.map((ratio) => optimizeGeometry(geometry, { ...options, ratio }));
}

export interface GeometryStats {
  vertices: number;
  triangles: number;
  /** CPU geometry bytes, excluding registration/driver copies. */
  bytes: number;
  bounds: { min: Vec3; max: Vec3; size: Vec3 } | null;
}

/** Cheap counts and bounds without registering a mesh. */
export function getGeometryStats(geometry: Geometry): GeometryStats {
  const v = geometry.vertices;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < v.length; i += 11)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, v[i + k]!);
      max[k] = Math.max(max[k]!, v[i + k]!);
    }
  return {
    vertices: v.length / 11,
    triangles: geometry.indices.length / 3,
    bytes: v.byteLength + geometry.indices.byteLength,
    bounds: v.length ? { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] } : null
  };
}

/** Copies/sculpts one smooth surface and updates its normals. Deform hard-edged parts separately. */
export function deformGeometry(geometry: Geometry, deform: (position: Vec3, uv: readonly [number, number]) => Vec3): Geometry {
  const vertices = geometry.vertices.slice();
  for (let i = 0; i < vertices.length; i += 11) {
    const point = deform([vertices[i]!, vertices[i + 1]!, vertices[i + 2]!], [vertices[i + 9]!, vertices[i + 10]!]);
    if (point.some((v) => !Number.isFinite(v))) throw new Error('deformGeometry: position must be finite');
    vertices.set(point, i);
  }
  return smoothNormals({ vertices, indices: geometry.indices.slice() });
}
