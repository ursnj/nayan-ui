// The game background pattern as plain data, with no renderer: three translucent rainbow gradients,
// floating shapes, large decorations and a faint 40pt grid, in window points and drawing order.
// Shared seeded geometry and colors keep the engine scenes and website pattern consistent.

export const PATTERN_RAINBOW = [
  '#E91E63',
  '#F44336',
  '#FF5722',
  '#FF9800',
  '#FFC107',
  '#8E24AA',
  '#CDDC39',
  '#8BC34A',
  '#4CAF50',
  '#009688',
  '#00BCD4',
  '#03A9F4',
  '#2196F3',
  '#3F51B5',
  '#9C27B0'
] as const;

const R = PATTERN_RAINBOW;

/** A linear gradient across the whole pattern: evenly spaced CSS color stops from `start` to `end`. */
export type PatternGradient = { start: [number, number]; end: [number, number]; colors: readonly string[] };

export type PatternShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; color: string }
  | { kind: 'rrect'; x: number; y: number; w: number; h: number; r: number; color: string }
  | { kind: 'diamond'; cx: number; cy: number; size: number; color: string };

export type PatternLine = { x: number; y: number; w: number; h: number };

export type GamePattern = {
  width: number;
  height: number;
  gradients: PatternGradient[];
  /** Floating shapes, then the large decorations, in drawing order. */
  shapes: PatternShape[];
  /** The faint grid, drawn last in `GRID_COLOR`. */
  grid: PatternLine[];
};

export const PATTERN_GRID_COLOR = 'rgba(0, 0, 0, 0.02)';

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const hexAlpha = (opacity: number) =>
  Math.floor(opacity * 255)
    .toString(16)
    .padStart(2, '0');

/** The pattern for a window `width` x `height` points. */
export function gamePattern(width: number, height: number): GamePattern {
  const gradients: PatternGradient[] = [
    {
      start: [0, 0],
      end: [width, height],
      colors: [`${R[0]}40`, `${R[2]}35`, `${R[4]}40`, `${R[6]}35`, `${R[8]}40`, `${R[10]}35`, `${R[12]}40`, `${R[14]}35`]
    },
    {
      start: [0, 0],
      end: [width / 2, height / 2],
      colors: [`${R[1]}25`, 'transparent', `${R[5]}25`, 'transparent', `${R[9]}25`, 'transparent', `${R[13]}25`, 'transparent']
    },
    { start: [width, 0], end: [0, height], colors: [`${R[3]}20`, 'transparent', `${R[7]}20`, 'transparent', `${R[11]}20`, 'transparent'] }
  ];

  const shapes: PatternShape[] = [];
  // Floating shapes: circle, square, tall rect, wide rect, diamond, in turn
  const count = 20;
  for (let i = 0; i < count; i++) {
    const x = (width / count) * i + Math.sin(i * 0.5) * 40 + seededRandom(i * 3 + 1) * 80;
    const y = (height / count) * i + Math.cos(i * 0.7) * 50 + seededRandom(i * 3 + 2) * 100;
    const size = 24 + seededRandom(i * 3 + 3) * 24;
    const color = `${R[i % R.length]}${hexAlpha(0.2 + Math.sin(i) * 0.1)}`;
    const px = Math.max(size, Math.min(width - size, x));
    const py = Math.max(size, Math.min(height - size, y));
    switch (i % 5) {
      case 0:
        shapes.push({ kind: 'circle', cx: px + size / 2, cy: py + size / 2, r: size / 2, color });
        break;
      case 1:
        shapes.push({ kind: 'rrect', x: px, y: py, w: size, h: size, r: size * 0.2, color });
        break;
      case 2:
        shapes.push({ kind: 'rrect', x: px, y: py, w: size * 0.55, h: size * 1.3, r: size * 0.12, color });
        break;
      case 3:
        shapes.push({ kind: 'rrect', x: px, y: py, w: size * 1.3, h: size * 0.55, r: size * 0.12, color });
        break;
      default:
        shapes.push({ kind: 'diamond', cx: px + size / 2, cy: py + size / 2, size, color });
    }
  }
  // Large decorations
  const deco = (i: number) => `${R[i]}30`;
  shapes.push(
    { kind: 'circle', cx: width * 0.1, cy: height * 0.15, r: 40, color: deco(0) },
    { kind: 'rrect', x: width * 0.85, y: height * 0.82, w: 70, h: 70, r: 14, color: deco(3) },
    { kind: 'diamond', cx: width * 0.85, cy: height * 0.2, size: 60, color: deco(8) },
    { kind: 'rrect', x: width * 0.1, y: height * 0.77, w: 90, h: 40, r: 8, color: deco(12) },
    { kind: 'circle', cx: width * 0.5, cy: height * 0.1, r: 25, color: deco(14) },
    { kind: 'rrect', x: width * 0.17, y: height * 0.47, w: 36, h: 64, r: 8, color: deco(6) },
    { kind: 'diamond', cx: width * 0.8, cy: height * 0.6, size: 56, color: deco(10) },
    { kind: 'rrect', x: width * 0.56, y: height * 0.87, w: 50, h: 50, r: 10, color: deco(1) },
    { kind: 'circle', cx: width * 0.3, cy: height * 0.25, r: 24, color: deco(4) },
    { kind: 'rrect', x: width * 0.66, y: height * 0.32, w: 56, h: 30, r: 6, color: deco(9) }
  );

  const grid: PatternLine[] = [];
  for (let i = 0; i < Math.floor(width / 40); i++) grid.push({ x: i * 40, y: 0, w: 1, h: height });
  for (let i = 0; i < Math.floor(height / 40); i++) grid.push({ x: 0, y: i * 40, w: width, h: 1 });

  return { width, height, gradients, shapes, grid };
}
