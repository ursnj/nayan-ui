import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { facadeWindowQuads } from '../src/CarRacingFacade';

// Read the actual bundled indexed PNG rather than duplicating its lit-window mask in the test.
function facadePixels() {
  const png = readFileSync(new URL('../assets/textures/facade.png', import.meta.url));
  const width = png.readUInt32BE(16),
    height = png.readUInt32BE(20);
  assert.equal(png[24], 8, "expected the facade's 8-bit palette");
  assert.equal(png[25], 3, 'expected an indexed facade PNG');
  let palette: Buffer | undefined;
  const compressed: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset),
      kind = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (kind === 'PLTE') palette = data;
    if (kind === 'IDAT') compressed.push(data);
    offset += length + 12;
  }
  assert.ok(palette);
  const raw = inflateSync(Buffer.concat(compressed)),
    pixels = new Uint8Array(width * height);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const filter = raw[y * (width + 1)]!;
      const left = x ? pixels[y * width + x - 1]! : 0;
      const up = y ? pixels[(y - 1) * width + x]! : 0;
      const corner = x && y ? pixels[(y - 1) * width + x - 1]! : 0;
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, corner)][filter];
      assert.notEqual(predictor, undefined);
      pixels[y * width + x] = (raw[y * (width + 1) + x + 1]! + predictor!) & 255;
    }
  return {
    width,
    height,
    color: (x: number, y: number) => {
      const start = pixels[y * width + x]! * 3;
      return [...palette.subarray(start, start + 3)];
    }
  };
}
const image = facadePixels();

// Inverse of the engine cube's vertical-face UV orientation, including opposite-face mirroring.
function uv(point: readonly number[], normal: readonly number[]) {
  const u = normal[0]! > 0 ? 0.5 - point[2]! : normal[0]! < 0 ? 0.5 + point[2]! : normal[2]! > 0 ? 0.5 + point[0]! : 0.5 - point[0]!;
  return [u, 0.5 - point[1]!] as const;
}

test('all four light-panel faces lie wholly inside warm window pixels', () => {
  for (const { corners, normal } of facadeWindowQuads()) {
    for (const point of corners) {
      const [u, v] = uv(point, normal);
      assert.deepEqual(image.color(Math.floor(u * image.width), Math.floor(v * image.height)), [235, 214, 150]);
    }
  }
});

test('each face lights exactly the complete warm windows present in the facade texture', () => {
  const expected = new Set<string>();
  for (let row = 0; row * 10 + 8 < image.height; row++)
    for (let col = 0; col < image.width / 8; col++) {
      if (image.color(col * 8 + 4, row * 10 + 5)[0]! > 220) expected.add(`${col},${row}`);
    }
  assert.ok(expected.size > 0);
  const faces = new Map<string, Set<string>>();
  for (const { corners, normal } of facadeWindowQuads()) {
    const [u0, v0] = uv(corners[0], normal),
      [u1, v1] = uv(corners[2], normal);
    const cell = `${Math.floor((((u0 + u1) / 2) * image.width) / 8)},${Math.floor((((v0 + v1) / 2) * image.height) / 10)}`;
    const key = normal.join(',');
    if (!faces.has(key)) faces.set(key, new Set());
    assert.ok(!faces.get(key)!.has(cell), 'duplicate light panel');
    faces.get(key)!.add(cell);
  }
  assert.equal(faces.size, 4);
  for (const cells of faces.values()) assert.deepEqual(cells, expected);
});
