import { expect, mock, test } from 'bun:test';
import { createBrowserEngine, type WasmCore } from '../BrowserEngine';

const CAPACITY = 8;
const RANGES_BYTES = 4096 * 16;

/** A fake core: one world laid out in linear memory, whose update grows memory like a real allocation would. */
function fakeCore() {
  const memory = new WebAssembly.Memory({ initial: 2 });
  let offset = 64;
  const allocate = mock((size: number) => {
    const pointer = offset;
    offset += Math.ceil(size / 16) * 16;
    while (offset > memory.buffer.byteLength) memory.grow(1);
    return pointer;
  });
  const layout = { matrices: 0, colors: 0, regions: 0, ranges: 0, scoreboard: 0, scratch: 0 };
  let count = 0;
  let updateLookups = 0;
  const frames: number[][] = [];
  const transforms: { len: number; count: number; values: number[] }[] = [];
  const core: WasmCore = {
    memory,
    engine_web_alloc: allocate,
    engine_web_free: () => {},
    engine_world_new: (capacity: number) => {
      layout.matrices = allocate(capacity * 64);
      layout.colors = allocate(capacity * 16);
      layout.regions = allocate(capacity * 16);
      layout.ranges = allocate(RANGES_BYTES);
      layout.scoreboard = allocate(64);
      layout.scratch = allocate(64);
      return allocate(16);
    },
    engine_world_free: () => {},
    engine_world_count: () => count,
    engine_world_matrices: () => layout.matrices,
    engine_world_colors: () => layout.colors,
    engine_world_regions: () => layout.regions,
    engine_world_ranges: () => layout.ranges,
    engine_world_scoreboard_state: () => layout.scoreboard,
    engine_world_scratch: () => layout.scratch,
    engine_world_set_transforms: (_world: number, pointer: number, len: number, n: number) => {
      transforms.push({ len, count: n, values: [...new Float64Array(memory.buffer, pointer, len)] });
      return n;
    },
    engine_render_frame: (...args: number[]) => {
      frames.push(args);
      return 1;
    },
    engine_render_overlay: () => {}
  };
  // Counts export lookups: a bridge resolving per call would read this every update.
  Object.defineProperty(core, 'engine_world_update', {
    get() {
      updateLookups++;
      return (_world: number, step: number) => {
        memory.grow(1); // detaches every view the bridge held
        new Float32Array(memory.buffer, layout.matrices, count * 16).fill(step);
        new Uint32Array(memory.buffer, layout.ranges, 2).set([0, count]);
        new Float64Array(memory.buffer, layout.scoreboard, 8)[0] = step * 10;
      };
    }
  });
  return {
    core,
    layout,
    allocate,
    frames,
    transforms,
    setCount: (n: number) => (count = n),
    lookups: () => updateLookups
  };
}

test('updates resolve exports once, re-create views after memory growth and copy only live instances', () => {
  const fake = fakeCore();
  const engine = createBrowserEngine(fake.core);
  const world = engine.createWorld(CAPACITY);
  const matrices = new Float32Array(engine.getMatrices(world));
  const ranges = new Uint32Array(engine.getRanges(world));
  const score = new Float64Array(engine.getScoreboard(world));
  matrices.fill(-1);
  fake.setCount(3);
  engine.update(world, 2);
  expect([...matrices.subarray(0, 48)].every((v) => v === 2)).toBe(true);
  // Instances past `count` are not valid output: their mirror rows are left alone.
  expect([...matrices.subarray(48)].every((v) => v === -1)).toBe(true);
  expect([...ranges.subarray(0, 2)]).toEqual([0, 3]);
  expect(score[0]).toBe(20);
  engine.update(world, 4);
  engine.update(world, 5);
  expect(matrices[0]).toBe(5);
  expect(score[0]).toBe(50);
  expect(fake.lookups()).toBe(1);
});

test('the scoreboard flags written by JS reach the core after memory growth', () => {
  const fake = fakeCore();
  const engine = createBrowserEngine(fake.core);
  const world = engine.createWorld(CAPACITY);
  const score = new Float64Array(engine.getScoreboard(world));
  engine.update(world, 1);
  score[4] = 7;
  engine.update(world, 1);
  expect(new Float64Array(fake.core.memory.buffer, fake.layout.scoreboard, 8)[4]).toBe(7);
});

test("render calls read a live world's own buffers in place and copy anything else", () => {
  const fake = fakeCore();
  const engine = createBrowserEngine(fake.core);
  const world = engine.createWorld(CAPACITY);
  const matrices = engine.getMatrices(world),
    colors = engine.getColors(world),
    regions = engine.getRegions(world),
    ranges = engine.getRanges(world);
  const frame = new Float64Array(26).buffer,
    projection = new Float32Array(16).buffer;
  engine.renderFrame(1, frame, matrices, colors, regions, ranges, 1, projection, world);
  const { layout } = fake;
  expect(fake.frames[0]!.slice(3, 8)).toEqual([layout.matrices, layout.colors, layout.regions, CAPACITY, layout.ranges]);
  expect(fake.frames[0]![8]).toBe(RANGES_BYTES / 4);
  // The second frame reuses the frame and projection scratch: nothing new is allocated.
  const allocations = fake.allocate.mock.calls.length;
  engine.renderFrame(1, frame, matrices, colors, regions, ranges, 1, projection, world);
  expect(fake.allocate.mock.calls.length).toBe(allocations);
  // A disposed world's mirrors are ordinary buffers again: copied, never read from freed memory.
  engine.destroyWorld(world);
  engine.renderFrame(1, frame, matrices, colors, regions, ranges, 1, projection, -1);
  expect(fake.frames[2]![3]).not.toBe(layout.matrices);
  expect(fake.frames[2]![7]).not.toBe(layout.ranges);
});

test('setTransforms copies only the queued records of a grown batch', () => {
  const fake = fakeCore();
  const engine = createBrowserEngine(fake.core);
  const world = engine.createWorld(CAPACITY);
  const batch = new Float64Array(16 * 32);
  batch.set(Array.from({ length: 32 }, (_, i) => i + 1));
  expect(engine.setTransforms(world, batch.buffer, 2)).toBe(2);
  expect(fake.transforms[0]!.len).toBe(32);
  expect(fake.transforms[0]!.count).toBe(2);
  expect(fake.transforms[0]!.values).toEqual([...batch.subarray(0, 32)]);
});
