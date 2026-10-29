import { test } from "node:test";
import assert from "node:assert/strict";
import type { Camera } from "@nayan-ui/engine";
import { createChase, updateChase } from "../src/chase";
const near = (a: number, b: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test("camera translates with the car without lag at 30, 60, 120 and 144 FPS", () => {
  for (const fps of [30, 60, 120, 144]) {
    const state = createChase();
    const camera: Camera = { eye: [0, 0, 0], target: [0, 0, 0], fov: 0.95 };
    for (let frame = 0; frame < fps * 4; frame++) {
      const distance = (frame / fps) * 20;
      updateChase(state, camera, [0, 0.6, -distance], [0, 3.2, 9], [0, 0.5, -12], 1 / fps);
      near(camera.eye[2] + distance, 9);
      near(camera.target[2] + distance, -12);
      near(camera.eye[1], 3.8);
      near(camera.fov, 0.95);
    }
  }
});

test("offset transitions smooth equally across display rates without overshooting", () => {
  const run = (fps: number) => {
    const state = createChase();
    const camera: Camera = { eye: [0, 0, 0], target: [0, 0, 0], fov: 0.95 };
    updateChase(state, camera, [0, 0, 0], [6, 3, 6], [0, 0.2, 0], 0);
    for (let i = 0; i < fps; i++) {
      updateChase(state, camera, [0, 0, -i], [0, 3.2, 9], [0, 0.5, -12], 1 / fps);
      assert.ok(state.eye[0] >= 0 && state.eye[0] <= 6);
      assert.ok(state.eye[2] >= 6 && state.eye[2] <= 9);
    }
    return state;
  };
  const a = run(30),
    b = run(144);
  for (let axis = 0; axis < 3; axis++) {
    near(a.eye[axis]!, b.eye[axis]!);
    near(a.target[axis]!, b.target[axis]!);
  }
});
