import { Mesh } from "../types";

// Interleaved position(3) + normal(3) + color(3), the same layout loaded models use. Built-in shapes
// are unit-sized, centered at the origin and white (the instance color tints them).
// Instance transforms assume uniform scale (or a plane scaled in X/Z) so normals stay correct.
type Geometry = { vertices: number[]; indices: number[] };

export const VERTEX_FLOATS = 9;

function cube(): Geometry {
  type V3 = readonly [number, number, number];
  const faces: readonly (readonly [V3, V3, V3])[] = [
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
  const g: Geometry = { vertices: [], indices: [] };
  faces.forEach(([n, u, v], f) => {
    for (const [a, b] of corners) {
      g.vertices.push(
        (n[0] + u[0] * a + v[0] * b) * 0.5,
        (n[1] + u[1] * a + v[1] * b) * 0.5,
        (n[2] + u[2] * a + v[2] * b) * 0.5,
        n[0], n[1], n[2],
        1, 1, 1,
      );
    }
    const o = f * 4;
    g.indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return g;
}

function sphere(rings = 16, segments = 24): Geometry {
  const g: Geometry = { vertices: [], indices: [] };
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI;
    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      g.vertices.push(x * 0.5, y * 0.5, z * 0.5, x, y, z, 1, 1, 1);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      g.indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  return g;
}

function plane(): Geometry {
  return {
    vertices: [
      -0.5, 0, -0.5, 0, 1, 0, 1, 1, 1,
      -0.5, 0, 0.5, 0, 1, 0, 1, 1, 1,
      0.5, 0, 0.5, 0, 1, 0, 1, 1, 1,
      0.5, 0, -0.5, 0, 1, 0, 1, 1, 1,
    ],
    indices: [0, 1, 2, 0, 2, 3],
  };
}

/** Render-ready geometry: VERTEX_FLOATS floats per vertex, u32 triangle indices. */
export type MeshGeometry = { vertices: Float32Array; indices: Uint32Array };

const toGeometry = (g: Geometry): MeshGeometry => ({
  vertices: new Float32Array(g.vertices),
  indices: new Uint32Array(g.indices),
});

let builtIns: Map<number, MeshGeometry> | null = null;
const models = new Map<number, MeshGeometry>();

/** Registers a loaded model's geometry under its mesh id (see loadModel). */
export function registerMesh(mesh: number, geometry: MeshGeometry) {
  models.set(mesh, geometry);
}

/** Geometry for a mesh id: a built-in shape or a loaded model. */
export function meshGeometry(mesh: number): MeshGeometry | undefined {
  builtIns ??= new Map([
    [Mesh.Cube, toGeometry(cube())],
    [Mesh.Sphere, toGeometry(sphere())],
    [Mesh.Plane, toGeometry(plane())],
  ]);
  return builtIns.get(mesh) ?? models.get(mesh);
}
