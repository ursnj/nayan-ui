import { describe, expect, mock, test } from 'bun:test';
import { createTestCore } from '../../../native/__tests__/core';

// Lathes, tubes and lofts are built by the native core (the WASM build here).
const native = await createTestCore();
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));

mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  TurboModuleRegistry: { get: () => null },
  Image: { resolveAssetSource: () => null }
}));

const { smoothNormals, tube } = await import('../shape');

describe('sculpted surface normals', () => {
  test('unequal patches retain an equal-angle blend across a UV seam', () => {
    // A small XY patch and a large XZ patch meet at a right angle at the origin.
    const positions = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
      [0, 0, 10],
      [10, 0, 0]
    ];
    const vertices = new Float32Array(positions.flatMap((p, i) => [...p, 1, 0, 0, 1, 1, 1, i / 6, 0]));
    const geometry = { vertices, indices: new Uint32Array([0, 1, 2, 3, 4, 5]) };
    const before = vertices.slice();
    expect(smoothNormals(geometry)).toBe(geometry);
    for (const i of [0, 3]) {
      expect(vertices[i * 11 + 3]).toBeCloseTo(0, 6);
      expect(vertices[i * 11 + 4]).toBeCloseTo(Math.SQRT1_2, 6);
      expect(vertices[i * 11 + 5]).toBeCloseTo(Math.SQRT1_2, 6);
    }
    for (let i = 0; i < vertices.length; i++) if (i % 11 < 3 || i % 11 > 5) expect(vertices[i]).toBe(before[i]);
  });

  test('degenerate triangles and unused vertices preserve authored normals on buffer views', () => {
    const storage = new Float32Array(44).fill(7);
    const vertices = storage.subarray(11, 33);
    vertices.set([0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
    const before = storage.slice();
    smoothNormals({ vertices, indices: new Uint32Array([0, 0, 1, 0, 1, 20]) });
    expect(storage).toEqual(before);
  });
});

describe('tube generation', () => {
  test('tapered normals agree with a conical surface, including its UV seam', () => {
    const g = tube(
      [
        [0, 0, 0],
        [0, 0, 2]
      ],
      { radius: (t) => 0.5 - 0.4 * t, sides: 64, smoothness: 12, caps: false }
    );
    const at = 6 * 65 * 11;
    // Catmull-Rom is eased along Z, so compare the actual adjacent sampled radii/positions.
    const dz = g.vertices[at + 65 * 11 + 2]! - g.vertices[at - 65 * 11 + 2]!;
    const dr = Math.abs(g.vertices[at + 65 * 11]!) - Math.abs(g.vertices[at - 65 * 11]!);
    const expectedZ = -dr / Math.hypot(dr, dz);
    expect(g.vertices[at + 5]).toBeCloseTo(expectedZ, 3);
    for (let k = 0; k < 6; k++) expect(g.vertices[at + k]).toBeCloseTo(g.vertices[at + 64 * 11 + k]!, 6);
    expect(g.vertices[at + 9]).toBe(0);
    expect(g.vertices[at + 64 * 11 + 9]).toBe(1);
  });

  test('a right-angle tangent change keeps a full circular cross section', () => {
    const g = tube(
      [
        [0, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [2, 0, 1]
      ],
      { radius: 0.1, sides: 16, smoothness: 1, caps: false }
    );
    for (let j = 0; j <= 16; j++) {
      const at = (17 + j) * 11;
      expect(Math.hypot(g.vertices[at]!, g.vertices[at + 1]!, g.vertices[at + 2]! - 1)).toBeCloseTo(0.1, 6);
      expect(Math.hypot(g.vertices[at + 3]!, g.vertices[at + 4]!, g.vertices[at + 5]!)).toBeCloseTo(1, 6);
    }
  });

  test('closed nonplanar loops meet exactly, with no caps or frame twist', () => {
    const g = tube(
      [
        [0, 0, 0],
        [1, 0, 0.4],
        [1, 1, 0],
        [0, 1, -0.6],
        [0, 0, 0]
      ],
      { closed: true, sides: 12, smoothness: 8 }
    );
    const last = 32 * 13 * 11;
    expect(g.vertices.length).toBe(33 * 13 * 11);
    expect(g.indices.length).toBe(32 * 12 * 6);
    for (let j = 0; j <= 12; j++) for (let k = 0; k < 6; k++) expect(g.vertices[j * 11 + k]).toBe(g.vertices[last + j * 11 + k]);
    expect(g.vertices.every(Number.isFinite)).toBe(true);
  });

  test('duplicate points are harmless and an empty curve fails clearly', () => {
    const g = tube([
      [0, 0, 0],
      [0, 0, 0],
      [0, 1, 0]
    ]);
    expect(g.vertices.every(Number.isFinite)).toBe(true);
    expect(() =>
      tube([
        [0, 0, 0],
        [0, 0, 0]
      ])
    ).toThrow('distinct points');
  });
});

describe('field functions', () => {
  const close = (a: { vertices: Float32Array; indices: Uint32Array }, b: { vertices: Float32Array; indices: Uint32Array }) => {
    expect(Array.from(a.indices)).toEqual(Array.from(b.indices));
    expect(a.vertices.length).toBe(b.vertices.length);
    let worst = 0;
    for (let i = 0; i < a.vertices.length; i++) worst = Math.max(worst, Math.abs(a.vertices[i]! - b.vertices[i]!));
    expect(worst).toBeLessThan(1e-5);
  };

  test('lathe colors, caps, cut faces and displacement match the equivalent JS functions', async () => {
    const { lathe } = await import('../shape');
    const { faceColor, sectionColor, surfaceColor, surfaceDisplacement } = await import('../procedural');
    const profile: [number, number][] = [
      [0.3, 0.5],
      [0.5, 0.2],
      [0.45, -0.3],
      [0, -0.5]
    ];
    const base = { segments: 24, sweep: Math.PI, capRings: 6, cutSteps: 5 };
    const js = lathe(profile, {
      ...base,
      color: ({ u, v, position, normal }) => [u, v * 0.5 + position[1] * 0.1, Math.abs(normal[0])],
      capColor: (r, angle) => [r, Math.cos(angle) * 0.5 + 0.5, 0.2],
      cutColor: (r, y) => [r, y + 0.5, 0.3],
      displace: (u, v) => 0.01 * Math.sin(u * Math.PI * 6) * v
    });
    const field = lathe(profile, {
      ...base,
      color: surfaceColor((f, p) => [p.u, f.add(f.mul(p.v, 0.5), f.mul(p.y, 0.1)), f.abs(p.nx)]),
      capColor: faceColor((f, p) => [p.r, f.add(f.mul(f.cos(p.angle), 0.5), 0.5), 0.2]),
      cutColor: sectionColor((f, p) => [p.r, f.add(p.y, 0.5), 0.3]),
      displace: surfaceDisplacement((f, p) => f.product(0.01, f.sin(f.mul(p.u, Math.PI * 6)), p.v))
    });
    close(field, js);
  });

  test('tube colors and recolor match the equivalent JS functions', async () => {
    const { recolor, tube } = await import('../shape');
    const { faceColor, surfaceColor } = await import('../procedural');
    const points: [number, number, number][] = [
      [0, 0, 0],
      [0.2, 0.6, 0],
      [0.1, 1.2, 0.3]
    ];
    const js = tube(points, { radius: (t) => 0.1 - t * 0.05, color: ({ u, v }) => [u, v, 0.5], capColor: (r) => [r, 0, 0] });
    const field = tube(points, {
      radius: (t) => 0.1 - t * 0.05,
      color: surfaceColor((_f, p) => [p.u, p.v, 0.5]),
      capColor: faceColor((_f, p) => [p.r, 0, 0])
    });
    close(field, js);
    const painted = recolor(
      tube(points),
      surfaceColor((f, p) => [f.mul(p.x, 2), p.y, f.max(0, p.nz)])
    );
    const expected = recolor(tube(points), ({ position, normal }) => [position[0] * 2, position[1], Math.max(0, normal[2])]);
    close(painted, expected);
  });
});

describe('baked models', () => {
  test('a model bakes into an anti-aliased picture framed around it, shaded as under its light', async () => {
    const { createShape, lathe } = await import('../shape');
    const { bakeModel, textureImage } = await import('../texture');
    // A ball facing a front light (frontLight shows camera-facing surfaces at exactly their color).
    const profile: [number, number][] = Array.from({ length: 17 }, (_, i) => {
      const a = Math.PI / 2 - (i / 16) * Math.PI;
      return [Math.max(0, Math.cos(a) * 0.5), Math.sin(a) * 0.5];
    });
    const ball = createShape(lathe(profile, { segments: 48, color: [1, 0.5, 0.25] }), { center: false });
    const ambient = 0.5;
    const k = 1 / (ambient * 0.8 + (1 - ambient));
    const light = { direction: [0, 0, 1] as [number, number, number], ambient, color: [k, k, k] as [number, number, number] };
    const baked = bakeModel(ball, { size: 32, light, padding: 0.1 });
    expect(baked.texture).toMatchObject({ width: 32, height: 32 });
    expect(Math.abs(baked.center[0]) + Math.abs(baked.center[1])).toBeLessThan(1e-3);
    expect(baked.extent).toBeCloseTo(0.5 * 1.2, 3);
    const { pixels } = textureImage(baked.texture.id);
    const at = (x: number, y: number) => Array.from(pixels.subarray((y * 32 + x) * 4, (y * 32 + x) * 4 + 4));
    // The middle faces the light: its own color, opaque.
    const [r, g, b, a] = at(16, 16);
    expect(a).toBe(255);
    expect(Math.abs(r! - 255) + Math.abs(g! - 128) + Math.abs(b! - 64)).toBeLessThan(6);
    // Corners are empty; the rim is partly covered (smooth edges).
    expect(at(0, 0)[3]).toBe(0);
    expect(pixels.some((v, i) => i % 4 === 3 && v > 0 && v < 255)).toBe(true);
  });
});
