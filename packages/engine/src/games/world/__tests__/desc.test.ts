import { describe, expect, test } from 'bun:test';
import type { Sound } from '../../../audio/audio';
import { DESC_LEN, EASING, encode } from '../desc';
import type { Entity } from '../types';

// Slot and flag constants must stay in sync with the Rust core (native/core/include/engine_core.h).
const FLAG = {
  MESH: 1 << 0,
  POSITION: 1 << 1,
  ROTATION: 1 << 2,
  SCALE: 1 << 3,
  COLOR: 1 << 4,
  VELOCITY: 1 << 5,
  GROUND_VELOCITY: 1 << 6,
  SPIN: 1 << 7,
  BOB: 1 << 8,
  FOLLOW: 1 << 9,
  LIFETIME: 1 << 10,
  PARENT: 1 << 11,
  PHYSICS: 1 << 12,
  IMPACT: 1 << 13,
  ACCELERATION: 1 << 14,
  PICKABLE: 1 << 15,
  REGION: 1 << 16
} as const;
const SLOT = {
  FLAGS: 0,
  MESH: 1,
  POSITION: 2,
  ROTATION: 5,
  SCALE: 9,
  COLOR: 12,
  VELOCITY: 16,
  GROUND_VELOCITY: 19,
  SPIN: 21,
  BOB: 24,
  FOLLOW: 29,
  LIFETIME: 31,
  PARENT: 32,
  PHYSICS: 33,
  IMPACT: 50,
  ACCELERATION: 56,
  PICKABLE: 59,
  REGION: 60
} as const;

function fresh(): Float64Array {
  return new Float64Array(DESC_LEN);
}

describe('encode', () => {
  test('empty options set no flags', () => {
    const d = fresh();
    encode(d, {}, undefined);
    expect(d[SLOT.FLAGS]).toBe(0);
  });

  test('mesh flag and value', () => {
    const d = fresh();
    encode(d, {}, 42);
    expect(d[SLOT.FLAGS]! & FLAG.MESH).toBeTruthy();
    expect(d[SLOT.MESH]).toBe(42);
  });

  test('position is written correctly', () => {
    const d = fresh();
    encode(d, { position: [1, 2, 3] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.POSITION).toBeTruthy();
    expect(d[SLOT.POSITION]).toBe(1);
    expect(d[SLOT.POSITION + 1]).toBe(2);
    expect(d[SLOT.POSITION + 2]).toBe(3);
  });

  test('rotation is written correctly', () => {
    const d = fresh();
    encode(d, { rotation: [0.1, 0.2, 0.3, 0.4] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.ROTATION).toBeTruthy();
    expect(d[SLOT.ROTATION]).toBeCloseTo(0.1);
    expect(d[SLOT.ROTATION + 3]).toBeCloseTo(0.4);
  });

  test('uniform scale fills three slots', () => {
    const d = fresh();
    encode(d, { scale: 5 }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.SCALE).toBeTruthy();
    expect(d[SLOT.SCALE]).toBe(5);
    expect(d[SLOT.SCALE + 1]).toBe(5);
    expect(d[SLOT.SCALE + 2]).toBe(5);
  });

  test('non-uniform scale uses three values', () => {
    const d = fresh();
    encode(d, { scale: [1, 2, 3] }, undefined);
    expect(d[SLOT.SCALE]).toBe(1);
    expect(d[SLOT.SCALE + 1]).toBe(2);
    expect(d[SLOT.SCALE + 2]).toBe(3);
  });

  test('color defaults alpha to 1', () => {
    const d = fresh();
    encode(d, { color: [0.5, 0.6, 0.7] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.COLOR).toBeTruthy();
    expect(d[SLOT.COLOR + 3]).toBe(1);
  });

  test('color with explicit alpha', () => {
    const d = fresh();
    encode(d, { color: [1, 1, 1, 0.5] }, undefined);
    expect(d[SLOT.COLOR + 3]).toBe(0.5);
  });

  test('velocity', () => {
    const d = fresh();
    encode(d, { velocity: [10, 0, -5] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.VELOCITY).toBeTruthy();
    expect(d[SLOT.VELOCITY]).toBe(10);
    expect(d[SLOT.VELOCITY + 2]).toBe(-5);
  });

  test('groundVelocity', () => {
    const d = fresh();
    encode(d, { groundVelocity: [3, 4] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.GROUND_VELOCITY).toBeTruthy();
    expect(d[SLOT.GROUND_VELOCITY]).toBe(3);
    expect(d[SLOT.GROUND_VELOCITY + 1]).toBe(4);
  });

  test('spin', () => {
    const d = fresh();
    encode(d, { spin: [1, 2, 3] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.SPIN).toBeTruthy();
    expect(d[SLOT.SPIN]).toBe(1);
  });

  test('bob with defaults', () => {
    const d = fresh();
    encode(d, { bob: { amplitude: [0, 0.5, 0], speed: 2 } }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.BOB).toBeTruthy();
    expect(d[SLOT.BOB + 1]).toBe(0.5);
    expect(d[SLOT.BOB + 3]).toBe(2);
    expect(d[SLOT.BOB + 4]).toBe(0); // default phase
  });

  test('bob null clears (zero amplitude/speed)', () => {
    const d = fresh();
    encode(d, { bob: null }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.BOB).toBeTruthy();
    expect(d[SLOT.BOB + 3]).toBe(0);
  });

  test('follow', () => {
    const d = fresh();
    const target = 7 as Entity;
    encode(d, { follow: { target, speed: 5 } }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.FOLLOW).toBeTruthy();
    expect(d[SLOT.FOLLOW]).toBe(7);
    expect(d[SLOT.FOLLOW + 1]).toBe(5);
  });

  test('follow null clears', () => {
    const d = fresh();
    encode(d, { follow: null }, undefined);
    expect(d[SLOT.FOLLOW]).toBe(-1);
  });

  test('lifetime', () => {
    const d = fresh();
    encode(d, { lifetime: 3.5 }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.LIFETIME).toBeTruthy();
    expect(d[SLOT.LIFETIME]).toBe(3.5);
  });

  test('lifetime null clears to 0', () => {
    const d = fresh();
    encode(d, { lifetime: null }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.LIFETIME).toBeTruthy();
    expect(d[SLOT.LIFETIME]).toBe(0);
  });

  test('parent', () => {
    const d = fresh();
    encode(d, { parent: 10 as Entity }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.PARENT).toBeTruthy();
    expect(d[SLOT.PARENT]).toBe(10);
  });

  test('parent null detaches', () => {
    const d = fresh();
    encode(d, { parent: null }, undefined);
    expect(d[SLOT.PARENT]).toBe(-1);
  });

  test('physics string shorthand', () => {
    const d = fresh();
    encode(d, { physics: 'dynamic' }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.PHYSICS).toBeTruthy();
    expect(d[SLOT.PHYSICS]).toBe(1); // BODY_KIND.dynamic = 1
  });

  test('physics with ball shape and explicit radius', () => {
    const d = fresh();
    encode(d, { physics: { type: 'dynamic', shape: 'ball', radius: 0.8 } }, undefined);
    expect(d[SLOT.PHYSICS]).toBe(1); // dynamic
    expect(d[SLOT.PHYSICS + 1]).toBe(0); // ball
    expect(d[SLOT.PHYSICS + 2]).toBeCloseTo(0.8); // radius
  });

  test('physics with box shape and explicit size', () => {
    const d = fresh();
    encode(d, { physics: { type: 'fixed', shape: 'box', size: [2, 4, 6] } }, undefined);
    expect(d[SLOT.PHYSICS]).toBe(3); // fixed
    expect(d[SLOT.PHYSICS + 1]).toBe(1); // box
    // Sizes are halved for half-extents
    expect(d[SLOT.PHYSICS + 2]).toBe(1);
    expect(d[SLOT.PHYSICS + 3]).toBe(2);
    expect(d[SLOT.PHYSICS + 4]).toBe(3);
  });

  test('physics null clears', () => {
    const d = fresh();
    encode(d, { physics: null }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.PHYSICS).toBeTruthy();
    expect(d[SLOT.PHYSICS]).toBe(0);
  });

  test('physics defaults (friction, bounce, density, etc.)', () => {
    const d = fresh();
    encode(d, { physics: { type: 'kinematic' } }, undefined);
    expect(d[SLOT.PHYSICS + 8]).toBeCloseTo(0.5); // friction
    expect(d[SLOT.PHYSICS + 9]).toBe(0); // bounce
    expect(d[SLOT.PHYSICS + 10]).toBe(1); // density
    expect(d[SLOT.PHYSICS + 12]).toBeCloseTo(0.05); // angularDrag
    expect(d[SLOT.PHYSICS + 13]).toBe(1); // gravityScale
  });

  test('impact feedback', () => {
    const d = fresh();
    encode(
      d,
      {
        impact: {
          sound: 5 as Sound,
          minSpeed: 2,
          maxSpeed: 20,
          volume: 1.5,
          haptic: 0.3
        }
      },
      undefined
    );
    expect(d[SLOT.FLAGS]! & FLAG.IMPACT).toBeTruthy();
    expect(d[SLOT.IMPACT]).toBe(1);
    expect(d[SLOT.IMPACT + 1]).toBe(5);
    expect(d[SLOT.IMPACT + 2]).toBe(2);
    expect(d[SLOT.IMPACT + 3]).toBe(20);
    expect(d[SLOT.IMPACT + 4]).toBe(1.5);
    expect(d[SLOT.IMPACT + 5]).toBeCloseTo(0.3);
  });

  test('impact null clears', () => {
    const d = fresh();
    encode(d, { impact: null }, undefined);
    expect(d[SLOT.IMPACT]).toBe(0);
  });

  test('acceleration', () => {
    const d = fresh();
    encode(d, { acceleration: [0, -9.81, 0] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.ACCELERATION).toBeTruthy();
    expect(d[SLOT.ACCELERATION + 1]).toBeCloseTo(-9.81);
  });

  test('pickable true', () => {
    const d = fresh();
    encode(d, { pickable: true }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.PICKABLE).toBeTruthy();
    expect(d[SLOT.PICKABLE]).toBe(1);
  });

  test('pickable false', () => {
    const d = fresh();
    encode(d, { pickable: false }, undefined);
    expect(d[SLOT.PICKABLE]).toBe(0);
  });

  test('textureRegion', () => {
    const d = fresh();
    encode(d, { textureRegion: [0.25, 0.25, 0.75, 0.75] }, undefined);
    expect(d[SLOT.FLAGS]! & FLAG.REGION).toBeTruthy();
    expect(d[SLOT.REGION]).toBe(0.25);
    expect(d[SLOT.REGION + 2]).toBe(0.75);
  });

  test('multiple fields combine flags', () => {
    const d = fresh();
    encode(d, { position: [1, 0, 0], color: [1, 0, 0], velocity: [0, 0, 1] }, 0);
    const flags = d[SLOT.FLAGS]!;
    expect(flags & FLAG.MESH).toBeTruthy();
    expect(flags & FLAG.POSITION).toBeTruthy();
    expect(flags & FLAG.COLOR).toBeTruthy();
    expect(flags & FLAG.VELOCITY).toBeTruthy();
    expect(flags & FLAG.ROTATION).toBeFalsy();
  });
});

describe('EASING', () => {
  test('all easing names are defined', () => {
    expect(EASING.linear).toBe(0);
    expect(EASING.easeIn).toBe(1);
    expect(EASING.easeOut).toBe(2);
    expect(EASING.easeInOut).toBe(3);
    expect(EASING.back).toBe(4);
    expect(EASING.bounce).toBe(5);
    expect(EASING.elastic).toBe(6);
  });
});

describe('DESC_LEN', () => {
  test('is 64 (matches the Rust core)', () => {
    expect(DESC_LEN).toBe(64);
  });
});
