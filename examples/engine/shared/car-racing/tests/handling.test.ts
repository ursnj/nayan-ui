import { test } from "node:test";
import assert from "node:assert/strict";
import { stepSteering, sideImpactSpeed } from "../src/handling";
import { frontHit, overlapAcross } from "../src/footprint";

const body = { length: 4.36, halfWidth: () => 1 };

test("reference steering reaches 90% of the adjacent lane in under 0.4 seconds", () => {
  for (const fps of [30, 60, 120, 144]) {
    const car = { d: 0, target: 3.4, lateral: 0 };
    let arrival = Infinity;
    for (let frame = 0; frame < fps; frame++) {
      stepSteering(car, car.target, 1 / fps);
      if (car.d >= 3.06 && arrival === Infinity) arrival = (frame + 1) / fps;
    }
    assert.ok(arrival <= 0.4, `${fps} FPS took ${arrival}s`);
  }
});

test("reference steering caps lateral speed and settles at the requested lane", () => {
  const car = { d: 0, target: 3.4, lateral: 0 };
  for (let frame = 0; frame < 360; frame++) {
    stepSteering(car, car.target, 1 / 120);
    assert.ok(Math.abs(car.lateral) <= 15);
  }
  assert.ok(Math.abs(car.d - 3.4) < 0.001);
});

test("keyboard target movement responds without the removed bicycle-model delay", () => {
  const car = { d: 0, target: 0, lateral: 0 };
  for (let frame = 0; frame < 60; frame++) {
    car.target = Math.min(3.4, car.target + 15 / 120);
    stepSteering(car, car.target, 1 / 120);
  }
  assert.ok(car.d > 3, `Only reached ${car.d}m after half a second`);
});

test("steering reverses quickly while preserving the source easing", () => {
  const car = { d: 0, target: 3.4, lateral: 0 };
  for (let frame = 0; frame < 12; frame++) stepSteering(car, car.target, 1 / 120);
  const before = car.lateral;
  assert.ok(before > 0);
  stepSteering(car, -3.4, 1 / 120);
  assert.ok(car.lateral < before && car.lateral > -15);
  for (let frame = 0; frame < 60; frame++) stepSteering(car, -3.4, 1 / 120);
  assert.ok(car.d < -2.8);
});

test("reference footprint detection separates front hits from sideswipes", () => {
  assert.ok(overlapAcross(body, body, 4.2, 0) > 0);
  assert.ok(frontHit(body, body, 4.45, 4.2));
  assert.ok(overlapAcross(body, body, 0.8, 1.9) > 0);
  assert.equal(frontHit(body, body, 0.9, 0.8), false);
  assert.ok(overlapAcross(body, body, 0, 3.4) < 0);
});

test("solid side hits use relative closing speed on either side of the car", () => {
  assert.ok(sideImpactSpeed(6, 0, 1.7) >= 2.5);
  assert.ok(sideImpactSpeed(-6, 0, -1.7) >= 2.5);
  assert.equal(sideImpactSpeed(-6, 0, 1.7), 0);
  assert.equal(sideImpactSpeed(6, 6, 1.7), 0);
  assert.ok(sideImpactSpeed(0.8, 0, 1.7) < 2.5);
});
