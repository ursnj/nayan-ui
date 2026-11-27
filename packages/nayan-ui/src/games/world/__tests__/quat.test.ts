import { expect, test } from 'bun:test';
import { quat } from '../quat';

const close = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));

test('axis rotations match axisAngle and compose like the shared game helper', () => {
  close(quat.y(1.2), quat.axisAngle(0, 1, 0, 1.2));
  close(quat.x(0.4), quat.axisAngle(1, 0, 0, 0.4));
  close(quat.z(-2), quat.axisAngle(0, 0, 1, -2));
  close(quat.multiply(quat.y(0.5), quat.y(0.25)), quat.y(0.75));
  close(quat.multiply(quat.identity, quat.x(1)), quat.x(1));
});

test('fromEuler turns around x, then y, then z', () => {
  const [x, y, z] = [0.3, -1.1, 2.2];
  close(quat.fromEuler(x, y, z), quat.multiply(quat.z(z), quat.multiply(quat.y(y), quat.x(x))));
});

test('out parameters are reused, including aliasing an input', () => {
  const out: [number, number, number, number] = [9, 9, 9, 9];
  expect(quat.y(1, out)).toBe(out);
  expect(quat.multiply(out, quat.y(1), out)).toBe(out);
  close(out, quat.y(2));
});

test('slerp follows the shortest arc and stays normalized', () => {
  close(quat.slerp(quat.y(0), quat.y(1), 0.5), quat.y(0.5));
  const flipped = quat.y(1).map((v) => -v) as unknown as [number, number, number, number];
  close(quat.slerp(quat.y(0), flipped, 0.5), quat.y(0.5));
  const q = quat.slerp(quat.x(0.2), quat.z(1.4), 0.3);
  expect(Math.hypot(...q)).toBeCloseTo(1, 6);
  close(quat.slerp(quat.x(0.2), quat.x(0.2000001), 0.5), quat.x(0.2));
});
