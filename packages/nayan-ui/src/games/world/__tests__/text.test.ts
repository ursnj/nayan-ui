import { describe, expect, mock, test } from 'bun:test';
import type { Font } from '../../assets/font';
import { TransformBatch } from '../TransformBatch';

let next = 0;
const entities = new Map<number, Float64Array>();
const native = {
  createWorld: () => 1,
  getMatrices: () => new ArrayBuffer(4096),
  getColors: () => new ArrayBuffer(4096),
  getRegions: () => new ArrayBuffer(4096),
  getRanges: () => new ArrayBuffer(4096),
  getEvents: () => new ArrayBuffer(4096),
  getDone: () => new ArrayBuffer(4096),
  getScratch: () => new ArrayBuffer(4096),
  spawnDesc: mock((_world: number, buffer: ArrayBuffer) => {
    const id = ++next;
    entities.set(id, new Float64Array(buffer).slice());
    return id;
  }),
  setDesc: (_world: number, id: number, buffer: ArrayBuffer) => {
    if (!entities.has(id)) return false;
    entities.set(id, new Float64Array(buffer).slice());
    return true;
  },
  despawn: mock((_world: number, id: number) => entities.delete(id))
};
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  Image: { resolveAssetSource: () => null }
}));
const { World } = await import('../World');
const font: Font = {
  id: 1,
  capHeight: 0.7,
  glyphs: new Map([...'0123456789?'].map((ch, i) => [ch, { mesh: 20 + i, advance: 0.6 }]))
};

describe('changing text reuses glyph entities', () => {
  test('scores and timers update meshes without despawning their letters', () => {
    const world = new World(64);
    const root = world.spawn({ text: '123', font });
    const ids = [...entities.keys()];
    const spawns = native.spawnDesc.mock.calls.length;
    const despawns = native.despawn.mock.calls.length;
    world.set(root, { text: '124' });
    expect([...entities.keys()]).toEqual(ids);
    expect(native.spawnDesc.mock.calls.length).toBe(spawns);
    expect(native.despawn.mock.calls.length).toBe(despawns);
    // Mesh slot in the descriptor: the third glyph now draws 4 instead of 3.
    expect(entities.get(ids[3]!)![1]).toBe(24);
    world.set(root, { text: '12' });
    expect(native.despawn.mock.calls.length).toBe(despawns + 1);
    world.set(root, { text: '1234' });
    expect(native.spawnDesc.mock.calls.length).toBe(spawns + 2);
    world.set(root, { text: '' });
    expect(entities.has(root)).toBe(true);
  });
});

test('transform batches fall back to ordered setters on an older native build', () => {
  const world = new World(64);
  const a = world.spawn({ mesh: 'cube' });
  const b = world.spawn({ mesh: 'sphere' });
  const batch = world.createTransformBatch();
  batch.position(a, 7, 8, 9);
  batch.set(b, { scale: [2, 3, 4], color: [0.1, 0.2, 0.3] });
  expect(batch.flush()).toBe(2);
  expect([...entities.get(a)!.slice(2, 5)]).toEqual([7, 8, 9]);
  expect([...entities.get(b)!.slice(9, 16)]).toEqual([2, 3, 4, 0.1, 0.2, 0.3, 1]);
});

test('transform batch copies inputs, grows without dropping records, and reuses storage', () => {
  const calls: { data: Float64Array; count: number; copy: number[] }[] = [];
  const batch = new TransformBatch((data, count) => {
    calls.push({ data, count, copy: [...data.slice(0, count * 16)] });
    return count;
  });
  const position: [number, number, number] = [1, 2, 3];
  batch.set(1 as never, { position, scale: 0, color: [0.1, 0.2, 0.3] });
  position[0] = 999;
  for (let i = 2; i < 200; i++) batch.position(i as never, i, i + 1, i + 2);
  expect(batch.flush()).toBe(199);
  expect(calls[0]!.copy.slice(0, 5)).toEqual([1, 26, 1, 2, 3]);
  expect(calls[0]!.copy.slice(9, 16)).toEqual([0, 0, 0, 0.1, 0.2, 0.3, 1]);
  expect(calls[0]!.copy.slice(-16, -11)).toEqual([199, 2, 199, 200, 201]);
  expect(batch.flush()).toBe(0);
  batch.set(1 as never, { rotation: [0, 0, 0, 1] });
  batch.flush();
  expect(calls[1]!.data).toBe(calls[0]!.data);
  expect(calls[1]!.count).toBe(1);
  batch.position(1 as never, 1, 2, 3);
  batch.clear();
  expect(batch.flush()).toBe(0);
});

test('a failed batch commit cannot leak stale updates into the next frame', () => {
  let fail = true;
  const batch = new TransformBatch((_data, count) => {
    if (fail) throw new Error('native failure');
    return count;
  });
  batch.position(1 as never, 1, 2, 3);
  expect(() => batch.flush()).toThrow('native failure');
  fail = false;
  expect(batch.flush()).toBe(0);
  batch.position(1 as never, 4, 5, 6);
  expect(batch.flush()).toBe(1);
});

describe('native skeletal playback', () => {
  test('forwards clip playback defaults, seeks and stopping without JS animation timers', () => {
    Object.assign(native, {
      playClip: mock(() => true),
      stopClip: mock(() => true)
    });
    const world = new World(8);
    const entity = world.spawn({ mesh: 'cube' });
    const methods = native as typeof native & {
      playClip: ReturnType<typeof mock>;
      stopClip: ReturnType<typeof mock>;
    };
    expect(world.nativeWorld).toBe(1);
    expect(world.playClip(entity, 'Walk')).toBe(true);
    expect(methods.playClip.mock.calls[0]).toEqual([world.nativeWorld, entity, 'Walk', true, 1, 0.15, -1]);
    world.playClip(entity, 'Idle', { speed: 0, time: 0, fade: 0 });
    expect(methods.playClip.mock.calls[1]).toEqual([world.nativeWorld, entity, 'Idle', true, 0, 0, 0]);
    expect(world.stopClip(entity, true)).toBe(true);
    expect(methods.stopClip.mock.calls[0]).toEqual([world.nativeWorld, entity, true]);
  });

  test('samples typed-array slices without changing unrelated output values', () => {
    Object.assign(native, {
      skinPoints: mock((_world: number, _entity: number, _vertices: ArrayBuffer, output: ArrayBuffer) => {
        new Float32Array(output).set([1, 2, 3]);
        return true;
      })
    });
    const world = new World(8),
      entity = world.spawn({ mesh: 'cube' });
    const input = new Uint32Array([99, 7, 99]),
      output = new Float32Array([99, 0, 0, 0, 99]);
    expect(world.sampleSkinnedVertices(entity, input.subarray(1, 2), output.subarray(1, 4), 0.02)).toBe(true);
    expect([...output]).toEqual([99, 1, 2, 3, 99]);
  });
});
