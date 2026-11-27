import { afterAll, expect, mock, spyOn, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { createTestCore } from '../../../native/__tests__/core';
import type { Geometry } from '../shape';

const native = await createTestCore();
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  Image: { resolveAssetSource: () => null }
}));
const payloads = new Map<string, Uint8Array>([
  ['model.glb', new Uint8Array(await readFile(new URL('../../../../native/tests/fixtures/animated-triangle.glb', import.meta.url)))],
  ['image.png', new Uint8Array(await readFile(new URL('./share.png', import.meta.url)))],
  ['font.ttf', new Uint8Array(await readFile(new URL('../../../../native/core/tests/fixtures/Inter-Bold.ttf', import.meta.url)))]
]);
const previousFetch = globalThis.fetch;
globalThis.fetch = mock(async (input: string | URL | Request) => {
  const bytes = payloads.get(String(input));
  return bytes ? new Response(Uint8Array.from(bytes)) : new Response('missing', { status: 404 });
}) as unknown as typeof fetch;
afterAll(() => {
  globalThis.fetch = previousFetch;
});
const { loadModel, registerModelMesh } = await import('../model');
const { loadTexture, texturedMesh, textureImage } = await import('../texture');
const { loadFont, measureText } = await import('../font');
const { meshInfo } = await import('../../render/meshes');
const { World } = await import('../../world/World');
const { Path, shapeGeometry, createShape, extrude, lathe, merge, recolor } = await import('../shape');
const { Solid, solidGeometry, createSolid, optimizeGeometry, createGeometryLods, getGeometryStats } = await import('../modelling');
const { loft, block, ellipsoid } = await import('../loft');
const { parametricSurface } = await import('../surface');
function valid(geometry: Geometry) {
  const count = geometry.vertices.length / 11;
  expect(count).toBeGreaterThan(0);
  expect(Number.isInteger(count)).toBe(true);
  expect(geometry.vertices.every(Number.isFinite)).toBe(true);
  expect(geometry.indices.length % 3).toBe(0);
  expect(geometry.indices.every((index) => index < count)).toBe(true);
}

test('model decoding retains rigs, scaling and independent material variants', async () => {
  const calls = spyOn(native, 'modelLoad');
  try {
    const first = loadModel('model.glb', { fit: 2, center: false, shine: 0.1 });
    expect(loadModel('model.glb', { fit: 2, center: false, shine: 0.1 })).toBe(first);
    const model = await first;
    expect(calls).toHaveBeenCalledTimes(1);
    expect(Math.max(...model.size)).toBeCloseTo(2, 5);
    expect(model.jointCount).toBeGreaterThan(0);
    expect(model.animations.length).toBeGreaterThan(0);
    const larger = await loadModel('model.glb', { fit: 3 });
    expect(Math.max(...larger.size)).toBeCloseTo(3, 5);
    expect(meshInfo(model.id)!.shine).toBe(0.1);
    const alias = registerModelMesh(model.id, 0.9);
    expect(alias).not.toBe(model.id);
    expect(registerModelMesh(model.id, 0.9)).toBe(alias);
    expect(registerModelMesh(model.id, 0.1)).toBe(model.id);
    expect(meshInfo(alias)!.geometry).toBe(meshInfo(model.id)!.geometry);
    expect(meshInfo(model.id)!.shine).toBe(0.1);
  } finally {
    calls.mockRestore();
  }
});

test('rig sampling writes only the requested subarray and invalid samples leave it unchanged', async () => {
  const model = await loadModel('model.glb', { fit: 2 });
  const world = new World(2);
  try {
    const entity = world.spawn({ mesh: model });
    expect(world.playClip(entity, 'missing')).toBe(false);
    expect(
      world.playClip(entity, model.animations[0]!.name, {
        loop: false,
        speed: 0,
        fade: 0,
        time: 0
      })
    ).toBe(true);
    const indices = new Uint32Array([999, 0, 1, 2, 999]).subarray(1, 4);
    const storage = new Float32Array(11).fill(123);
    const points = storage.subarray(1, 10);
    expect(world.sampleSkinnedVertices(entity, indices, points)).toBe(true);
    expect(points.every(Number.isFinite)).toBe(true);
    expect(storage[0]).toBe(123);
    expect(storage[10]).toBe(123);
    const snapshot = points.slice();
    expect(world.sampleSkinnedVertices(entity, new Uint32Array([0xffffffff]), points)).toBe(false);
    expect(points).toEqual(snapshot);
    expect(() => world.sampleSkinnedVertices(entity, indices, new Float32Array(2))).toThrow('three floats');
    expect(world.stopClip(entity)).toBe(true);
    expect(world.playClip(entity, model.animations[0]!.name)).toBe(true);
    world.update(1 / 60);
  } finally {
    world.dispose();
  }
});

test('texture decoding, pixel views and material aliases preserve shared geometry', async () => {
  const texture = await loadTexture('image.png');
  expect(await loadTexture('image.png')).toBe(texture);
  expect(texture.width).toBeGreaterThan(0);
  const image = textureImage(texture.id);
  expect(image.pixels).toHaveLength(image.width * image.height * 4);
  const alias = texturedMesh(0, texture);
  expect(texturedMesh(0, texture)).toBe(alias);
  expect(meshInfo(alias)!.geometry).toBe(meshInfo(0)!.geometry);
  expect(meshInfo(alias)!.texture).toBe(texture.id);
  expect(() => texturedMesh(4095, texture)).toThrow('nothing to draw');
});

test('font prewarm subsets share one font and missing glyphs extend without redownloading', async () => {
  const first = await loadFont('font.ttf', { depth: 0, chars: '12' });
  const extended = await loadFont('font.ttf', { depth: 0, chars: 'ABC' });
  expect(extended).toBe(first);
  expect(first.glyphs.has('A')).toBe(true);
  expect(measureText(first, 'é€', { tabular: true })).toBeGreaterThan(0);
  expect(await loadFont('font.ttf', { depth: 0.1, chars: 'A' })).not.toBe(first);
});

test('failed source and decoder requests reject with context and can recover at the same URI', async () => {
  await expect(loadModel('missing.glb')).rejects.toThrow('404');
  payloads.set('bad.glb', new Uint8Array([1, 2, 3]));
  await expect(loadModel('bad.glb')).rejects.toThrow('loadModel');
  payloads.set('bad.glb', payloads.get('model.glb')!);
  expect((await loadModel('bad.glb')).jointCount).toBeGreaterThan(0);
});

test('built-in geometry is copied before painting, and transformed parts keep their exact bounds', () => {
  const original = shapeGeometry('cube');
  const red = shapeGeometry('cube', { color: [1, 0, 0] });
  expect(shapeGeometry('cube').vertices).toEqual(original.vertices);
  expect(red.vertices[7]).toBe(0);
  const combined = merge([
    {
      geometry: red,
      scale: [-2, 3, 4],
      position: [5, 0, 0],
      color: [0.5, 1, 1]
    }
  ]);
  valid(combined);
  expect(getGeometryStats(combined).bounds!.size).toEqual([2, 3, 4]);
  expect(getGeometryStats(combined).bounds!.min[0]).toBe(4);
  recolor(combined, ({ u, v }) => [u, v, 0.5]);
  expect(combined.vertices[8]).toBe(0.5);
  const model = createShape(combined, { center: false, optimize: true });
  // Uncentered meshes need a collider around their origin, including the translated vertices.
  expect(model.size).toEqual([12, 3, 4]);
  expect(createShape(combined).size).toEqual([2, 3, 4]);
});

test.each([0, 0.2])('extrusion handles holes and depth %s through the native tessellator', (depth) => {
  const shape = new Path().addRect(0, 0, 2, 3).addRect(0.5, 0.5, 1, 1);
  const geometry = extrude(shape, {
    depth,
    fillRule: 'evenodd',
    color: [0.2, 0.3, 0.4]
  });
  valid(geometry);
  const size = getGeometryStats(geometry).bounds!.size;
  expect(size[0]).toBeCloseTo(2);
  expect(size[1]).toBeCloseTo(3);
  expect(size[2]).toBeCloseTo(depth);
  expect(() => extrude(new Path())).toThrow('no area');
});

test('partial lathes tessellate both monotonic and indented cut faces with authored colors', () => {
  for (const profile of [
    [
      [0.2, 1],
      [0.5, 0],
      [0.2, -1]
    ],
    [
      [0.2, 1],
      [0.4, 0],
      [0.3, 0.5],
      [0.2, -1]
    ]
  ] as const) {
    const geometry = lathe(profile, {
      segments: 8,
      sweep: Math.PI,
      capRings: 2,
      color: ({ u, v }) => [u, v, 0.2],
      capColor: (radius, angle) => [radius, Math.abs(Math.sin(angle)), 0.3],
      cutColor: (radius, height) => [radius, Math.abs(height), 0.4],
      cutSteps: 3
    });
    valid(geometry);
    expect(getGeometryStats(geometry).bounds!.size[1]).toBeCloseTo(2);
  }
  valid(
    lathe(new Path().moveTo(0.1, -1).lineTo(0.4, 0).lineTo(0.1, 1), {
      color: [1, 0, 0]
    })
  );
});

test('all solid primitives and CSG operations produce finite native geometry', () => {
  const solids = [
    Solid.sphere(0.4),
    Solid.ellipsoid([0.4, 0.3, 0.2]),
    Solid.box([1, 1, 1], 0.1),
    Solid.capsule([0, -0.3, 0], [0, 0.3, 0], 0.2),
    Solid.cylinder(0.4, 0.6),
    Solid.torus(0.4, 0.1)
  ];
  for (const solid of solids) valid(solidGeometry(solid, { resolution: 12 }));
  const cut = Solid.box([1, 1, 1]).subtract(Solid.cylinder(0.2, 2)).intersect(Solid.sphere(0.7));
  const colored = cut
    .blend(Solid.sphere(0.2).translate([0.4, 0, 0]), 0.1)
    .rotate([0, 0, 0, 1])
    .scale([1, 1.2, 1])
    .shell(0.1)
    .paint([0.4, 0.5, 0.6])
    .displace({ amplitude: 0.01, seed: 42, frequency: 2, octaves: 2 });
  valid(solidGeometry(colored, { resolution: 16, uv: 'xz' }));
  const mesh = createSolid(Solid.sphere(0.4), { resolution: 12 });
  expect(createSolid(Solid.sphere(0.4), { resolution: 12 })).toBe(mesh);
});

test('optimization and LODs preserve inputs, accept subarrays and respect independent level requests', () => {
  const geometry = shapeGeometry('sphere');
  const original = geometry.vertices.slice();
  const vertices = new Float32Array(geometry.vertices.length + 4);
  vertices.set(geometry.vertices, 2);
  const indices = new Uint32Array(geometry.indices.length + 4);
  indices.set(geometry.indices, 2);
  const optimized = optimizeGeometry({ vertices: vertices.subarray(2, -2), indices: indices.subarray(2, -2) }, { ratio: 0.5, error: 0.05 });
  valid(optimized);
  expect(geometry.vertices).toEqual(original);
  const levels = createGeometryLods(geometry, [1, 0.5, 0.25], { error: 0.1 });
  expect(levels).toHaveLength(3);
  expect(levels[1]!.indices.length).toBeLessThanOrEqual(levels[0]!.indices.length);
  expect(levels[2]!.indices.length).toBeLessThanOrEqual(levels[1]!.indices.length);
  for (const ratios of [[], [0], [1, 1], [1.1], [NaN], [Infinity]]) expect(() => createGeometryLods(geometry, ratios)).toThrow('ratios');
  expect(
    getGeometryStats({
      vertices: new Float32Array(),
      indices: new Uint32Array()
    }).bounds
  ).toBeNull();
});

test('loft direction, authored colors and block dimensions survive native normal processing', () => {
  const sections = [
    { z: -1, bottom: -1, top: 1, width: 1 },
    { z: 1, bottom: -0.5, top: 0.5, width: 0.5 }
  ];
  const forward = loft(sections),
    reversed = loft([...sections].reverse());
  expect(reversed).toEqual(forward);
  const color = loft(sections, { color: [0.2, 0.4, 0.6] });
  expect(color.vertices[6]).toBeCloseTo(0.2);
  expect(color.vertices[8]).toBeCloseTo(0.6);
  const painted = loft(sections, {
    color: (position, normal) => [Math.abs(position[0]), Math.abs(normal[1]), 0.3]
  });
  valid(painted);
  expect(painted.vertices[8]).toBeCloseTo(0.3);
  expect(getGeometryStats(block(2, 3, 4)).bounds!.size).toEqual([2, 3, 4]);
  expect(() => ellipsoid([0, 1, 1])).toThrow('positive');
  expect(() => loft([sections[0]!, sections[0]!])).toThrow('ordered');
  for (const options of [{ around: 5 }, { around: 513 }, { around: 6.5 }, { smoothness: 0 }, { smoothness: 65 }])
    expect(() => loft(sections, options)).toThrow('around/smoothness');
});

test('parametric surfaces apply static and sampled colors and reject allocation overflow', () => {
  const plane = parametricSurface((u, v) => [u, v, 0], {
    uSegments: 2,
    vSegments: 2,
    color: [0.2, 0.3, 0.4]
  });
  valid(plane);
  expect(plane.vertices[6]).toBeCloseTo(0.2);
  const colored = parametricSurface((u, v) => [u, v, 0], {
    uSegments: 2,
    vSegments: 2,
    color: ({ u, v }) => [u, v, 0.5]
  });
  expect(colored.vertices.slice(-5, -2)).toEqual(new Float32Array([1, 1, 0.5]));
  for (const options of [{ uSegments: 0 }, { vSegments: 1.5 }, { uSegments: 1025 }, { uSegments: 1024, vSegments: 1024 }])
    expect(() => parametricSurface(() => [0, 0, 0], options)).toThrow('segments');
});
