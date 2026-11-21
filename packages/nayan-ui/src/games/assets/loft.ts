import type { Vec3 } from '../types';
import type { Color } from '../world/types';
import { FieldFunction } from './procedural';
import { type Geometry, lathe, merge, nativeSweep, recolor } from './shape';

export interface LoftSection {
  z: number;
  bottom: number;
  top: number;
  /** Half the width at the lower corners. */
  width: number;
  topWidth?: number;
  /** Superellipse exponent, 2 = oval, larger values = boxier corners. Default 4. */
  square?: number;
}

export interface LoftOptions {
  around?: number;
  smoothness?: number;
  /** One color, a function of position and normal, or a `surfaceColor` field function (native). */
  color?: Color | ((position: Vec3, normal: Vec3) => Color) | FieldFunction;
}

type Fields = [number, number, number, number, number, number];

/**
 * Smooth closed body through rounded rectangular cross sections along Z. Useful for vehicle
 * shells, cabins, shoes and fairings. Caps have separate flat normals and planar UVs; sides have
 * continuous longitudinal UVs and a welded seam. Input sections may increase or decrease in Z.
 */
export function loft(sections: readonly LoftSection[], options: LoftOptions = {}): Geometry {
  if (
    sections.length < 2 ||
    sections.some(
      (s) =>
        ![s.z, s.bottom, s.top, s.width, s.topWidth ?? s.width, s.square ?? 4].every(Number.isFinite) ||
        s.width < 0 ||
        (s.topWidth ?? s.width) < 0 ||
        s.top <= s.bottom ||
        (s.square ?? 4) < 1
    )
  )
    throw new Error('loft: needs at least two valid cross sections');
  const ordered = sections[0]!.z > sections[sections.length - 1]!.z ? [...sections].reverse() : sections;
  if (ordered.some((s, i) => i > 0 && s.z <= ordered[i - 1]!.z)) throw new Error('loft: sections must be ordered along Z');
  const n = options.around ?? 32,
    steps = options.smoothness ?? 4;
  if (!Number.isInteger(n) || n < 6 || n > 512 || !Number.isInteger(steps) || steps < 1 || steps > 64)
    throw new Error('loft: invalid around/smoothness');
  const values = ordered.map((s): Fields => [s.z, s.bottom, s.top, s.width, s.topWidth ?? s.width, s.square ?? 4]);
  const color = options.color;
  const g = nativeSweep({
    kind: 'loft',
    sections: values,
    around: n,
    smoothness: steps,
    color: typeof color === 'function' || color instanceof FieldFunction || !color ? undefined : [color[0], color[1], color[2]],
    colorField: color instanceof FieldFunction ? color : undefined
  });
  return typeof color === 'function' ? paint(g, color) : g;
}

function paint(geometry: Geometry, color?: LoftOptions['color']): Geometry {
  if (!color) return geometry;
  if (color instanceof FieldFunction) return recolor(geometry, color);
  return recolor(geometry, typeof color === 'function' ? ({ position, normal }) => color(position, normal) : () => color);
}

/** A rounded rectangular cross-section with flat front/back caps, centered at the origin. */
export function block(w: number, h: number, d: number, square = 6, color?: LoftOptions['color']): Geometry {
  return loft(
    [
      { z: -d / 2, bottom: -h / 2, top: h / 2, width: w / 2, square },
      { z: d / 2, bottom: -h / 2, top: h / 2, width: w / 2, square }
    ],
    { around: 16, smoothness: 1, color }
  );
}

/** An exact ellipsoid with analytic normals, rather than capped/truncated poles. */
export function ellipsoid(radii: Vec3, color?: LoftOptions['color'], around = 16): Geometry {
  if (radii.some((r) => !Number.isFinite(r) || r <= 0)) throw new Error('ellipsoid: radii must be positive');
  const profile = Array.from({ length: 9 }, (_, i): [number, number] => [
    i === 0 || i === 8 ? 0 : Math.sin((i * Math.PI) / 8),
    Math.cos((i * Math.PI) / 8)
  ]);
  return paint(merge([{ geometry: lathe(profile, { segments: around }), scale: radii }]), color);
}

/** Smooth Hermite interpolation through increasing [x,value] points; clamped beyond the ends. */
export function smoothCurve(points: readonly (readonly [number, number])[]): (x: number) => number {
  if (points.length < 2 || points.some((p, i) => !p.every(Number.isFinite) || (i > 0 && p[0] <= points[i - 1]![0])))
    throw new Error('smoothCurve: needs increasing finite points');
  const n = points.length;
  const slope = (i: number) => {
    const a = points[Math.max(0, i - 1)]!,
      b = points[Math.min(n - 1, i + 1)]!;
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  return (x) => {
    if (x <= points[0]![0]) return points[0]![1];
    if (x >= points[n - 1]![0]) return points[n - 1]![1];
    let i = 0;
    while (points[i + 1]![0] < x) i++;
    const [x0, y0] = points[i]!,
      [x1, y1] = points[i + 1]!,
      h = x1 - x0,
      t = (x - x0) / h;
    return (
      (2 * t * t * t - 3 * t * t + 1) * y0 +
      (t * t * t - 2 * t * t + t) * h * slope(i) +
      (-2 * t * t * t + 3 * t * t) * y1 +
      (t * t * t - t * t) * h * slope(i + 1)
    );
  };
}
