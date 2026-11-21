import { afterEach, expect, mock, test } from 'bun:test';
import { createTestCore } from '../../../native/__tests__/core';
import type { Font } from '../../assets/font';
import type { AnimateOptions, Entity, PickHit, RaycastHit } from '../types';

const native = await createTestCore();
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  Image: { resolveAssetSource: () => null }
}));
const { World } = await import('../World');
const owned: InstanceType<typeof World>[] = [];
function scene(capacity = 64) {
  const world = new World(capacity);
  owned.push(world);
  return world;
}
function advance(world: InstanceType<typeof World>, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) world.update(1 / 60);
}
afterEach(() => {
  for (const world of owned.splice(0)) world.dispose();
});

test('capacity, stale handles and parent removal preserve world ownership', () => {
  const world = scene(3);
  const parent = world.spawn({ mesh: 'none', position: [10, 0, 0], scale: 2 });
  const child = world.spawn({ mesh: 'cube', parent, position: [1, 2, 3] });
  const other = world.spawn();
  expect(() => world.spawn()).toThrow('full');
  world.update(1 / 60);
  expect(world.position(child)).toEqual([1, 2, 3]);
  expect(world.worldPosition(child)).toEqual([12, 4, 6]);
  expect(world.despawn(parent)).toBe(true);
  expect(world.count).toBe(1);
  expect(world.has(child)).toBe(false);
  expect(world.position(child)).toBeNull();
  expect(world.worldPosition(child)).toBeNull();
  expect(world.velocity(child)).toBeNull();
  expect(world.set(child, { position: [99, 0, 0] })).toBe(false);
  expect(world.despawn(child)).toBe(false);
  expect(world.has(other)).toBe(true);
  const replacement = world.spawn();
  expect(replacement).not.toBe(child);
});

test('invalid entity descriptions fail without allocating actors', () => {
  const world = scene();
  const parent = world.spawn();
  expect(() => world.spawn({ parent, physics: 'dynamic' })).toThrow('attached');
  expect(() => world.spawn({ text: 'A' })).toThrow('font');
  expect(() => world.spawn({ physics: { type: 'dynamic', density: -1 } })).toThrow('invalid');
  expect(world.count).toBe(1);
});

test('gravity, impulses, bounds and reusable queries affect actual simulation', () => {
  const world = scene();
  expect(world.gravity).toEqual([0, -9.81, 0]);
  world.gravity = [0, 0, 0];
  const ball = world.spawn({ mesh: 'sphere', physics: 'dynamic' });
  world.impulse(ball, [2, 0, 0]);
  advance(world, 0.1);
  const out: [number, number, number] = [0, 0, 0];
  expect(world.velocity(ball, out)).toBe(out);
  expect(out[0]).toBeGreaterThan(0);
  expect(world.position(ball)![0]).toBeGreaterThan(0);
  expect(world.gravity).toEqual([0, 0, 0]);
  world.bounds = [-1, -2, 1, 2];
  expect(world.bounds).toEqual([-1, -2, 1, 2]);
  const marker = world.spawn({ position: [9, 0, 9], velocity: [1, 0, 1] });
  advance(world, 0.1);
  expect(world.position(marker)).toEqual([1, 0, 2]);
  world.bounds = null;
  world.listener = ball;
  expect(world.listener).toBe(ball);
  world.listener = null;
  expect(world.bounds).toBeNull();
  expect(world.listener).toBeNull();
});

test('raycasts, picking and projection return independent query results', () => {
  const world = scene();
  const cube = world.spawn({ mesh: 'cube', physics: 'fixed' });
  expect(world.toScreen([0, 0, 0])).toBeNull();
  world.update(1 / 60);
  const hit = world.raycast([0, 0, -3], [0, 0, 1], 10)!;
  expect(hit.entity).toBe(cube);
  expect(hit.distance).toBeCloseTo(2.5, 5);
  expect(hit.normal).toEqual([0, 0, -1]);
  expect(world.raycast([9, 9, -3], [0, 0, 1], 10)).toBeNull();
  expect(world.raycast([0, 0, -3], [0, 0, 1], 10, 2)).toBeNull();
  world.setView(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), 200, 100);
  expect(world.toScreen([0, 0, 0])).toEqual([100, 50]);
  expect(world.pick(100, 50)?.entity).toBe(cube);
  expect(world.pick(-1000, -1000)).toBeNull();
  expect(world.screenToWorld(100, 50)).toBeNull();
  expect(world.screenToWorld(100, 50, { point: [0, 0, 0.25], normal: [0, 0, 1] })).toEqual([0, 0, 0.25]);
  expect(hit.point).toEqual([0, 0, -0.5]); // Later queries did not overwrite an earlier result.
});

test('scoreboard operations, clocks, bonuses and event acknowledgements match Rust state', () => {
  const world = scene();
  const board = world.scoreboard;
  expect(world.scoreboard).toBe(board);
  const score = mock(() => {}),
    lives = mock(() => {}),
    second = mock(() => {}),
    ended = mock(() => {}),
    out = mock(() => {});
  board.handlers = {
    onScore: score,
    onLives: lives,
    onSecond: second,
    onTimeUp: ended,
    onLivesOut: out
  };
  board.reset(3);
  expect(board.add(10)).toBe(10);
  expect(board.set(15)).toBe(15);
  expect(board.best).toBe(15);
  expect(board.addLives(-1)).toBe(2);
  board.startCountdown(2, 10);
  expect(board.running).toBe(true);
  world.update(0);
  expect(score).toHaveBeenCalledTimes(1);
  expect(lives).toHaveBeenCalledTimes(1);
  advance(world, 0.5);
  expect(board.seconds).toBeCloseTo(1.5, 4);
  expect(board.shownSeconds).toBe(2);
  const stopped = board.seconds;
  board.stop();
  advance(world, 0.5);
  expect(board.running).toBe(false);
  expect(board.seconds).toBe(stopped);
  board.resume();
  board.addTime(1);
  expect(board.awardTimeBonus(2)).toBe(board.score);
  board.setLives(0);
  advance(world, 3);
  expect(board.seconds).toBe(0);
  expect(board.running).toBe(false);
  expect(ended).toHaveBeenCalledTimes(1);
  expect(out).toHaveBeenCalledTimes(1);
  const events = score.mock.calls.length;
  world.update(0);
  expect(score).toHaveBeenCalledTimes(events);
  board.reset();
  expect(board.best).toBeGreaterThanOrEqual(15);
  expect(board.score).toBe(0);
  expect(board.lives).toBe(0);
  board.startClock(2);
  advance(world, 1.1);
  expect(board.seconds).toBeGreaterThanOrEqual(1);
  expect(board.shownSeconds).toBe(1);
  expect(board.awardTimeBonus(2, 3)).toBe(board.score);
});

test('timers run in order, allow reentrancy and stop at disposal', () => {
  const world = scene();
  const calls: string[] = [];
  world.after(0.05, () => calls.push('later'));
  world.after(0.01, () => {
    calls.push('early');
    world.after(0.01, () => calls.push('nested'));
  });
  expect(world.timerCount).toBe(2);
  world.update(0);
  expect(calls).toEqual([]);
  advance(world, 0.1);
  expect(calls).toEqual(['early', 'nested', 'later']);
  expect(world.timerCount).toBe(0);
  world.after(0, () => calls.push('cancelled'));
  world.cancelTimers();
  advance(world, 0.1);
  expect(calls).not.toContain('cancelled');
  world.after(0, () => {
    calls.push('dispose');
    world.dispose();
  });
  world.after(0, () => calls.push('after-dispose'));
  world.update(1 / 60);
  expect(calls.at(-1)).toBe('dispose');
  expect(world.count).toBe(0);
});

test.each([true, 'bouncy', { stiffness: 120, damping: 20, mass: 2 }] as const)('springs (%j) converge and can be stopped', async (spring) => {
  const world = scene();
  const entity = world.spawn();
  const completion = world.animate(entity, { position: [2, 0, 0] }, { spring });
  advance(world, 3);
  expect(world.position(entity)![0]).toBeCloseTo(2, 2);
  world.stopAnimation(entity);
  await completion;
});

test.each(['linear', 'easeIn', 'easeOut', 'easeInOut', 'back', 'bounce', 'elastic'] as const)(
  'animation easing %s preserves the final pose',
  async (easing) => {
    const world = scene();
    const entity = world.spawn();
    const done = world.animate(entity, { position: [3, 2, 1], scale: [2, 3, 4], color: [0.1, 0.2, 0.3, 0.4] }, { duration: 0.1, easing });
    advance(world, 0.5);
    await done;
    expect(world.position(entity)).toEqual([3, 2, 1]);
  }
);

test('keyframes, group staggering, relative motion and cancellation settle promises', async () => {
  const world = scene(100);
  const actors = Array.from({ length: 40 }, () => world.spawn());
  const options: AnimateOptions = {
    duration: 0.1,
    stagger: 0.001,
    path: 'smooth',
    delay: 0.01,
    repeat: 1,
    yoyo: true
  };
  const group = world.animate(
    actors,
    [
      {
        position: [0, 1, 0],
        rotation: [0, 0, 0, 1],
        scale: 1,
        at: 0.5,
        shake: 0.1
      },
      {
        moveBy: [1, 0, 0],
        turn: [0, Math.PI, 0],
        scale: [1, 2, 1],
        color: [1, 0, 0]
      }
    ],
    options
  );
  advance(world, 1);
  await group;
  await world.animate([], { scale: 2 });
  await world.animate(actors, []);
  expect(() =>
    world.animate(
      actors,
      Array.from({ length: 65 }, () => ({ scale: 1 }))
    )
  ).toThrow('64');
  const infinite = world.animate(actors[0]!, { scale: 2 }, { repeat: 'forever' });
  world.despawn(actors[0]!);
  await infinite;
  const pending = world.animate(actors[1]!, { scale: 3 }, { repeat: 'forever' });
  world.dispose();
  await pending;
  world.dispose();
  expect(() => world.spawn()).toThrow('dispose');
  expect(() => world.update(0)).toThrow('dispose');
});

test('particles respect capacity and expire without removing permanent actors', () => {
  const world = scene(5);
  const permanent = world.spawn();
  expect(
    world.burst({
      position: [0, 0, 0],
      count: 10,
      lifetime: 0.1,
      mesh: 'flame',
      color: [
        [1, 0, 0],
        [0, 1, 0, 0.5]
      ],
      endColor: [0, 0, 0, 0],
      endSize: 0
    })
  ).toBe(4);
  advance(world, 0.5);
  expect(world.count).toBe(1);
  expect(world.has(permanent)).toBe(true);
  expect(world.burst({ position: [0, 0, 0] })).toBe(4);
});

test('failed text creation releases root and glyphs; text updates remain owned by the root', () => {
  const font: Font = {
    id: 0,
    capHeight: 0.7,
    glyphs: new Map([
      ['A', { mesh: 0, advance: 0.6 }],
      ['?', { mesh: 0, advance: 0.6 }]
    ])
  };
  const small = scene(2);
  expect(() => small.spawn({ text: 'AAA', font })).toThrow('room for text');
  expect(small.count).toBe(0);
  const world = scene();
  const label = world.spawn({ text: 'AA', font });
  world.set(label, { color: [0.2, 0.3, 0.4] });
  world.set(label, {
    text: 'A',
    align: 'right',
    letterSpacing: 0.1,
    tabular: true
  });
  expect(world.count).toBe(2);
  world.set(label, { text: 'AAA', font: { ...font } });
  expect(world.count).toBe(4);
  expect(world.despawn(label)).toBe(true);
  expect(world.count).toBe(0);
});

test('disposed worlds report it and make cleanup calls harmless', async () => {
  const world = scene();
  const piece = world.spawn({ position: [1, 0, 0] });
  const moving = world.animate(piece, { position: [5, 0, 0] }, { duration: 10 });
  expect(world.isDisposed).toBe(false);
  world.dispose();
  expect(world.isDisposed).toBe(true);
  await moving; // A late `.then(() => world.despawn(piece))` no longer needs a guard.
  expect(world.despawn(piece)).toBe(false);
  expect(world.set(piece, { scale: 2 })).toBe(false);
  expect(world.has(piece)).toBe(false);
  expect(world.position(piece)).toBeNull();
  expect(world.raycast([0, 0, -3], [0, 0, 1], 10)).toBeNull();
  expect(world.toScreen([0, 0, 0])).toBeNull();
  expect(world.after(0, () => {})).toBe(0);
  await world.animate(piece, { scale: 2 });
  world.stopAnimation(piece);
  world.impulse(piece, [0, 1, 0]);
  world.cancelTimers();
  world.forEachCollision(() => {
    throw new Error('no events after dispose');
  });
  expect(() => world.spawn()).toThrow('dispose');
});

test('single timers cancel without affecting the others', () => {
  const world = scene();
  const calls: string[] = [];
  const dropped = world.after(0.01, () => calls.push('dropped'));
  world.after(0.01, () => calls.push('kept'));
  expect(world.cancelTimer(dropped)).toBe(true);
  expect(world.cancelTimer(dropped)).toBe(false);
  expect(world.timerCount).toBe(1);
  advance(world, 0.1);
  expect(calls).toEqual(['kept']);
});

test('queries reuse caller-owned results', () => {
  const world = scene();
  const cube = world.spawn({ mesh: 'cube', physics: 'fixed' });
  world.update(1 / 60);
  const hit: RaycastHit = { entity: -1 as Entity, distance: 0, normal: [0, 0, 0], point: [0, 0, 0] };
  expect(world.raycast([0, 0, -3], [0, 0, 1], 10, -1, hit)).toBe(hit);
  expect(hit.entity).toBe(cube);
  expect(hit.normal).toEqual([0, 0, -1]);
  expect(hit.point).toEqual([0, 0, -0.5]);
  world.setView(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), 200, 100);
  const screen: [number, number] = [0, 0];
  expect(world.toScreen([0, 0, 0], screen)).toBe(screen);
  expect(screen).toEqual([100, 50]);
  const picked: PickHit = { entity: -1 as Entity, distance: 0, point: [0, 0, 0] };
  expect(world.pick(100, 50, picked)).toBe(picked);
  expect(picked.entity).toBe(cube);
  const ground: [number, number, number] = [9, 9, 9];
  expect(world.screenToWorld(100, 50, { point: [0, 0, 0.25], normal: [0, 0, 1] }, ground)).toBe(ground);
  expect(ground).toEqual([0, 0, 0.25]);
});

test('the shared transform batch merges per-entity updates without allocating records', () => {
  const world = scene();
  const a = world.spawn({ mesh: 'cube' });
  const b = world.spawn({ mesh: 'cube' });
  const batch = world.transforms;
  expect(world.transforms).toBe(batch);
  batch.position(a, 1, 2, 3);
  batch.rotation(a, 0, 0, 0, 1);
  batch.scale(a, 2);
  batch.color(a, 1, 0, 0);
  batch.transform(b, 4, 5, 6, 0, 0, 0, 1);
  batch.scale(b, 1, 2, 3);
  expect(batch.size).toBe(2);
  expect(batch.flush()).toBe(2);
  expect(batch.size).toBe(0);
  world.update(1 / 60);
  expect(world.position(a)).toEqual([1, 2, 3]);
  expect(world.position(b)).toEqual([4, 5, 6]);
});

test('scoreboard reset can show a full, stopped countdown', () => {
  const world = scene();
  const board = world.scoreboard;
  board.reset(3, 30);
  advance(world, 1);
  expect(board.lives).toBe(3);
  expect(board.shownSeconds).toBe(30);
  board.resume();
  advance(world, 1.05);
  expect(board.shownSeconds).toBeLessThan(30);
});

test('scoreboard listeners run alongside the game handlers until removed', () => {
  const world = scene();
  const board = world.scoreboard;
  const seen: string[] = [];
  board.handlers = { onScore: (s) => seen.push(`game ${s}`), onTimeUp: () => seen.push('game time up') };
  const stop = board.listen({ onScore: (s) => seen.push(`ui ${s}`), onSecond: (s) => seen.push(`ui ${s}s`) });
  board.add(5);
  world.update(0);
  expect(seen).toEqual(['game 5', 'ui 5']);
  seen.length = 0;
  board.startCountdown(0.5);
  advance(world, 0.6);
  expect(seen).toContain('game time up');
  expect(seen).toContain('ui 0s');
  stop();
  seen.length = 0;
  board.add(1);
  world.update(0);
  expect(seen).toEqual(['game 6']);
});

test('colors accept CSS strings wherever a tuple works', () => {
  const world = scene();
  const a = world.spawn({ mesh: 'cube', color: '#ff000080' });
  world.update(1 / 60);
  expect([...world.colors.slice(0, 4)].map((v) => Math.round(v * 255))).toEqual([255, 0, 0, 128]);
  world.set(a, { color: 'rgb(0, 255, 0)' });
  world.update(1 / 60);
  expect([...world.colors.slice(0, 4)]).toEqual([0, 1, 0, 1]);
  expect(world.burst({ position: [0, 0, 0], count: 2, color: ['#fff', [1, 0, 0]], endColor: 'transparent' })).toBe(2);
  expect(() => world.spawn({ color: 'not-a-color' })).toThrow('is not a color');
});

test('updateCount counts every update, including after an update(0)', () => {
  const world = scene();
  expect(world.updateCount).toBe(0);
  world.update(0);
  world.update(1 / 60);
  expect(world.updateCount).toBe(2);
});

test('update applies transforms queued since the last step', () => {
  const world = scene();
  const e = world.spawn({ mesh: 'cube' });
  world.transforms.position(e, 3, 2, 1);
  world.update(1 / 60);
  expect(world.position(e)).toEqual([3, 2, 1]);
  expect(world.transforms.flush()).toBe(0);
});

test('still entities live in a cached backdrop layer behind the world, through set, despawn and dispose', () => {
  const world = scene(8);
  expect(world.backdrop).toBeNull();
  const live = world.spawn({ mesh: 'sphere' });
  const still = world.spawn({ mesh: 'cube', position: [1, 2, 3], still: true });
  const layer = world.backdrop!;
  // The layer holds the scenery; the world only an undrawn stand-in, its handle unique here
  expect(layer.count).toBe(1);
  expect(still).not.toBe(live);
  expect(world.has(still)).toBe(true);
  // Stepping the world steps the layer once after a change (which has GameView draw it again), not every frame
  world.update(1 / 60);
  const drawn = layer.updateCount;
  expect(drawn).toBe(1);
  expect(Array.from(layer.matrices.subarray(12, 15))).toEqual([1, 2, 3]);
  world.update(1 / 60);
  expect(layer.updateCount).toBe(drawn);
  expect(world.set(still, { position: [4, 5, 6] })).toBe(true);
  world.update(1 / 60);
  expect(layer.updateCount).toBe(drawn + 1);
  expect(Array.from(layer.matrices.subarray(12, 15))).toEqual([4, 5, 6]);
  // A still entity stays put: no attaching or physics
  expect(() => world.spawn({ still: true, parent: live })).toThrow('still');
  expect(() => world.set(still, { parent: live })).toThrow('still');
  // Despawning removes it from the layer; disposing the world disposes the layer
  expect(world.despawn(still)).toBe(true);
  world.update(1 / 60);
  expect([layer.count, world.has(still)]).toEqual([0, false]);
  const bulk = world.backdropLayer();
  expect(bulk).toBe(layer);
  world.dispose();
  expect(layer.isDisposed).toBe(true);
});
