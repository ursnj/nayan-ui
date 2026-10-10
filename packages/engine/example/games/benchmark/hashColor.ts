/** Deterministic bright-ish color per index, as [r, g, b] in 0..1. */
export function hashColor(i: number): [number, number, number] {
  const h = Math.imul(i, 2654435761) >>> 0;
  return [
    ((h >>> 0) & 255) / 255 * 0.7 + 0.3,
    ((h >>> 8) & 255) / 255 * 0.7 + 0.3,
    ((h >>> 16) & 255) / 255 * 0.7 + 0.3,
  ];
}
