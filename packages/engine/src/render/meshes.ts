import { Mesh } from "../types";

// Interleaved position(3) + normal(3). All meshes are unit-sized and centered at the origin.
// Instance transforms assume uniform scale (or a plane scaled in X/Z) so normals stay correct.
type Geometry = { vertices: number[]; indices: number[] };

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
      g.vertices.push(x * 0.5, y * 0.5, z * 0.5, x, y, z);
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
    vertices: [-0.5, 0, -0.5, 0, 1, 0, -0.5, 0, 0.5, 0, 1, 0, 0.5, 0, 0.5, 0, 1, 0, 0.5, 0, -0.5, 0, 1, 0],
    indices: [0, 1, 2, 0, 2, 3],
  };
}

export type MeshRange = { firstIndex: number; indexCount: number; baseVertex: number };

/** All meshes packed into one vertex/index buffer; `ranges[meshId]` locates each one. */
export function createMeshes() {
  const geometry: Record<number, Geometry> = {
    [Mesh.Cube]: cube(),
    [Mesh.Sphere]: sphere(),
    [Mesh.Plane]: plane(),
  };
  const vertices: number[] = [];
  const indices: number[] = [];
  const ranges: MeshRange[] = [];
  for (const id of Object.values(Mesh)) {
    const g = geometry[id]!;
    ranges[id] = { firstIndex: indices.length, indexCount: g.indices.length, baseVertex: vertices.length / 6 };
    vertices.push(...g.vertices);
    indices.push(...g.indices);
  }
  // WebGPU buffer writes must be a multiple of 4 bytes: pad to an even number of u16 indices.
  if (indices.length % 2) indices.push(0);
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices), ranges };
}
