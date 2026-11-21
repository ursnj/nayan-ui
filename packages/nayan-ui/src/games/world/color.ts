// Colors: every engine option that takes a color accepts either a linear 0..1 tuple or a CSS color
// string, so theme colors go straight in: `world.spawn({ color: '#FF4757' })`.
import type { Color } from './types';

/** A color as an option takes it: `[r, g, b]` / `[r, g, b, a]` (0..1, channels above 1 glow) or a CSS string. */
export type ColorInput = Color | string;

type Rgba = readonly [number, number, number, number];

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i;
const NAMED: Record<string, Rgba> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [1, 1, 1, 1],
  red: [1, 0, 0, 1],
  green: [0, 128 / 255, 0, 1],
  blue: [0, 0, 1, 1],
  yellow: [1, 1, 0, 1],
  orange: [1, 165 / 255, 0, 1],
  purple: [128 / 255, 0, 128 / 255, 1],
  gray: [128 / 255, 128 / 255, 128 / 255, 1],
  grey: [128 / 255, 128 / 255, 128 / 255, 1]
};

// Theme colors repeat endlessly; parse each string once.
const parsed = new Map<string, Rgba>();
const PARSED_LIMIT = 1024;

function parse(css: string): Rgba {
  const text = css.trim();
  const named = NAMED[text.toLowerCase()];
  if (named) return named;
  const hex = HEX.exec(text);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('');
    const n = (i: number) => parseInt(digits.slice(i, i + 2), 16) / 255;
    return [n(0), n(2), n(4), digits.length === 8 ? n(6) : 1];
  }
  const rgb = RGB.exec(text);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4]);
    return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255, alpha];
  }
  throw new Error(`nayan-ui: "${css}" is not a color (use '#RRGGBB', '#RGB', '#RRGGBBAA', 'rgb(…)', 'rgba(…)' or a 0..1 tuple)`);
}

/**
 * Any color input as an `[r, g, b, a]` tuple (0..1), with its alpha multiplied by `alpha`. Use it when
 * you need the numbers (to brighten, mix or fade a theme color); options take strings directly.
 *
 * ```ts
 * toColor('#FF4757'); // [1, 0.278, 0.341, 1]
 * toColor('#FF4757', 0.5); // half see-through
 * ```
 */
export function toColor(color: ColorInput, alpha = 1): [number, number, number, number] {
  let c: Color;
  if (typeof color === 'string') {
    let hit = parsed.get(color);
    if (!hit) {
      hit = parse(color);
      if (parsed.size >= PARSED_LIMIT) parsed.clear();
      parsed.set(color, hit);
    }
    c = hit;
  } else c = color;
  return [c[0], c[1], c[2], (c[3] ?? 1) * alpha];
}

/** A color input as a tuple, without copying tuples (the hot path of `spawn`, `set` and `animate`). */
export function resolveColor(color: ColorInput): Color {
  return typeof color === 'string' ? toColor(color) : color;
}

/** One color input, or a list to pick from, as tuples. */
export function resolveColors(colors: ColorInput | readonly ColorInput[]): readonly Color[] {
  if (typeof colors === 'string') return [toColor(colors)];
  if (typeof colors[0] === 'number') return [colors as Color];
  return (colors as readonly ColorInput[]).map(resolveColor);
}
