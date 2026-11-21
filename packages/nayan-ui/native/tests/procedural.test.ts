import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { createBrowserEngine, type WasmCore } from '../../src/native/BrowserEngine';

type Procedural = typeof import('../../src/games/assets/procedural');
let api: Procedural;

beforeAll(async () => {
  const { default: init } = await import('../core/build/web/engine_core.js');
  const core = (await init({
    module_or_path: await readFile(new URL('../core/build/web/engine_core_bg.wasm', import.meta.url))
  })) as unknown as WasmCore;
  mock.module('../../src/native/NativeNayanEngine', () => ({ default: createBrowserEngine(core) }));
  api = await import('../../src/games/assets/procedural');
});

/** A river along local x = 10 (impassable), trees with solids, a spawn, reach, picks and an overview. */
function recipe(seed: number, rotation = 0) {
  const { FieldGraph } = api;
  const f = new FieldGraph();
  const bank = f.sub(f.abs(f.sub(f.x, 10)), 3);
  f.output('bank', bank);
  f.output('height', f.select(bank, -1, f.mul(f.z, 0.02)));
  f.output('clear', f.sub(bank, 1));
  const angle = f.mul(f.input('r0'), Math.PI * 2);
  const reach = f.mul(f.input('r1'), 40);
  f.output('px', f.mul(f.cos(angle), reach));
  f.output('pz', f.mul(f.sin(angle), reach));
  f.output('ground', f.input('ground'));
  f.output('radius', 0.5);
  f.output('top', f.add(f.input('ground'), 3));
  f.output('size', f.add(1, f.input('r1')));
  return {
    seed,
    rotation,
    fields: f,
    terrain: {
      axis: Array.from({ length: 51 }, (_, i) => -50 + i * 2),
      height: 'height',
      regions: [{ field: 'bank', surface: 2, material: 1 }],
      fallback: { surface: 1, material: 0 },
      materials: 2
    },
    walk: { boundary: 45, clearance: 'clear', height: 2 },
    steps: [
      { kind: 'spawn', near: [-10, 0], rings: 10, samples: 12, radius: 1, surfaces: [1] },
      {
        kind: 'scatter',
        name: 'trees',
        count: 60,
        randoms: 2,
        x: 'px',
        z: 'pz',
        y: 'ground',
        attributes: ['size'],
        filters: [
          { kind: 'walkable', radius: 1.2 },
          { kind: 'spawn', minDistance: 5 }
        ],
        solid: { shapes: [{ kind: 'circle', radius: 'radius', bottom: 'ground', top: 'top' }] }
      },
      { kind: 'reach', cell: 3, steps: 6, radius: 0.6, extent: 45 },
      { kind: 'pick', groups: [{ name: 'gems', count: 5, spacing: 6, fromSpawn: 4 }] },
      { kind: 'overview', size: 32, extent: 45 }
    ]
  } satisfies import('../../src/games/assets/procedural').WorldRecipe;
}

describe('procedural worlds built by the shared core', () => {
  test('generation, layers, picks and walker queries', () => {
    const world = api.generateWorld(recipe(3));
    try {
      expect(world.restored).toBe(false);
      expect(world.walkable(world.spawn.x, world.spawn.z, 1)).toBe(true);
      const trees = world.layer('trees');
      expect(world.layers.trees).toEqual({ stride: 4, count: trees.length / 4 });
      for (let i = 0; i < trees.length; i += 4) {
        expect(world.walkable(trees[i]!, trees[i + 2]!, 0.3)).toBe(false);
        expect(trees[i + 3]).toBeGreaterThanOrEqual(1);
      }
      const reachable = world.reachable();
      expect(reachable.length).toBeGreaterThan(100);
      for (let i = 0; i < reachable.length; i += 2) expect(reachable[i]).toBeLessThan(6);
      expect(world.picks.gems).toHaveLength(5);
      expect(world.surface(10, 0)).toBe(2);
      expect(world.field('bank', 10, 0)).toBe(-3);
      expect(world.ground(10, 0)).toBe(-1);
      expect(world.platformAt(0, 0)).toBe(-1);
      expect(world.tilt(-20, 0)).toHaveLength(4);
      const walker = { ...world.spawn };
      world.move(walker, 40, 0, 0.5);
      expect(walker.x).toBeGreaterThan(world.spawn.x);
      expect(walker.x).toBeLessThan(6);
      expect(world.canSee(world.spawn, { x: 20, z: world.spawn.z })).toBe(false);
      const blocked = { ...world.spawn };
      world.move(blocked, 4, 0, 0.5, [{ x: world.spawn.x + 2, z: world.spawn.z, radius: 0.5 }]);
      expect(Math.hypot(blocked.x - world.spawn.x - 2, blocked.z - world.spawn.z)).toBeGreaterThanOrEqual(1 - 1e-6);
      const overview = world.overview();
      expect(overview).toHaveLength(32 * 32);
      expect(overview.includes(2)).toBe(true);
      const before = world.picks.gems;
      expect(world.pick(1)).toBe(true);
      expect(world.picks.gems).not.toEqual(before);
      const land = world.terrain(0);
      expect(land.vertices.length % 11).toBe(0);
      expect(land.indices.length).toBeGreaterThan(0);
    } finally {
      world.dispose();
    }
    expect(() => world.ground(0, 0)).toThrow('dispose');
  });

  test('the same recipe builds the same world, async included', async () => {
    const a = api.generateWorld(recipe(9, 0.4));
    const b = await api.generateWorldAsync(recipe(9, 0.4));
    expect(Array.from(b.layer('trees'))).toEqual(Array.from(a.layer('trees')));
    expect(b.picks).toEqual(a.picks);
    a.dispose();
    b.dispose();
  });

  test('a malformed recipe reports why', () => {
    const bad = { ...recipe(1), walk: { boundary: 45, clearance: 'missing', height: 2 } };
    expect(() => api.generateWorld(bad)).toThrow('missing field output "missing"');
  });

  test('procedural meshes: surfaces and cards', () => {
    const { FieldGraph } = api;
    const f = new FieldGraph();
    const angle = f.mul(f.input('u'), Math.PI * 2);
    f.output('px', f.cos(angle));
    f.output('pz', f.sin(angle));
    f.output('py', f.input('v'));
    f.output('zero', 0);
    f.output('one', 1);
    f.output('u', f.input('u'));
    f.output('v', f.input('v'));
    f.output('cx', f.input('r0'));
    const mesh = api.generateMesh({
      fields: f,
      parts: [
        {
          kind: 'surface',
          rows: 4,
          cols: 16,
          position: ['px', 'py', 'pz'],
          normal: ['px', 'zero', 'pz'],
          uv: ['u', 'v'],
          color: ['one', 'one', 'one']
        },
        {
          kind: 'cards',
          count: 3,
          seed: 5,
          randoms: 1,
          corners: [
            [-1, -1, 0, 0],
            [1, -1, 1, 0],
            [1, 1, 1, 1],
            [-1, 1, 0, 1]
          ],
          center: ['cx', 'zero', 'zero'],
          right: ['one', 'zero', 'zero'],
          up: ['zero', 'one', 'zero'],
          normal: ['zero', 'one', 'zero'],
          color: ['one', 'one', 'one'],
          double: true
        }
      ]
    });
    expect(mesh.vertices.length / 11).toBe(5 * 17 + 12);
    expect(mesh.indices.length).toBe(4 * 16 * 6 + 3 * 12);
  });
});
