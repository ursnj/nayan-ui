import type { Vec3 } from '@nayan-ui/engine';

// The bundled 64x128 facade has 8-pixel columns and 10-pixel rows. The final row is clipped;
// these masks identify the complete warm-lit windows in that exact texture (top row first).
const LIT_ROWS = [18, 132, 131, 192, 101, 130, 43, 0, 112, 144, 21, 32];

// Match the engine cube's UV basis on each vertical face. V=0 is at the top of the building.
const FACES: { normal: Vec3; right: Vec3 }[] = [
  { normal: [1, 0, 0], right: [0, 0, -1] },
  { normal: [-1, 0, 0], right: [0, 0, 1] },
  { normal: [0, 0, 1], right: [1, 0, 0] },
  { normal: [0, 0, -1], right: [-1, 0, 0] }
];

export function* facadeWindowQuads(): Iterable<{
  corners: [Vec3, Vec3, Vec3, Vec3];
  normal: Vec3;
}> {
  for (const face of FACES) {
    const point = (u: number, v: number): Vec3 => [
      face.normal[0] * 0.5005 + face.right[0] * (u - 0.5),
      0.5 - v,
      face.normal[2] * 0.5005 + face.right[2] * (u - 0.5)
    ];
    for (let row = 0; row < LIT_ROWS.length; row++) {
      for (let col = 0; col < 8; col++) {
        if (!(LIT_ROWS[row]! & (1 << col))) continue;
        // Half-texel inset keeps the light inside the glass, clear of filtering at the concrete edge.
        const u0 = (col * 8 + 2.5) / 64,
          u1 = (col * 8 + 6.5) / 64;
        const v0 = (row * 10 + 3.5) / 128,
          v1 = (row * 10 + 8.5) / 128;
        yield {
          normal: face.normal,
          corners: [point(u0, v0), point(u1, v0), point(u1, v1), point(u0, v1)]
        };
      }
    }
  }
}
