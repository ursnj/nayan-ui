import { expect, test } from 'bun:test';
import { resolveColor, resolveColors, toColor } from '../color';

const bytes = (c: readonly number[]) => c.map((v) => Math.round(v * 255));

test('toColor reads hex, short hex, rgb(a), names and tuples', () => {
  expect(bytes(toColor('#FF4757'))).toEqual([255, 71, 87, 255]);
  expect(bytes(toColor('#f00'))).toEqual([255, 0, 0, 255]);
  expect(bytes(toColor('#f008'))).toEqual([255, 0, 0, 136]);
  expect(bytes(toColor('#00ff0080'))).toEqual([0, 255, 0, 128]);
  expect(toColor('rgba(255, 0, 0, 0.5)')).toEqual([1, 0, 0, 0.5]);
  expect(toColor('rgb(0,0,255)')).toEqual([0, 0, 1, 1]);
  expect(toColor('rgba(0, 0, 0, 50%)')).toEqual([0, 0, 0, 0.5]);
  expect(toColor(' White ')).toEqual([1, 1, 1, 1]);
  expect(toColor('transparent')).toEqual([0, 0, 0, 0]);
  expect(toColor([2, 1, 0.5])).toEqual([2, 1, 0.5, 1]);
});

test('toColor multiplies alpha and returns a fresh tuple each time', () => {
  expect(toColor('#ffffff80', 0.5)[3]).toBeCloseTo(128 / 255 / 2);
  const first = toColor('#123456');
  first[0] = 9;
  expect(toColor('#123456')[0]).toBeCloseTo(0x12 / 255);
});

test('invalid colors throw a helpful error', () => {
  expect(() => toColor('#12345')).toThrow('is not a color');
  expect(() => toColor('blu')).toThrow("'#RRGGBB'");
});

test('resolveColor keeps tuples and resolveColors handles one or several inputs', () => {
  const tuple = [1, 0, 0] as const;
  expect(resolveColor(tuple)).toBe(tuple);
  expect(resolveColors(tuple)).toEqual([tuple]);
  expect(resolveColors('#000')).toEqual([[0, 0, 0, 1]]);
  expect(resolveColors(['#fff', tuple])).toEqual([[1, 1, 1, 1], tuple]);
});
