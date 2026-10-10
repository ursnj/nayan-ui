import { SHAPE_MESH, type Shape } from "../types";

// Interleaved position(3) + normal(3) + color(3) + uv(2), the same layout loaded models use.
// Built-in shapes are unit-sized, centered at the origin and white (the instance color tints them).
export const VERTEX_FLOATS = 11;

type V3 = readonly [number, number, number];

class Builder {
  vertices: number[] = [];
  indices: number[] = [];

  /** Adds a vertex, returns its index. */
  vertex(p: V3, n: V3, u: number, v: number) {
    this.vertices.push(p[0], p[1], p[2], n[0], n[1], n[2], 1, 1, 1, u, v);
    return this.vertices.length / VERTEX_FLOATS - 1;
  }

  /** Two triangles, counter-clockwise a b c d as seen from the front. */
  quad(a: number, b: number, c: number, d: number) {
    this.indices.push(a, b, c, a, c, d);
  }

  /**
   * A (rows + 1) x (cols + 1) vertex grid; `at(u, v)` gives position and normal. u runs along a row and
   * v down the rows; the grid faces the side from which u goes right and v goes down.
   */
  grid(rows: number, cols: number, at: (u: number, v: number) => [V3, V3]) {
    const first = this.vertices.length / VERTEX_FLOATS;
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const [p, n] = at(j / cols, i / rows);
        this.vertex(p, n, j / cols, i / rows);
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const a = first + i * (cols + 1) + j;
        const b = a + cols + 1;
        this.indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }

  /** A flat disc at height y facing up (+1) or down (-1). */
  disc(y: number, radius: number, facing: 1 | -1, segments: number) {
    const center = this.vertex([0, y, 0], [0, facing, 0], 0.5, 0.5);
    const first = center + 1;
    for (let j = 0; j <= segments; j++) {
      const t = (j / segments) * TAU;
      const x = Math.cos(t);
      const z = Math.sin(t);
      this.vertex([x * radius, y, z * radius], [0, facing, 0], 0.5 + x / 2, 0.5 + z / 2);
    }
    for (let j = 0; j < segments; j++) {
      if (facing === 1) this.indices.push(center, first + j + 1, first + j);
      else this.indices.push(center, first + j, first + j + 1);
    }
  }
}

const TAU = Math.PI * 2;

// Six faces: normal, then the in-face u and v axes (u x v = normal).
const FACES: readonly (readonly [V3, V3, V3])[] = [
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
];

/** A cube made of `steps` x `steps` grids per face; `shape` maps each surface point to position and normal. */
function boxFaces(steps: number, shape: (p: V3, faceNormal: V3) => [V3, V3]) {
  const g = new Builder();
  for (const [n, u, v] of FACES) {
    g.grid(steps, steps, (a, b) => {
      const s = a - 0.5; // along u
      const t = 0.5 - b; // along v, top row first
      return shape([n[0] * 0.5 + u[0] * s + v[0] * t, n[1] * 0.5 + u[1] * s + v[1] * t, n[2] * 0.5 + u[2] * s + v[2] * t], n);
    });
  }
  return g;
}

const cube = () => boxFaces(1, (p, n) => [p, n]);

/** A unit cube with edges rounded off: surface points pushed out from a smaller inner box. */
function roundedBox(radius = 0.1) {
  const inner = 0.5 - radius;
  const clamp = (x: number) => Math.max(-inner, Math.min(inner, x));
  return boxFaces(6, (p, n) => {
    const c: V3 = [clamp(p[0]), clamp(p[1]), clamp(p[2])];
    const d: V3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const len = Math.hypot(d[0], d[1], d[2]);
    const dir: V3 = len > 1e-6 ? [d[0] / len, d[1] / len, d[2] / len] : n;
    return [[c[0] + dir[0] * radius, c[1] + dir[1] * radius, c[2] + dir[2] * radius], dir];
  });
}

/** A point on a sphere of `radius` at latitude `phi` (0 = top) and longitude u (0..1), and its normal. */
function onSphere(radius: number, phi: number, u: number, yOffset = 0): [V3, V3] {
  const theta = -u * TAU;
  const n: V3 = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
  return [[n[0] * radius, n[1] * radius + yOffset, n[2] * radius], n];
}

function sphere(rings = 16, segments = 24) {
  const g = new Builder();
  g.grid(rings, segments, (u, v) => onSphere(0.5, v * Math.PI, u));
  return g;
}

/** Radius 0.25, total height 1: two hemispheres joined by a straight middle. */
function capsule(rings = 16, segments = 24) {
  const g = new Builder();
  const r = 0.25;
  const half = rings / 2;
  // Rows 0..half are the top cap, rows half+1..rings+1 the bottom cap; the band between them is the side.
  g.grid(rings + 1, segments, (u, v) => {
    const row = Math.round(v * (rings + 1));
    const top = row <= half;
    return onSphere(r, ((top ? row : row - 1) / rings) * Math.PI, u, top ? 0.5 - r : r - 0.5);
  });
  return g;
}

function cylinder(segments = 24) {
  const g = new Builder();
  g.grid(1, segments, (u, v) => {
    const t = -u * TAU;
    return [[Math.cos(t) * 0.5, 0.5 - v, Math.sin(t) * 0.5], [Math.cos(t), 0, Math.sin(t)]];
  });
  g.disc(0.5, 0.5, 1, segments);
  g.disc(-0.5, 0.5, -1, segments);
  return g;
}

function cone(segments = 24) {
  const g = new Builder();
  // Side normals tilt up by the slope (radius 0.5 over height 1).
  const ny = 0.5 / Math.hypot(1, 0.5);
  const nr = 1 / Math.hypot(1, 0.5);
  g.grid(1, segments, (u, v) => {
    const t = -u * TAU;
    const radius = v * 0.5; // v = 0 at the tip
    return [[Math.cos(t) * radius, 0.5 - v, Math.sin(t) * radius], [Math.cos(t) * nr, ny, Math.sin(t) * nr]];
  });
  g.disc(-0.5, 0.5, -1, segments);
  return g;
}

/** Lying flat in XZ: outer radius 0.5, tube radius 0.15. */
function torus(segments = 32, sides = 12) {
  const g = new Builder();
  const tube = 0.15;
  const ring = 0.5 - tube;
  g.grid(sides, segments, (u, v) => {
    const t = -u * TAU;
    const s = -v * TAU;
    const n: V3 = [Math.cos(s) * Math.cos(t), Math.sin(s), Math.cos(s) * Math.sin(t)];
    return [[Math.cos(t) * ring + n[0] * tube, n[1] * tube, Math.sin(t) * ring + n[2] * tube], n];
  });
  return g;
}

function plane() {
  const g = new Builder();
  const up: V3 = [0, 1, 0];
  g.quad(
    g.vertex([-0.5, 0, -0.5], up, 0, 0),
    g.vertex([-0.5, 0, 0.5], up, 0, 1),
    g.vertex([0.5, 0, 0.5], up, 1, 1),
    g.vertex([0.5, 0, -0.5], up, 1, 0),
  );
  return g;
}

/** Render-ready geometry: VERTEX_FLOATS floats per vertex, u32 triangle indices. */
export type MeshGeometry = { vertices: Float32Array; indices: Uint32Array };

/** What the renderer draws for a mesh id: geometry, and a texture id (see `loadTexture`) if any. */
export type MeshInfo = { geometry: MeshGeometry; texture?: number };

const BUILT_IN: Partial<Record<Shape, () => Builder>> = {
  cube,
  sphere,
  plane,
  cylinder,
  cone,
  capsule,
  torus,
  roundedBox: () => roundedBox(),
};

const built = new Map<number, MeshInfo>();
const registered = new Map<number, MeshInfo>();

/** Registers what a mesh id draws (loaded models, glyphs, textured variants). */
export function registerMesh(mesh: number, info: MeshInfo) {
  registered.set(mesh, info);
}

/** What to draw for a mesh id, or undefined ("none", or unknown). Built-in shapes are generated on first use. */
export function meshInfo(mesh: number): MeshInfo | undefined {
  const info = registered.get(mesh) ?? built.get(mesh);
  if (info) return info;
  const shape = (Object.keys(SHAPE_MESH) as Shape[]).find((s) => SHAPE_MESH[s] === mesh);
  const make = shape && BUILT_IN[shape];
  if (!make) return undefined;
  const g = make();
  const made = { geometry: { vertices: new Float32Array(g.vertices), indices: new Uint32Array(g.indices) } };
  built.set(mesh, made);
  return made;
}
