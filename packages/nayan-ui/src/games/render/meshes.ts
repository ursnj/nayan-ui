import NativeEngine from '../../native/NativeNayanEngine';
import { prepareEngine } from '../../native/prepare';
import { type Shape, SHAPE_MESH } from '../types';

// Interleaved position(3) + normal(3) + color(3) + uv(2), the same layout loaded models use.
// Built-in shapes are unit-sized, centered at the origin and white (the instance color tints them).
export const VERTEX_FLOATS = 11;

type V3 = readonly [number, number, number];

export class Builder {
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

/** Render-ready geometry: VERTEX_FLOATS floats per vertex, u32 triangle indices. */
export type MeshGeometry = { vertices: Float32Array; indices: Uint32Array };

/** What the renderer draws for a mesh id: geometry, and a texture id (see `loadTexture`) if any. */
/** `shine` 0..1: how glossy (sun highlight and sky reflection), 0 = matte. */
export type MeshInfo = {
  geometry: MeshGeometry;
  texture?: number;
  shine?: number;
};

const registered = new Map<number, MeshInfo>();
/** One past the highest mesh id registered (the 16 built-in shapes at least). */
let idLimit = 16;

/** Registers what a mesh id draws (loaded models, glyphs, textured variants). */
export function registerMesh(mesh: number, info: MeshInfo, uploadGeometry = true) {
  registered.set(mesh, info);
  idLimit = Math.max(idLimit, mesh + 1);
  if (uploadGeometry) upload(mesh, info);
}

/** One past the highest mesh id in use: per-frame scans of a source's ranges stop here. */
export const getMeshIdLimit = () => idLimit;

/** A typed array's bytes as an ArrayBuffer of exactly its length. */
function exact(data: Float32Array | Uint32Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = data;
  if (buffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === buffer.byteLength) return buffer;
  return data.slice().buffer;
}

/** Hands a mesh's geometry and material to the native renderer (which copies them). */
function upload(mesh: number, info: MeshInfo) {
  const { vertices, indices } = info.geometry;
  NativeEngine?.renderMesh(mesh, exact(vertices), exact(indices), info.texture ?? -1, info.shine ?? 0);
}

let builtInsUploaded = false;

/** Generates the built-in shapes in the Rust core and registers them with the native renderer (once). */
export function uploadBuiltInMeshes() {
  if (builtInsUploaded) return;
  NativeEngine?.generateBuiltinMeshes();
  builtInsUploaded = true;
}

/**
 * Initializes the shared core and built-in meshes. Await before using the engine on the web.
 * Mobile initialization remains synchronous and also warms the GPU on a background thread.
 * Repeat calls reuse initialization and mesh registration.
 */
export function warmUpEngine(): Promise<void> {
  const pending = prepareEngine();
  const warm = () => {
    const native = NativeEngine;
    if (!native) return;
    uploadBuiltInMeshes();
    // Apps built before this method existed draw as before: the first GameView makes the device.
    if (typeof native.renderWarmUp === 'function') native.renderWarmUp();
  };
  if (pending) return pending.then(warm);
  warm();
  return Promise.resolve();
}

/** What to draw for a mesh id, or undefined ("none", or unknown). Built-in shapes use native geometry. */
export function meshInfo(mesh: number): MeshInfo | undefined {
  const info = registered.get(mesh);
  if (info || mesh === SHAPE_MESH.none) return info;
  // Built-in shapes are generated in Rust; read their geometry from the renderer.
  const shape = (Object.keys(SHAPE_MESH) as Shape[]).find((s) => SHAPE_MESH[s] === mesh);
  if (!shape || shape === 'none') return undefined;
  const native = NativeEngine;
  if (!native) return undefined;
  let vertices = new Float32Array(native.renderMeshVertices(mesh));
  // Generate the built-in shapes on first use, so shapeGeometry works before warmUpEngine() on mobile.
  if (!vertices.length && !builtInsUploaded && typeof native.generateBuiltinMeshes === 'function') {
    try {
      uploadBuiltInMeshes();
    } catch {
      return undefined; // Browser core not loaded yet: callers report that warmUpEngine() is needed.
    }
    vertices = new Float32Array(native.renderMeshVertices(mesh));
  }
  const indices = new Uint32Array(native.renderMeshIndices(mesh));
  if (!vertices.length) return undefined;
  const made: MeshInfo = { geometry: { vertices, indices } };
  registered.set(mesh, made);
  return made;
}
