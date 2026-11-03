import { expect, test } from 'bun:test';
import { CAR, metresLeft, touching } from '../src/CarRacingRules';

test('cars touch only when they overlap across and along the road', () => {
  expect(touching(0, 0, 0, 0)).toBe(true);
  expect(touching(0, 0, CAR.width * 0.8, CAR.length * 0.8)).toBe(true);
  expect(touching(0, 0, CAR.width, 0)).toBe(false); // the next lane
  expect(touching(0, 0, 0, CAR.length)).toBe(false); // just ahead
});

test('the distance left counts down in 10 m steps and stops at zero', () => {
  expect(metresLeft(1500, 0)).toBe(1500);
  expect(metresLeft(1500, -3)).toBe(1500);
  expect(metresLeft(1500, -12)).toBe(1490);
  expect(metresLeft(1500, -1600)).toBe(0);
});
