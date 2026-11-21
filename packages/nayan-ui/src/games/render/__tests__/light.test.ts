import { expect, test } from 'bun:test';
import { frontLight } from '../light';

test('frontLight lights a camera-facing surface at exactly 1, without shadows', () => {
  const light = frontLight([-0.45, 0.6, 1], 0.5);
  const [x, y, z] = light.direction;
  const facing = z / Math.hypot(x, y, z);
  const k = (light.color as readonly number[])[0]!;
  expect(k * (light.ambient * 0.8 + (1 - light.ambient) * facing)).toBeCloseTo(1, 10);
  expect(light.shadows).toBe(false);
});
