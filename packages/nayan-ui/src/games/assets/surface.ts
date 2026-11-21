import type { Vec3 } from '../types';
import type { Geometry, SurfaceColor } from './shape';
import { recolor, smoothNormals } from './shape';

export interface ParametricSurfaceOptions {
  uSegments?: number;
  vSegments?: number;
  /** Match the first/last positions and smooth their normals, keeping separate 0/1 UVs. */
  wrapU?: boolean;
  wrapV?: boolean;
  color?: SurfaceColor;
}

/**
 * Samples an arbitrary surface on u/v in [0,1]. Winding follows dP/du cross dP/dv.
 * Use for terrain, cloth, wings, twisted ribbons and custom mathematical forms. Wrapped edges
 * retain texture seams; coincident pole vertices share normals. Degenerate triangles are omitted.
 */
export function parametricSurface(sample: (u: number, v: number) => Vec3, options: ParametricSurfaceOptions = {}): Geometry {
  const nu = options.uSegments ?? 32,
    nv = options.vSegments ?? 16;
  if (![nu, nv].every((n) => Number.isInteger(n) && n >= 1 && n <= 1024) || (nu + 1) * (nv + 1) > 1_000_000)
    throw new Error('parametricSurface: invalid segments or surface exceeds one million vertices');
  const vertices = new Float32Array((nu + 1) * (nv + 1) * 11);
  for (let y = 0; y <= nv; y++)
    for (let x = 0; x <= nu; x++) {
      const u = x / nu,
        v = y / nv;
      const p = sample(options.wrapU && x === nu ? 0 : u, options.wrapV && y === nv ? 0 : v);
      if (p.some((c) => !Number.isFinite(c))) throw new Error('parametricSurface: sample returned a non-finite position');
      vertices.set([p[0], p[1], p[2], 0, 1, 0, 1, 1, 1, u, v], (y * (nu + 1) + x) * 11);
    }
  const indices: number[] = [];
  const triangle = (a: number, b: number, c: number) => {
    const v = vertices;
    const oa = a * 11,
      ob = b * 11,
      oc = c * 11;
    const x1 = v[ob]! - v[oa]!,
      y1 = v[ob + 1]! - v[oa + 1]!,
      z1 = v[ob + 2]! - v[oa + 2]!;
    const x2 = v[oc]! - v[oa]!,
      y2 = v[oc + 1]! - v[oa + 1]!,
      z2 = v[oc + 2]! - v[oa + 2]!;
    if (Math.hypot(y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2) > 0) indices.push(a, b, c);
  };
  for (let y = 0; y < nv; y++)
    for (let x = 0; x < nu; x++) {
      const a = y * (nu + 1) + x,
        b = a + nu + 1;
      triangle(a, a + 1, b);
      triangle(a + 1, b + 1, b);
    }
  const geometry = smoothNormals({
    vertices,
    indices: new Uint32Array(indices)
  });
  return options.color
    ? recolor(geometry, typeof options.color === 'function' ? options.color : () => options.color as readonly [number, number, number])
    : geometry;
}
