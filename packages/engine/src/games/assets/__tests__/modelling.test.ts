import { expect, mock, test } from 'bun:test';
import { createTestCore } from '../../../native/__tests__/core';

// Lathes, tubes and lofts are built by the native core (the WASM build here); solids and the
// optimizer stay unlinked, to check that they explain the rebuild requirement.
const native = { ...(await createTestCore()), geometrySolid: undefined, geometryOptimize: undefined };
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));

mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  TurboModuleRegistry: { get: () => null },
  Image: { resolveAssetSource: () => null }
}));
const { Solid, solidGeometry, optimizeGeometry, createGeometryLods, getGeometryStats, deformGeometry } = await import('../modelling');
const { loft, ellipsoid, smoothCurve } = await import('../loft');
const { parametricSurface } = await import('../surface');

test('solid recipes preserve their inputs and composition order', () => {
  const position: [number, number, number] = [1, 2, 3];
  const base = Solid.box([2, 3, 4], 0.2);
  const moved = base.translate(position).scale(2).subtract(Solid.cylinder(0.2, 10));
  position[0] = 50;
  const recipe = JSON.parse(JSON.stringify(moved));
  expect(base.toJSON()).toEqual({ kind: 'box', size: [2, 3, 4], radius: 0.2 });
  expect(recipe.a.child.position).toEqual([1, 2, 3]);
  expect(recipe.a.scale).toEqual([2, 2, 2]);
  expect(recipe.b.kind).toBe('cylinder');
  expect(Solid.sphere().paint([1, 0.5, 0, 0.2]).toJSON()).toMatchObject({
    color: [1, 0.5, 0]
  });
});

test('many solids use a balanced recipe and native-only tools explain the rebuild requirement', () => {
  const recipe = Solid.union(...Array.from({ length: 64 }, (_, i) => Solid.sphere().translate([i, 0, 0])));
  const depth = (value: unknown): number => {
    if (!value || typeof value !== 'object') return 0;
    const node = value as { a?: unknown; b?: unknown; child?: unknown };
    return 1 + Math.max(0, ...[node.a, node.b, node.child].filter(Boolean).map(depth));
  };
  expect(depth(recipe.toJSON())).toBeLessThan(10);
  expect(() => Solid.union()).toThrow('at least one');
  expect(() => solidGeometry(recipe)).toThrow('rebuild');
  expect(() =>
    optimizeGeometry({
      vertices: new Float32Array(),
      indices: new Uint32Array()
    })
  ).toThrow('rebuild');
  expect(() => createGeometryLods({ vertices: new Float32Array(), indices: new Uint32Array() }, [0.5, 1])).toThrow('decrease');
});

test('parametric surfaces orient triangles and normals consistently', () => {
  const geometry = parametricSurface((u, v) => [u * 2, v * 3, 0], {
    uSegments: 3,
    vSegments: 2
  });
  expect(getGeometryStats(geometry)).toMatchObject({
    vertices: 12,
    triangles: 12,
    bounds: { min: [0, 0, 0], max: [2, 3, 0] }
  });
  for (let i = 0; i < geometry.vertices.length; i += 11) expect(geometry.vertices[i + 5]).toBeCloseTo(1, 6);
  const changed = deformGeometry(geometry, ([x, y]) => [x, y, x * 0.5]);
  expect(getGeometryStats(geometry).bounds!.size[2]).toBe(0);
  expect(getGeometryStats(changed).bounds!.size[2]).toBe(1);
  expect(changed.vertices[3]).toBeCloseTo(-1 / Math.sqrt(5), 6);
  expect(() => parametricSurface(() => [NaN, 0, 0])).toThrow('non-finite');
});

test('lofts have welded smooth seams, flat caps and usable UVs', () => {
  const g = loft(
    [
      { z: -1, bottom: -0.5, top: 0.5, width: 0.5, square: 2 },
      { z: 1, bottom: -0.5, top: 0.5, width: 0.5, square: 2 }
    ],
    { around: 16, smoothness: 1 }
  );
  expect(g.vertices.every(Number.isFinite)).toBe(true);
  for (const row of [0, 1]) for (let k = 0; k < 6; k++) expect(g.vertices[row * 17 * 11 + k]).toBeCloseTo(g.vertices[(row * 17 + 16) * 11 + k]!, 5);
  const firstCap = 2 * 17 * 11,
    secondCap = firstCap + 17 * 11;
  expect(g.vertices[firstCap + 5]).toBe(-1);
  expect(g.vertices[secondCap + 5]).toBe(1);
  expect(g.vertices[9]).toBe(0);
  expect(g.vertices[16 * 11 + 9]).toBe(1);
  expect(() => loft([])).toThrow('cross sections');
});

test('ellipsoids retain exact dimensions and smooth curves reject unordered knots', () => {
  const stats = getGeometryStats(ellipsoid([2, 3, 4]));
  expect(stats.bounds!.size).toEqual([4, 6, 8]);
  const curve = smoothCurve([
    [0, 2],
    [1, 3],
    [2, 1]
  ]);
  expect(curve(-1)).toBe(2);
  expect(curve(1)).toBe(3);
  expect(curve(3)).toBe(1);
  expect(() =>
    smoothCurve([
      [1, 0],
      [1, 1]
    ])
  ).toThrow('increasing');
});
