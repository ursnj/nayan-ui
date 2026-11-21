import { expect, mock, test } from 'bun:test';
import { createBrowserEngine, type WasmCore } from '../BrowserEngine';
import { createTestCore } from './core';

const engine = await createTestCore();

test('bridge rejects unsupported buffers, invalid capacities and unknown or disposed worlds', () => {
  for (const value of [0, -1, 0.5, NaN, Infinity, 1_000_001]) expect(() => engine.createWorld(value)).toThrow('capacity');
  const world = engine.createWorld(1);
  try {
    expect(() => engine.spawnDesc(world, new Float64Array(1) as never)).toThrow('ArrayBuffer');
    expect(() => engine.spawnDesc(world, new SharedArrayBuffer(8))).toThrow('ArrayBuffer');
    expect(() => engine.count(999)).toThrow('unknown or disposed');
  } finally {
    engine.destroyWorld(world);
  }
  expect(() => engine.count(world)).toThrow('unknown or disposed');
  const incomplete = createBrowserEngine({
    memory: new WebAssembly.Memory({ initial: 1 })
  });
  expect(() => incomplete.generateBuiltinMeshes()).toThrow('missing engine_generate_builtin_meshes');
});

test('geometry boundary checks reject invalid contours and outputs without corrupting later operations', () => {
  for (const counts of [[-1], [0.5], [NaN], [2]])
    expect(() => engine.pathExtrude(new Float32Array(2).buffer, counts, 0.1, true)).toThrow('contour counts');
  const vertices = engine.renderMeshVertices(0),
    indices = engine.renderMeshIndices(0);
  const placement = [1, 2, 3, 0, 0, 0, 1, 2, 3, 4, 1, 1, 1];
  for (const [p, vo, io] of [
    [placement.slice(1), 0, 0],
    [placement, -1, 0],
    [placement, 0, -1],
    [placement, 1, 0],
    [placement, 0, 1]
  ] as const) {
    expect(() =>
      engine.geometryPlace(vertices, indices, [...p], 0, new ArrayBuffer(vertices.byteLength), vo, new ArrayBuffer(indices.byteLength), io)
    ).toThrow('output bounds');
  }
  expect(() => engine.geometrySolid('invalid JSON')).toThrow();
  expect(() => engine.geometryOptimize(new Float32Array([NaN]).buffer, new Uint32Array([0, 0, 0]).buffer, 1, 0.01, true)).toThrow();
  const result = engine.geometrySolid('{"solid":{"kind":"sphere","radius":1},"resolution":12}');
  expect(result.vertices.byteLength).toBeGreaterThan(0);
  expect(engine.modelSize(4095)).toEqual([0, 0, 0]);
  expect(engine.textureSize(0xffffffff)).toEqual([0, 0]);
});

test('render ABI preserves packed buffers, bounds capacity and copies projection after memory growth', () => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  let offset = 64;
  const allocate = (size: number) => {
    const pointer = offset;
    offset += Math.ceil(size / 16) * 16;
    while (offset > memory.buffer.byteLength) memory.grow(1);
    return pointer;
  };
  const frames: number[][] = [],
    overlays: number[][] = [];
  const core: WasmCore = {
    memory,
    engine_web_alloc: allocate,
    engine_web_free: mock(() => {}),
    engine_render_frame: (...args: number[]) => {
      frames.push(args);
      expect([...new Float64Array(memory.buffer, args[1], args[2])]).toEqual(Array.from({ length: 24 }, (_, i) => i));
      expect([...new Float32Array(memory.buffer, args[3], 16)].every((value) => value === 2)).toBe(true);
      memory.grow(1);
      new Float32Array(memory.buffer, args[10], 16).set(Array.from({ length: 16 }, (_, i) => i * 0.5));
      return 1;
    },
    engine_render_overlay: (...args: number[]) => overlays.push(args)
  };
  const renderer = createBrowserEngine(core);
  const frame = Float64Array.from({ length: 24 }, (_, i) => i).buffer;
  const matrices = new Float32Array(3 * 16).fill(2).buffer,
    colors = new Float32Array(2 * 4).buffer;
  const regions = new Float32Array(4 * 4).buffer,
    ranges = new Uint32Array([0, 1, 0, 0]).buffer;
  const projection = new Float32Array(16);
  expect(renderer.renderFrame(7, frame, matrices, colors, regions, ranges, 1, projection.buffer, -1)).toBe(1);
  expect(frames[0]![0]).toBe(7);
  expect(frames[0]![2]).toBe(24);
  expect(frames[0]![6]).toBe(2);
  expect(frames[0]!.slice(8, 10)).toEqual([4, 1]);
  expect(frames[0]![11]).toBe(0);
  expect([...projection]).toEqual(Array.from({ length: 16 }, (_, i) => i * 0.5));
  renderer.renderOverlay(7, matrices, colors, regions, ranges, 1, 200, 100);
  expect(overlays[0]![0]).toBe(7);
  expect(overlays[0]![4]).toBe(2);
  expect(overlays[0]!.slice(6)).toEqual([4, 1, 200, 100]);
});

test('UUIDs from the real Rust core have the v4 format and are distinct', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const id = engine.uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    ids.add(id);
  }
  expect(ids.size).toBe(1000);
});

test('UUID bridge refreshes views after core memory growth and reports failure', () => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const text = '6bbaef18-09ed-48cf-a761-98e1f91a06bf';
  const core: WasmCore = {
    memory,
    engine_web_alloc: () => 64,
    engine_uuid: (pointer: number, length: number) => {
      expect(length).toBe(36);
      memory.grow(1);
      new Uint8Array(memory.buffer, pointer, length).set(new TextEncoder().encode(text));
      return 1;
    }
  };
  const bridge = createBrowserEngine(core);
  expect(bridge.uuid()).toBe(text);
  expect(bridge.uuid()).toBe(text);
  const failed = createBrowserEngine({ ...core, engine_uuid: () => 0 });
  expect(() => failed.uuid()).toThrow('UUID generation failed');
});
