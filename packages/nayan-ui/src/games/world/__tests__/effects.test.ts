import { expect, mock, test } from 'bun:test';
import { effects } from '../effects';
import type { BurstOptions, Entity } from '../types';
import type { World } from '../World';

function recorder() {
  const bursts: BurstOptions[] = [];
  const animations: unknown[][] = [];
  const world = {
    burst: mock((o: BurstOptions) => {
      bursts.push(o);
      return o.count ?? 0;
    }),
    animate: mock((...args: unknown[]) => {
      animations.push(args);
      return Promise.resolve();
    }),
    stopAnimation: mock(() => {})
  } as unknown as World;
  return { world, bursts, animations };
}

test('dust fades a single color by default and keeps several colors', () => {
  const { world, bursts } = recorder();
  effects.dust(world, { position: [1, 2, 3], color: [0.8, 0.7, 0.6, 0.5], size: 0.4, speed: 2, count: 6, lifetime: 0.5, spread: 1.2 });
  expect(bursts[0]).toEqual({
    position: [1, 2, 3],
    count: 6,
    mesh: 'puff',
    size: 0.4,
    speed: 2,
    lifetime: 0.5,
    gravity: 0,
    direction: undefined,
    spread: 1.2,
    color: [0.8, 0.7, 0.6, 0.5],
    endSize: 2,
    endColor: [0.8, 0.7, 0.6, 0]
  });
  effects.dust(world, {
    position: [0, 0, 0],
    color: [
      [2, 2, 2, 1],
      [1, 1, 0, 0.5]
    ],
    size: 1,
    speed: 1,
    count: 3,
    lifetime: 0.1,
    endSize: 1.8
  });
  expect(bursts[1]!.endColor).toBeUndefined();
  expect(bursts[1]!.endSize).toBe(1.8);
});

test('flash is one still glow that fades out', () => {
  const { world, bursts } = recorder();
  effects.flash(world, { position: [0, 1, 0], color: [2, 1.5, 0.5, 0.9], size: 3 });
  expect(bursts).toEqual([
    {
      position: [0, 1, 0],
      count: 1,
      mesh: 'flame',
      size: 3,
      speed: 0,
      lifetime: 0.22,
      gravity: 0,
      color: [2, 1.5, 0.5, 0.9],
      endSize: 2.2,
      endColor: [2, 1.5, 0.5, 0]
    }
  ]);
});

test('layered effects keep their composition', () => {
  const { world, bursts } = recorder();
  const base = { position: [0, 0, 0] as const, colors: [1, 0, 0] as const, size: 0.2, speed: 4, count: 20, lifetime: 1 };
  effects.confetti(world, base);
  expect(bursts.map((b) => b.mesh)).toEqual(['cube', 'cube', 'flame', 'flame']);
  bursts.length = 0;
  effects.shatter(world, { ...base, flash: false, dust: false });
  expect(bursts.map((b) => b.count)).toEqual([11, 12]);
  bursts.length = 0;
  effects.explosion(world, { position: [0, 0, 0], size: 1, speed: 2, count: 10, lifetime: 1, debris: [[0.3, 0.3, 0.3]] });
  expect(bursts.map((b) => b.mesh)).toEqual(['flame', 'puff', 'flame', 'puff', 'flame', 'cube']);
  for (const fx of [effects.sparkle, effects.splash, effects.sparks]) {
    bursts.length = 0;
    fx(world, base);
    expect(bursts.length).toBeGreaterThanOrEqual(3);
    expect(bursts.every((b) => b.position === base.position)).toBe(true);
  }
});

test('pop swells, flashes and shrinks the piece away', async () => {
  const { world, animations } = recorder();
  await effects.pop(world, 7 as Entity, { scale: 2, color: [1, 0, 0] });
  expect(animations).toHaveLength(2);
  const shrink = animations[1]!;
  expect(shrink[1]).toEqual([{ scale: 2.7, at: 0.15 }, { scale: 1.8, at: 0.25 }, { scale: 2, at: 0.35 }, { scale: 0 }]);
  expect(shrink[2]).toEqual({ duration: effects.POP_TIME, delay: 0 });
});

test('color helpers glow and pale', () => {
  expect(effects.hot([0.5, 0.25, 0], 2)).toEqual([2, 1, 0, 1]);
  expect(effects.pale([0, 0.5, 1], 0.5, 0.4)).toEqual([0.5, 0.75, 1, 0.4]);
});
