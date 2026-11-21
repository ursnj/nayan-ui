import { expect, mock, test } from 'bun:test';
mock.module('../../../native/NativeNayanEngine', () => ({ default: null }));
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  Image: { resolveAssetSource: () => null }
}));
const { Path } = await import('../shape');

test('SVG scientific notation is a number, including implicit relative coordinates', () => {
  const path = Path.fromSVG('M1e-3 -2E+1 3e0 4e0 l1e1 -2e0 h2e0 v3e0 Z');
  expect(path.toContours()[0]).toEqual([
    [0.001, -20],
    [3, 4],
    [13, 2],
    [15, 2],
    [15, 5]
  ]);
});

test('transform copies its construction cursor so appended curves start at the transformed endpoint', () => {
  const original = new Path().moveTo(1, 1).lineTo(2, 1);
  const moved = original.transform(2, 3, 4, 5).quadraticTo(9, 8, 10, 8);
  const contour = moved.toContours()[0]!;
  expect(contour[0]).toEqual([6, 8]);
  expect(contour[1]).toEqual([8, 8]);
  expect(contour[2]![0]).toBeGreaterThan(8);
  expect(contour[2]![1]).toBeCloseTo(8, 12);
  expect(original.toContours()).toEqual([
    [
      [1, 1],
      [2, 1]
    ]
  ]);
});

test('every absolute and relative SVG command matches an explicitly constructed path', () => {
  const svg = Path.fromSVG(
    'M0 0 L2 0 H3 V1 C3 2 4 2 4 1 S5 0 5 1 Q6 2 7 1 T9 1 A1 1 0 0 1 10 2 Z m1 1 l1 0 h1 v1 c0 1 1 1 1 0 s1 -1 1 0 q1 1 2 0 t2 0 a1 1 0 0 1 1 1 z'
  );
  const explicit = new Path()
    .moveTo(0, 0)
    .lineTo(2, 0)
    .lineTo(3, 0)
    .lineTo(3, 1)
    .cubicTo(3, 2, 4, 2, 4, 1)
    .cubicTo(4, 0, 5, 0, 5, 1)
    .quadraticTo(6, 2, 7, 1)
    .quadraticTo(8, 0, 9, 1)
    .arcTo(1, 1, 0, false, true, 10, 2)
    .close()
    .moveTo(1, 1)
    .lineTo(2, 1)
    .lineTo(3, 1)
    .lineTo(3, 2)
    .cubicTo(3, 3, 4, 3, 4, 2)
    .cubicTo(4, 1, 5, 1, 5, 2)
    .quadraticTo(6, 3, 7, 2)
    .quadraticTo(8, 1, 9, 2)
    .arcTo(1, 1, 0, false, true, 10, 3)
    .close();
  expect(svg.toContours()).toEqual(explicit.toContours());
});

test('smooth commands without a compatible preceding curve use the current point', () => {
  expect(Path.fromSVG('M1 1 S2 2 3 1 T5 1').toContours()).toEqual(
    new Path().moveTo(1, 1).cubicTo(1, 1, 2, 2, 3, 1).quadraticTo(3, 1, 5, 1).toContours()
  );
});

test('empty paths, duplicate close, open polygons and returned contour copies stay independent', () => {
  expect(new Path().close().addPolygon([]).bounds()).toBeUndefined();
  expect(Path.fromSVG('').toContours()).toEqual([]);
  const path = new Path().addPolygon(
    [
      [0, 0],
      [1, 0],
      [1, 1]
    ],
    false
  );
  const copy = path.toContours();
  copy[0]![0]![0] = 999;
  expect(path.bounds()).toEqual([0, 0, 1, 1]);
  path.close().close().lineTo(2, 2);
  expect(path.toContours()[1]).toEqual([
    [0, 0],
    [2, 2]
  ]);
});

test.each([0, 0.1, 2, [0.2, 0.4] as const].map((radius) => ({ radius })))(
  'rounded rectangles accept radius %j and stay within their box',
  ({ radius }) => {
    const path = new Path().addRoundedRect(2, 3, 4, 6, radius);
    const bounds = path.bounds()!;
    expect(bounds[0]).toBeCloseTo(2);
    expect(bounds[1]).toBeCloseTo(3);
    expect(bounds[2]).toBeCloseTo(6);
    expect(bounds[3]).toBeCloseTo(9);
  }
);

test('circles, ellipses, stars and polygons preserve their documented topology', () => {
  expect(new Path().addCircle(1, 2, 3).bounds()).toEqual([-2, -1, 4, 5]);
  expect(new Path().addOval(1, 2, 6, 8).bounds()).toEqual([1, 2, 7, 10]);
  expect(new Path().addStar(0, 0, 2, 1).toContours()[0]).toHaveLength(10);
  expect(new Path().addRegularPolygon(0, 0, 2, 6).toContours()[0]).toHaveLength(6);
});

test.each(['2 3', 'M1', 'M0 0 X1 2', 'M0 0 LZ', 'M0 0 Z 1', 'M0 0 @L1 1', 'M1e999 0'])('malformed SVG %s rejects with useful context', (input) => {
  expect(() => Path.fromSVG(input)).toThrow('Path.fromSVG');
});

test.each(
  (
    [
      [0, 1, 0, false, true, 1, 0],
      [1, 1, 0, false, true, 0, 0],
      [0.1, 0.2, 0.3, true, false, 4, 2]
    ] as const
  ).map((args) => ({ args }))
)('arcs handle zero radii, coincident endpoints and radius correction (%j)', ({ args }) => {
  const path = new Path().moveTo(0, 0).arcTo(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
  expect(path.toContours().flat(2).every(Number.isFinite)).toBe(true);
});

test('large outlines compute bounds without spreading point arrays onto the call stack', () => {
  const path = new Path().moveTo(0, 0);
  for (let i = 1; i <= 150_000; i++) path.lineTo(i, -i);
  expect(path.bounds()).toEqual([0, -150_000, 150_000, 0]);
});
