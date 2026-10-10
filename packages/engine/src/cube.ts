// Unit cube, interleaved position(3) + normal(3), 24 verts / 36 indices.
type Vec3 = readonly [number, number, number];

// Per face: normal, and the two tangent axes spanning it.
const FACES: readonly (readonly [Vec3, Vec3, Vec3])[] = [
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
];

const CORNERS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

export function createCube() {
  const vertices: number[] = [];
  const indices: number[] = [];
  FACES.forEach(([n, u, v], f) => {
    for (const [a, b] of CORNERS) {
      vertices.push(
        (n[0] + u[0] * a + v[0] * b) * 0.5,
        (n[1] + u[1] * a + v[1] * b) * 0.5,
        (n[2] + u[2] * a + v[2] * b) * 0.5,
        n[0],
        n[1],
        n[2],
      );
    }
    const o = f * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}
