import { describe, expect, test } from 'bun:test';
import type { Camera, RenderSource } from '../../types';
import type { Entity } from '../../world/types';
import type { World } from '../../world/World';
import { follow, shake } from '../camera';

function makeCamera(eye: [number, number, number], target: [number, number, number], fov = Math.PI / 3): Camera {
  return { eye: [...eye], target: [...target], fov };
}

function makeSource(positions: Record<number, [number, number, number]>): RenderSource & { worldPosition: World['worldPosition'] } {
  return {
    matrices: new Float32Array(0),
    colors: new Float32Array(0),
    regions: new Float32Array(0),
    ranges: new Uint32Array(0),
    capacity: 10,
    count: 1,
    worldPosition(e: number, out: [number, number, number]) {
      const p = positions[e];
      if (!p) return null;
      out[0] = p[0];
      out[1] = p[1];
      out[2] = p[2];
      return out;
    }
  };
}

describe('follow', () => {
  test('does nothing without camera.follow', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    const before = {
      eye: [...cam.eye] as [number, number, number],
      target: [...cam.target] as [number, number, number]
    };
    const source = makeSource({ 0: [5, 0, 5] });
    const out: [number, number, number] = [0, 0, 0];
    follow(cam, source, out, 0.016);
    expect(cam.eye).toEqual(before.eye);
    expect(cam.target).toEqual(before.target);
  });

  test('eases camera toward entity position', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.follow = { target: 1 as Entity, offset: [0, 10, 10], smoothing: 0.15 };
    const source = makeSource({ 1: [5, 0, 5] });
    const out: [number, number, number] = [0, 0, 0];
    // After one frame, target should move toward [5, 0, 5]
    follow(cam, source, out, 0.016);
    expect(cam.target[0]).toBeGreaterThan(0);
    expect(cam.target[0]).toBeLessThan(5);
    // Eye tracks target + offset
    expect(cam.eye[0]).toBeCloseTo(cam.target[0]! + 0, 5);
    expect(cam.eye[1]).toBeCloseTo(cam.target[1]! + 10, 5);
    expect(cam.eye[2]).toBeCloseTo(cam.target[2]! + 10, 5);
  });

  test('instant follow with smoothing=0', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.follow = { target: 1 as Entity, offset: [0, 10, 10], smoothing: 0 };
    const source = makeSource({ 1: [5, 0, 5] });
    const out: [number, number, number] = [0, 0, 0];
    follow(cam, source, out, 0.016);
    expect(cam.target[0]).toBeCloseTo(5, 5);
    expect(cam.target[1]).toBeCloseTo(0, 5);
    expect(cam.target[2]).toBeCloseTo(5, 5);
  });

  test('does nothing when entity not found', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.follow = { target: 99 as Entity, offset: [0, 10, 10] };
    const source = makeSource({});
    const out: [number, number, number] = [0, 0, 0];
    follow(cam, source, out, 0.016);
    // Unchanged
    expect(cam.target).toEqual([0, 0, 0]);
  });

  test('does nothing when source has no worldPosition', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.follow = { target: 1 as Entity, offset: [0, 10, 10] };
    const source: RenderSource = {
      matrices: new Float32Array(0),
      colors: new Float32Array(0),
      regions: new Float32Array(0),
      ranges: new Uint32Array(0),
      capacity: 10,
      count: 1
    };
    const out: [number, number, number] = [0, 0, 0];
    follow(cam, source, out, 0.016);
    expect(cam.target).toEqual([0, 0, 0]);
  });
});

describe('shake', () => {
  test('returns camera unchanged when shake is zero', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    const out = makeCamera([0, 0, 0], [0, 0, 0]);
    const result = shake(cam, out, 0.016);
    expect(result).toBe(cam); // returns the original camera object
  });

  test('returns camera unchanged when shake is very small', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.shake = 0.0001;
    const out = makeCamera([0, 0, 0], [0, 0, 0]);
    const result = shake(cam, out, 0.016);
    expect(result).toBe(cam);
    expect(cam.shake).toBe(0); // cleared
  });

  test('produces jittered output when shake is active', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.shake = 1.0;
    const out = makeCamera([0, 0, 0], [0, 0, 0]);
    const result = shake(cam, out, 0.016);
    expect(result).toBe(out); // returns the jittered copy
    // Shake should have decayed
    expect(cam.shake).toBeLessThan(1.0);
    expect(cam.shake).toBeGreaterThan(0);
    // FOV is preserved
    expect(out.fov).toBe(cam.fov);
  });

  test('shake decays over time', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.shake = 1.0;
    const out = makeCamera([0, 0, 0], [0, 0, 0]);
    shake(cam, out, 0.5);
    const after1 = cam.shake!;
    shake(cam, out, 0.5);
    const after2 = cam.shake!;
    expect(after1).toBeLessThan(1.0);
    expect(after2).toBeLessThan(after1);
  });

  test('jitter magnitude stays within shake strength', () => {
    const cam = makeCamera([0, 10, 10], [0, 0, 0]);
    cam.shake = 0.5;
    const out = makeCamera([0, 0, 0], [0, 0, 0]);
    // Run many times to statistically test jitter bounds
    for (let i = 0; i < 100; i++) {
      cam.shake = 0.5;
      shake(cam, out, 0.001); // tiny dt so shake barely decays
      for (let j = 0; j < 3; j++) {
        expect(Math.abs(out.eye[j]! - cam.eye[j]!)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(out.target[j]! - cam.target[j]!)).toBeLessThanOrEqual(0.5);
      }
    }
  });
});
