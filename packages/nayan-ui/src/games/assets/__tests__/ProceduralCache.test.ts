import { expect, mock, test } from 'bun:test';

let nextId = 100;
const nativeModels = new Map<number, { vertices: Float32Array; indices: Uint32Array }>();
const native = {
  meshCreate(vertices: ArrayBuffer, indices: ArrayBuffer) {
    // As the core does (assets/shape.rs): out-of-range indices and non-finite vertices are refused.
    const count = vertices.byteLength / 44;
    if (new Uint32Array(indices).some((i) => i >= count) || new Float32Array(vertices).some((v) => !Number.isFinite(v))) return -1;
    const id = nextId++;
    nativeModels.set(id, {
      vertices: new Float32Array(vertices.slice(0)),
      indices: new Uint32Array(indices.slice(0))
    });
    return id;
  },
  modelVertices: (id: number) => nativeModels.get(id)!.vertices.buffer,
  modelIndices: (id: number) => nativeModels.get(id)!.indices.buffer,
  modelSize(id: number) {
    const v = nativeModels.get(id)!.vertices;
    return [0, 1, 2].map((axis) => {
      const values = Array.from({ length: v.length / 11 }, (_, i) => v[i * 11 + axis]!);
      return Math.max(...values) - Math.min(...values);
    });
  },
  renderMesh() {}
};
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  TurboModuleRegistry: { get: () => native },
  Image: { resolveAssetSource: () => null }
}));
const { meshInfo, registerMesh } = await import('../../render/meshes');
const { ProceduralCache } = await import('../ProceduralCache');
const vertices = new Float32Array([0, 0, 0, 0, 0, 1, 1, 0.25, 0.5, 0, 0, 2, 0, 0, 0, 0, 1, 0.5, 1, 0.25, 1, 0, 0, 2, 0, 0, 0, 1, 0.25, 0.5, 1, 0, 1]);
const buildModel = () => {
  const indices = new Uint32Array([0, 1, 2]);
  const id = native.meshCreate(vertices.buffer, indices.buffer);
  registerMesh(id, { geometry: { vertices, indices }, shine: 0.73 });
  return { id, size: native.modelSize(id) as [number, number, number] };
};
function storage() {
  const files = new Map<string, Uint8Array>();
  return {
    files,
    read: (key: string) => files.get(key)?.slice() ?? null,
    write(key: string, bytes: Uint8Array) {
      files.set(key, bytes.slice());
    }
  };
}

test('a new runtime restores registered geometry, colours, UVs, material and nested model references without building', async () => {
  const disk = storage();
  let builds = 0;
  const first = new ProceduralCache('revision-a', disk);
  const original = first.get('penguin:left', () => {
    builds++;
    const model = buildModel();
    return {
      body: model,
      pieces: [model, model],
      center: [0, 1.5, 0],
      name: '企鹅',
      optional: undefined
    };
  });
  await first.flush();
  const shape = meshInfo(original.body.id)!;
  const second = new ProceduralCache('revision-a', disk);
  const restored = second.get<typeof original>('penguin:left', () => {
    throw Error('tessellation must not run');
  });
  expect(builds).toBe(1);
  expect(restored.body.id).not.toBe(original.body.id);
  expect(restored.body.size).toEqual(original.body.size);
  expect(meshInfo(restored.body.id)).toEqual(shape);
  expect(restored.pieces[0]).toBe(restored.body);
  expect(restored.pieces[1]).toBe(restored.body);
  expect(restored.center).toEqual(original.center);
  expect(restored.name).toBe('企鹅');
  expect(restored.optional).toBeUndefined();
  expect(
    second.get<typeof original>('penguin:left', () => {
      throw Error('memory cache missed');
    })
  ).toBe(restored);
  expect(second.stats.hits).toBe(1);
});

test('source revisions, mismatched keys and corrupt/truncated records rebuild safely', () => {
  const disk = storage();
  const a = new ProceduralCache('one', disk);
  a.get('model', buildModel);
  const saved = disk.files.get('model')!.slice();
  let rebuilt = 0;
  const build = () => {
    rebuilt++;
    return buildModel();
  };
  new ProceduralCache('two', disk).get('model', build);
  expect(rebuilt).toBe(1);
  for (const bytes of [saved.slice(0, 12), saved.slice(0, saved.length - 4), saved.map((v, i) => (i === saved.length - 1 ? v ^ 1 : v))]) {
    disk.files.set('model', bytes);
    const cache = new ProceduralCache('one', disk);
    cache.get('model', build);
    expect(cache.stats.invalid).toBe(1);
  }
  disk.files.set('different-key', saved);
  const mismatch = new ProceduralCache('one', disk);
  mismatch.get('different-key', build);
  expect(mismatch.stats.invalid).toBe(1);
  expect(rebuilt).toBe(5);
});

test('unavailable storage and failed async writes preserve gameplay and can be flushed', async () => {
  let builds = 0;
  const cache = new ProceduralCache('v', {
    read() {
      throw Error('disk unavailable');
    },
    async write() {
      throw Error('disk full');
    }
  });
  const value = cache.get('model', () => {
    builds++;
    return buildModel();
  });
  await cache.flush();
  expect(cache.get('model', buildModel)).toBe(value);
  expect(builds).toBe(1);
  expect(cache.stats.failures).toBe(2);
  expect(cache.stats.pendingWrites).toBe(0);
});

test('live textures and skeletal metadata are never serialized as reusable static models', () => {
  const disk = storage();
  const cache = new ProceduralCache('v', disk);
  const model = buildModel();
  registerMesh(model.id, { ...meshInfo(model.id)!, texture: 7 });
  expect(cache.get('texture', () => model)).toBe(model);
  expect(disk.files.has('texture')).toBe(false);
  const rig = { ...buildModel(), jointCount: 20, animations: [] };
  expect(cache.get('rig', () => rig)).toBe(rig);
  expect(disk.files.has('rig')).toBe(false);
  cache.get('raw-texture', () => ({ id: 7, width: 512, height: 512 }));
  expect(disk.files.has('raw-texture')).toBe(false);
});

test('a verifying store skips the JS checksum and scans, and the core still rejects bad geometry', () => {
  const disk = { ...storage(), verified: true };
  let builds = 0;
  const build = () => {
    builds++;
    return buildModel();
  };
  new ProceduralCache('verified', disk).get('model', build);
  const saved = disk.files.get('model')!;
  // No JS checksum is written: the store checksums the record itself.
  expect(new DataView(saved.buffer, saved.byteOffset).getUint32(12, true)).toBe(0);
  const restored = new ProceduralCache('verified', disk);
  restored.get('model', build);
  expect(builds).toBe(1);
  expect(restored.stats.hits).toBe(1);
  // An index past the last vertex (which a verifying store wouldn't let through) is still refused by
  // the core, and the model is rebuilt.
  const bad = saved.slice();
  new DataView(bad.buffer).setUint32(bad.length - 4, 99, true);
  disk.files.set('model', bad);
  const rebuilt = new ProceduralCache('verified', disk);
  rebuilt.get('model', build);
  expect(rebuilt.stats.invalid).toBe(1);
  expect(builds).toBe(2);
});

test('peek returns saved values without building, and nothing when none is saved', () => {
  const disk = storage();
  const first = new ProceduralCache('peek', disk);
  expect(first.peek('level')).toBeUndefined();
  first.get('level', () => ({ seed: 7, props: [[1, 2]] }));
  const relaunch = new ProceduralCache('peek', disk);
  expect(relaunch.peek('level')).toEqual({ seed: 7, props: [[1, 2]] });
  expect(relaunch.peek('level')).toBe(relaunch.peek('level'));
  expect(relaunch.stats).toMatchObject({ hits: 1, builds: 0 });
  disk.files.set('broken', new Uint8Array([1, 2, 3]));
  expect(relaunch.peek('broken')).toBeUndefined();
  expect(relaunch.stats.invalid).toBe(1);
});
