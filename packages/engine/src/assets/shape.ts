// Custom shapes: Skia-style 2D paths, and solids built from them (extrusions, lathes, tubes, merged
// parts) that draw, collide and pick like loaded models.
import NativeEngine from "../native/NativeNayanEngine";
import { Builder, meshInfo, registerMesh, VERTEX_FLOATS, type MeshGeometry } from "../render/meshes";
import { SHAPE_MESH, type Shape, type Vec3 } from "../types";
import type { Color, Quat } from "../world/World";
import { nativeGeometry, type Model } from "./model";

const TAU = Math.PI * 2;

type P2 = [number, number];

/** Line segments per curve, arc or circle quarter when a path is flattened. */
const CURVE_STEPS = 12;

/**
 * A 2D outline, built like Skia's `SkPath` (or an SVG path): x right, y down. Solids made from it
 * (`extrude`, `lathe`) are flipped upright, so a path drawn the way it looks on screen stands the
 * same way in the world. Coordinates are in world units: a 1 x 1 path makes a 1 unit wide shape.
 *
 * ```ts
 * const heart = Path.fromSVG("M0.5 0.9 C0 0.5 0 0.1 0.25 0.1 C0.4 0.1 0.5 0.25 0.5 0.3 C0.5 0.25 0.6 0.1 0.75 0.1 C1 0.1 1 0.5 0.5 0.9 Z");
 * const star = new Path().addStar(0, 0, 0.5, 0.22, 5);
 * ```
 */
export class Path {
  private contours: { points: P2[]; closed: boolean }[] = [];
  private start: P2 = [0, 0];
  private last: P2 = [0, 0];

  private get current() {
    let c = this.contours[this.contours.length - 1];
    if (!c || c.closed) {
      c = { points: [[...this.last]], closed: false };
      this.start = [...this.last];
      this.contours.push(c);
    }
    return c;
  }

  private add(x: number, y: number) {
    this.current.points.push([x, y]);
    this.last = [x, y];
  }

  /** Starts a new contour at (x, y). */
  moveTo(x: number, y: number): this {
    const c = this.contours[this.contours.length - 1];
    if (c && !c.closed && c.points.length === 1) this.contours.pop(); // a moveTo replaces a lone point
    this.contours.push({ points: [[x, y]], closed: false });
    this.start = [x, y];
    this.last = [x, y];
    return this;
  }

  lineTo(x: number, y: number): this {
    this.add(x, y);
    return this;
  }

  /** A quadratic Bézier through control point (cx, cy) to (x, y). */
  quadTo(cx: number, cy: number, x: number, y: number): this {
    const [x0, y0] = this.last;
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS;
      const u = 1 - t;
      this.add(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y);
    }
    return this;
  }

  /** A cubic Bézier through control points (c1x, c1y) and (c2x, c2y) to (x, y). */
  cubicTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this {
    const [x0, y0] = this.last;
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS;
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      this.add(a * x0 + b * c1x + c * c2x + d * x, a * y0 + b * c1y + c * c2y + d * y);
    }
    return this;
  }

  /**
   * An elliptical arc to (x, y), as in SVG's `A` command: radii rx, ry, the ellipse turned `rotation`
   * radians, and the flags choosing which of the four possible arcs.
   */
  arcTo(rx: number, ry: number, rotation: number, largeArc: boolean, sweep: boolean, x: number, y: number): this {
    const [x0, y0] = this.last;
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    if (rx < 1e-9 || ry < 1e-9 || (x0 === x && y0 === y)) return this.lineTo(x, y);
    // Endpoint to center parameterization (SVG implementation notes, F.6.5).
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const dx = (x0 - x) / 2;
    const dy = (y0 - y) / 2;
    const x1 = cos * dx + sin * dy;
    const y1 = -sin * dx + cos * dy;
    const grow = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
    if (grow > 1) {
      rx *= Math.sqrt(grow);
      ry *= Math.sqrt(grow);
    }
    const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
    const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
    const k = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
    const cx1 = (k * rx * y1) / ry;
    const cy1 = (-k * ry * x1) / rx;
    const cx = cos * cx1 - sin * cy1 + (x0 + x) / 2;
    const cy = sin * cx1 + cos * cy1 + (y0 + y) / 2;
    const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const start = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
    let delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
    if (!sweep && delta > 0) delta -= TAU;
    if (sweep && delta < 0) delta += TAU;
    const steps = Math.max(2, Math.ceil((Math.abs(delta) / (Math.PI / 2)) * CURVE_STEPS));
    for (let i = 1; i <= steps; i++) {
      const t = start + (delta * i) / steps;
      const ex = rx * Math.cos(t);
      const ey = ry * Math.sin(t);
      if (i === steps) this.add(x, y);
      else this.add(cos * ex - sin * ey + cx, sin * ex + cos * ey + cy);
    }
    return this;
  }

  /** Closes the current contour back to its first point. */
  close(): this {
    const c = this.contours[this.contours.length - 1];
    if (c && !c.closed) {
      c.closed = true;
      this.last = [...this.start];
    }
    return this;
  }

  /** A closed polygon through `points`. */
  addPoly(points: readonly (readonly [number, number])[], close = true): this {
    if (!points.length) return this;
    this.moveTo(points[0]![0], points[0]![1]);
    for (let i = 1; i < points.length; i++) this.lineTo(points[i]![0], points[i]![1]);
    return close ? this.close() : this;
  }

  addRect(x: number, y: number, width: number, height: number): this {
    return this.addPoly([[x, y], [x + width, y], [x + width, y + height], [x, y + height]]);
  }

  /** A rectangle with corners rounded by `radius` (or [rx, ry]). */
  addRRect(x: number, y: number, width: number, height: number, radius: number | readonly [number, number]): this {
    let [rx, ry] = typeof radius === "number" ? [radius, radius] : radius;
    rx = Math.min(Math.abs(rx), width / 2);
    ry = Math.min(Math.abs(ry), height / 2);
    if (rx < 1e-9 || ry < 1e-9) return this.addRect(x, y, width, height);
    return this.moveTo(x + rx, y)
      .lineTo(x + width - rx, y)
      .arcTo(rx, ry, 0, false, true, x + width, y + ry)
      .lineTo(x + width, y + height - ry)
      .arcTo(rx, ry, 0, false, true, x + width - rx, y + height)
      .lineTo(x + rx, y + height)
      .arcTo(rx, ry, 0, false, true, x, y + height - ry)
      .lineTo(x, y + ry)
      .arcTo(rx, ry, 0, false, true, x + rx, y)
      .close();
  }

  /** An ellipse filling the box. */
  addOval(x: number, y: number, width: number, height: number): this {
    const rx = width / 2;
    const ry = height / 2;
    const cx = x + rx;
    const cy = y + ry;
    const steps = CURVE_STEPS * 4;
    const points: P2[] = [];
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * TAU;
      points.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
    }
    return this.addPoly(points);
  }

  addCircle(cx: number, cy: number, radius: number): this {
    return this.addOval(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  /** A star with `points` tips at `outer` radius and notches at `inner`, the first tip pointing up. */
  addStar(cx: number, cy: number, outer: number, inner: number, points = 5): this {
    const corners: P2[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : outer;
      const t = -Math.PI / 2 + (i / (points * 2)) * TAU;
      corners.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
    }
    return this.addPoly(corners);
  }

  /** A regular polygon with `sides` corners, the first pointing up. */
  addRegularPolygon(cx: number, cy: number, radius: number, sides: number): this {
    const corners: P2[] = [];
    for (let i = 0; i < sides; i++) {
      const t = -Math.PI / 2 + (i / sides) * TAU;
      corners.push([cx + Math.cos(t) * radius, cy + Math.sin(t) * radius]);
    }
    return this.addPoly(corners);
  }

  /**
   * Parses SVG path data (`d`): M L H V C S Q T A Z, absolute and relative. Paste paths from Figma,
   * Illustrator or any icon set (scale them with `fit` on the shape, or `transform` here).
   */
  static fromSVG(d: string): Path {
    const path = new Path();
    const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
    let i = 0;
    let command = "";
    let [x, y] = [0, 0];
    let control: P2 | null = null; // the last curve's second control point, for S and T
    let lastType = "";
    const num = () => {
      const t = tokens[i++];
      if (t === undefined || /[a-zA-Z]/.test(t)) throw new Error(`Path.fromSVG: expected a number near "${t ?? "the end"}"`);
      return parseFloat(t);
    };
    const flag = () => num() !== 0;
    while (i < tokens.length) {
      if (/[a-zA-Z]/.test(tokens[i]!)) command = tokens[i++]!;
      else if (!command) throw new Error("Path.fromSVG: the path must start with a command");
      const rel = command === command.toLowerCase();
      const ox = rel ? x : 0;
      const oy = rel ? y : 0;
      switch (command.toUpperCase()) {
        case "M":
          x = ox + num();
          y = oy + num();
          path.moveTo(x, y);
          command = rel ? "l" : "L"; // further pairs are lines
          control = null;
          break;
        case "L":
          x = ox + num();
          y = oy + num();
          path.lineTo(x, y);
          control = null;
          break;
        case "H":
          x = ox + num();
          path.lineTo(x, y);
          control = null;
          break;
        case "V":
          y = oy + num();
          path.lineTo(x, y);
          control = null;
          break;
        case "C": {
          const c1: P2 = [ox + num(), oy + num()];
          const c2: P2 = [ox + num(), oy + num()];
          x = ox + num();
          y = oy + num();
          path.cubicTo(c1[0], c1[1], c2[0], c2[1], x, y);
          control = c2;
          break;
        }
        case "S": {
          const c1: P2 = control && "CS".includes(lastType) ? [2 * x - control[0], 2 * y - control[1]] : [x, y];
          const c2: P2 = [ox + num(), oy + num()];
          x = ox + num();
          y = oy + num();
          path.cubicTo(c1[0], c1[1], c2[0], c2[1], x, y);
          control = c2;
          break;
        }
        case "Q": {
          const c: P2 = [ox + num(), oy + num()];
          x = ox + num();
          y = oy + num();
          path.quadTo(c[0], c[1], x, y);
          control = c;
          break;
        }
        case "T": {
          const c: P2 = control && "QT".includes(lastType) ? [2 * x - control[0], 2 * y - control[1]] : [x, y];
          x = ox + num();
          y = oy + num();
          path.quadTo(c[0], c[1], x, y);
          control = c;
          break;
        }
        case "A": {
          const rx = num();
          const ry = num();
          const rotation = (num() * Math.PI) / 180;
          const large = flag();
          const sweep = flag();
          x = ox + num();
          y = oy + num();
          path.arcTo(rx, ry, rotation, large, sweep, x, y);
          control = null;
          break;
        }
        case "Z":
          path.close();
          [x, y] = path.last;
          control = null;
          break;
        default:
          throw new Error(`Path.fromSVG: unknown command "${command}"`);
      }
      lastType = command.toUpperCase();
    }
    return path;
  }

  /** A copy moved by (dx, dy) and scaled by sx, sy (about the origin, before moving). */
  transform(sx: number, sy = sx, dx = 0, dy = 0): Path {
    const out = new Path();
    out.contours = this.contours.map((c) => ({ closed: c.closed, points: c.points.map(([x, y]) => [x * sx + dx, y * sy + dy] as P2) }));
    return out;
  }

  /** The flattened contours (curves turned into points), y down as drawn. */
  toPoints(): P2[][] {
    return this.contours.filter((c) => c.points.length > 1).map((c) => c.points.map((p) => [p[0], p[1]] as P2));
  }

  /** [minX, minY, maxX, maxY], or undefined for an empty path. */
  bounds(): [number, number, number, number] | undefined {
    const all = this.contours.flatMap((c) => c.points);
    if (!all.length) return undefined;
    return [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))];
  }
}

// ── Geometry ─────────────────────────────────────────────────────────────

/**
 * Shape geometry, before it's registered: 11 floats per vertex (position, normal, color, uv) and
 * triangle indices. Builders return it; `merge` combines it; `createShape` turns it into a mesh.
 */
export type Geometry = MeshGeometry;

const native = () => {
  if (!NativeEngine) throw new Error("shapes: the native core is not linked into this build");
  if (typeof NativeEngine.meshCreate !== "function") throw new Error("shapes: this app's native core predates custom shapes: rebuild it");
  return NativeEngine;
};

/** Sets every vertex's color (vertex colors multiply the entity's color). */
function paint(g: Geometry, color: Color | undefined): Geometry {
  if (!color) return g;
  for (let v = 0; v < g.vertices.length; v += VERTEX_FLOATS) {
    g.vertices[v + 6] = color[0];
    g.vertices[v + 7] = color[1];
    g.vertices[v + 8] = color[2];
  }
  return g;
}

const fromBuilder = (b: Builder): Geometry => ({ vertices: new Float32Array(b.vertices), indices: new Uint32Array(b.indices) });

/** A built-in shape's geometry (unit-sized, centered), to `merge` with others. */
export function shapeGeometry(shape: Exclude<Shape, "none" | "puff" | "flame">, options: { color?: Color } = {}): Geometry {
  const info = meshInfo(SHAPE_MESH[shape]);
  if (!info) throw new Error(`shapeGeometry: no geometry for "${shape}"`);
  return paint({ vertices: info.geometry.vertices.slice(), indices: info.geometry.indices.slice() }, options.color);
}

export type ExtrudeOptions = {
  /** How deep, in the path's units. 0 = a flat, one-sided face (facing +Z). Default 0.2. */
  depth?: number;
  /** Skia's fill types: "nonzero" (Skia's kWinding, the default) or "evenodd" (every inner contour is a hole). */
  fillRule?: "nonzero" | "evenodd";
  /** Vertex color (multiplies the entity's color). Default white. */
  color?: Color;
};

/**
 * A 2D path filled and pushed into a solid, facing +Z: badges, coins, leaves, hearts, stars, logos,
 * fruit slices. Holes follow the fill rule. Textures map across the front face.
 */
export function extrude(path: Path, options: ExtrudeOptions = {}): Geometry {
  const contours = path.toPoints();
  const counts = contours.map((c) => c.length);
  const points = new Float32Array(counts.reduce((a, b) => a + b, 0) * 2);
  let k = 0;
  for (const c of contours) {
    for (const [x, y] of c) {
      points[k++] = x;
      points[k++] = -y; // y down in the path, up in the world
    }
  }
  const depth = options.depth ?? 0.2;
  const vertices = new Float32Array(native().pathExtrude(points.buffer, counts, depth, options.fillRule === "evenodd") as ArrayBuffer);
  if (!vertices.length) throw new Error("extrude: the path encloses no area");
  const indices = new Uint32Array(vertices.length / VERTEX_FLOATS);
  for (let i = 0; i < indices.length; i++) indices[i] = i;
  return paint({ vertices, indices }, options.color);
}

export type LatheOptions = {
  /** Steps around the axis. Default 32. */
  segments?: number;
  /** How far around, in radians: TAU (default) is a full turn; Math.PI a half, for a cut fruit. */
  sweep?: number;
  /** Vertex color of the outside. Default white. */
  color?: Color;
  /** Color of the flat faces where a partial sweep is cut open (the flesh of a cut fruit). Default `color`. */
  cutColor?: Color;
};

/**
 * Spins a profile around the vertical axis, like a potter's wheel: fruit (apples, oranges, lemons,
 * pears, cherries), vases, bottles, bowls, chess pieces, spinning tops. The profile is a `Path`
 * (x = distance from the axis, y down, as drawn) or [radius, height] points (y up), top to bottom.
 * Open ends away from the axis are capped. With `sweep` < TAU the cut faces are closed too.
 */
export function lathe(profile: Path | readonly (readonly [number, number])[], options: LatheOptions = {}): Geometry {
  let points: P2[] =
    profile instanceof Path ? (profile.toPoints()[0] ?? []).map(([x, y]) => [Math.abs(x), -y] as P2) : profile.map(([r, y]) => [Math.abs(r), y] as P2);
  points = points.filter((p, i) => i === 0 || Math.hypot(p[0] - points[i - 1]![0], p[1] - points[i - 1]![1]) > 1e-9);
  if (points.length < 2) throw new Error("lathe: the profile needs at least two points");
  if (points[0]![1] < points[points.length - 1]![1]) points.reverse(); // top to bottom
  const segments = Math.max(3, Math.round(options.segments ?? 32));
  const sweep = Math.min(TAU, Math.max(1e-3, options.sweep ?? TAU));
  const full = sweep >= TAU - 1e-6;

  // Profile normals in the (radius, height) plane: the average of the neighbouring edges', turned outward.
  const edge = (i: number): P2 => {
    const a = points[Math.max(0, i)]!;
    const b = points[Math.min(points.length - 1, i + 1)]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(a[1] - b[1]) / len, (b[0] - a[0]) / len]; // going down the profile, outward is to the left
  };
  const last = points.length - 1;
  const normals = points.map(([r], i) => {
    // On the axis the surface is a pole: straight up at the top, down at the bottom.
    if (r < 1e-6 && (i === 0 || i === last)) return [0, i === 0 ? 1 : -1] as P2;
    const e1 = edge(i - 1);
    const e2 = edge(i);
    const n: P2 = i === 0 ? e2 : i === last ? e1 : [e1[0] + e2[0], e1[1] + e2[1]];
    const len = Math.hypot(n[0], n[1]) || 1;
    return [n[0] / len, n[1] / len] as P2;
  });

  const b = new Builder();
  // a = u * sweep around the axis; the same orientation as the built-in sphere, so faces point outward.
  b.grid(points.length - 1, segments, (u, v) => {
    const i = Math.round(v * (points.length - 1));
    const a = u * sweep;
    const [r, y] = points[i]!;
    const [nr, ny] = normals[i]!;
    return [
      [r * Math.cos(a), y, -r * Math.sin(a)],
      [nr * Math.cos(a), ny, -nr * Math.sin(a)],
    ];
  });
  const outside = fromBuilder(b);
  const top = points[0]!;
  const bottom = points[points.length - 1]!;
  if (full) {
    const caps = new Builder();
    if (top[0] > 1e-6) caps.disc(top[1], top[0], 1, segments);
    if (bottom[0] > 1e-6) caps.disc(bottom[1], bottom[0], -1, segments);
    paint(outside, options.color);
    return caps.indices.length ? merge([{ geometry: outside }, { geometry: paint(fromBuilder(caps), options.color) }]) : outside;
  }

  // The cut: the region between the profile and the axis, laid into the planes at a = 0 and a = sweep.
  const outline = new Path().addPoly([[0, -top[1]], ...points.map(([r, y]) => [r, -y] as P2), [0, -bottom[1]]]);
  const face = extrude(outline, { depth: 0 });
  const cut = (angle: number, flip: boolean): Geometry => {
    const g: Geometry = { vertices: face.vertices.slice(), indices: face.indices.slice() };
    const [c, s] = [Math.cos(angle), Math.sin(angle)];
    const n: Vec3 = angle === 0 ? [0, 0, 1] : [-s, 0, -c];
    for (let v = 0; v < g.vertices.length; v += VERTEX_FLOATS) {
      const r = g.vertices[v]!;
      g.vertices[v] = r * c;
      g.vertices[v + 2] = -r * s;
      g.vertices.set(n, v + 3);
    }
    if (flip) for (let t = 0; t < g.indices.length; t += 3) [g.indices[t + 1], g.indices[t + 2]] = [g.indices[t + 2]!, g.indices[t + 1]!];
    return g;
  };
  const flesh = options.cutColor ?? options.color;
  return merge([{ geometry: paint(outside, options.color) }, { geometry: paint(cut(0, false), flesh) }, { geometry: paint(cut(sweep, true), flesh) }]);
}

export type TubeOptions = {
  /** Radius, or a function of t (0 at the first point, 1 at the last) for tapering: bananas, horns, tails. Default 0.1. */
  radius?: number | ((t: number) => number);
  /** Steps around the tube. Default 12. */
  sides?: number;
  /** Steps between each pair of points (the path is smoothed through them). Default 8. */
  smoothness?: number;
  /** Cap the ends (where the radius isn't 0). Default true. */
  caps?: boolean;
  /** Vertex color. Default white. */
  color?: Color;
};

/**
 * A tube along a smooth curve through `points`: bananas, stems, chillies, worms, snakes, ropes,
 * pipes, tentacles, candy canes.
 */
export function tube(points: readonly Vec3[], options: TubeOptions = {}): Geometry {
  if (points.length < 2) throw new Error("tube: needs at least two points");
  const radius = typeof options.radius === "function" ? options.radius : () => (options.radius as number | undefined) ?? 0.1;
  const sides = Math.max(3, Math.round(options.sides ?? 12));
  const steps = Math.max(1, Math.round(options.smoothness ?? 8));

  // Catmull-Rom through the points.
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const curve: Vec3[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      curve.push([0, 1, 2].map(
        (k) => 0.5 * (2 * b[k]! + (-a[k]! + c[k]!) * t + (2 * a[k]! - 5 * b[k]! + 4 * c[k]! - d[k]!) * t2 + (-a[k]! + 3 * b[k]! - 3 * c[k]! + d[k]!) * t3),
      ) as unknown as Vec3);
    }
  }
  curve.push(p(points.length - 1));

  const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a: Vec3): Vec3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const tangents = curve.map((_, i) => norm(sub(curve[Math.min(curve.length - 1, i + 1)]!, curve[Math.max(0, i - 1)]!)));
  // Parallel-transported frames, so the tube doesn't twist.
  const t0 = tangents[0]!;
  let normal = norm(cross(t0, Math.abs(t0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const frames: [Vec3, Vec3][] = [];
  for (const t of tangents) {
    normal = norm(sub(normal, t.map((x) => x * dot(normal, t)) as unknown as Vec3));
    frames.push([normal, cross(t, normal)]);
  }

  const b = new Builder();
  const ring = curve.map((c, i) => {
    const r = Math.max(0, radius(i / (curve.length - 1)));
    const [n, bn] = frames[i]!;
    const first = b.vertices.length / VERTEX_FLOATS;
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * TAU;
      const dir: Vec3 = [0, 1, 2].map((k) => Math.cos(a) * n[k]! + Math.sin(a) * bn[k]!) as unknown as Vec3;
      b.vertex([c[0] + dir[0] * r, c[1] + dir[1] * r, c[2] + dir[2] * r], dir, j / sides, i / (curve.length - 1));
    }
    return { first, r };
  });
  for (let i = 0; i < ring.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = ring[i]!.first + j;
      const c = ring[i + 1]!.first + j;
      b.indices.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }
  if (options.caps ?? true) {
    for (const [i, facing] of [[0, -1], [ring.length - 1, 1]] as const) {
      const { r } = ring[i]!;
      if (r < 1e-6) continue;
      const t = tangents[i]!;
      const n: Vec3 = [t[0] * facing, t[1] * facing, t[2] * facing];
      const center = b.vertex(curve[i]!, n, 0.5, 0.5);
      const [fn, fb] = frames[i]!;
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * TAU;
        const dir = [0, 1, 2].map((k) => Math.cos(a) * fn[k]! + Math.sin(a) * fb[k]!);
        b.vertex([curve[i]![0] + dir[0]! * r, curve[i]![1] + dir[1]! * r, curve[i]![2] + dir[2]! * r], n, 0.5 + Math.cos(a) / 2, 0.5 + Math.sin(a) / 2);
      }
      for (let j = 0; j < sides; j++) b.indices.push(center, center + 1 + j, center + 2 + j);
    }
  }
  return paint(facingOutward(fromBuilder(b)), options.color);
}

/** Flips triangles whose winding disagrees with their vertex normals (so back-face culling keeps them). */
function facingOutward(g: Geometry): Geometry {
  const v = g.vertices;
  const at = (i: number, k: number) => v[g.indices[i]! * VERTEX_FLOATS + k]!;
  for (let t = 0; t < g.indices.length; t += 3) {
    const e1 = [0, 1, 2].map((k) => at(t + 1, k) - at(t, k));
    const e2 = [0, 1, 2].map((k) => at(t + 2, k) - at(t, k));
    const face = [e1[1]! * e2[2]! - e1[2]! * e2[1]!, e1[2]! * e2[0]! - e1[0]! * e2[2]!, e1[0]! * e2[1]! - e1[1]! * e2[0]!];
    const n = [0, 1, 2].map((k) => at(t, k + 3) + at(t + 1, k + 3) + at(t + 2, k + 3));
    if (face[0]! * n[0]! + face[1]! * n[1]! + face[2]! * n[2]! < 0) {
      [g.indices[t + 1], g.indices[t + 2]] = [g.indices[t + 2]!, g.indices[t + 1]!];
    }
  }
  return g;
}

export type Part = {
  geometry: Geometry;
  position?: Vec3;
  /** A quaternion [x, y, z, w], as entities use. */
  rotation?: Quat;
  scale?: Vec3 | number;
  /** Multiplies the part's vertex colors: an apple's red body, brown stem and green leaf in one mesh. */
  color?: Color;
};

/**
 * Bakes parts into one geometry, each scaled, rotated, moved and colored. One mesh draws in one
 * instanced call and moves, spins and slices as one entity.
 */
export function merge(parts: readonly Part[]): Geometry {
  const vertexCount = parts.reduce((n, p) => n + p.geometry.vertices.length, 0);
  const indexCount = parts.reduce((n, p) => n + p.geometry.indices.length, 0);
  const vertices = new Float32Array(vertexCount);
  const indices = new Uint32Array(indexCount);
  let vo = 0;
  let io = 0;
  for (const part of parts) {
    const [px, py, pz] = part.position ?? [0, 0, 0];
    const s = part.scale ?? 1;
    const [sx, sy, sz] = typeof s === "number" ? [s, s, s] : s;
    const [qx, qy, qz, qw] = part.rotation ?? [0, 0, 0, 1];
    const rotate = (x: number, y: number, z: number): Vec3 => {
      // v + 2w(q x v) + 2(q x (q x v))
      const tx = 2 * (qy * z - qz * y);
      const ty = 2 * (qz * x - qx * z);
      const tz = 2 * (qx * y - qy * x);
      return [x + qw * tx + (qy * tz - qz * ty), y + qw * ty + (qz * tx - qx * tz), z + qw * tz + (qx * ty - qy * tx)];
    };
    const src = part.geometry.vertices;
    const first = vo / VERTEX_FLOATS;
    for (let v = 0; v < src.length; v += VERTEX_FLOATS) {
      const p = rotate(src[v]! * sx, src[v + 1]! * sy, src[v + 2]! * sz);
      // Normals scale inversely (a squashed sphere's normals tilt toward its flat sides).
      const n = rotate(src[v + 3]! / sx, src[v + 4]! / sy, src[v + 5]! / sz);
      const len = Math.hypot(n[0], n[1], n[2]);
      const o = vo + v;
      vertices[o] = p[0] + px;
      vertices[o + 1] = p[1] + py;
      vertices[o + 2] = p[2] + pz;
      // Zero normals (camera-facing sprites) stay zero.
      vertices[o + 3] = len > 0 ? n[0] / len : 0;
      vertices[o + 4] = len > 0 ? n[1] / len : 0;
      vertices[o + 5] = len > 0 ? n[2] / len : 0;
      const c = part.color ?? [1, 1, 1];
      vertices[o + 6] = src[v + 6]! * c[0];
      vertices[o + 7] = src[v + 7]! * c[1];
      vertices[o + 8] = src[v + 8]! * c[2];
      vertices[o + 9] = src[v + 9]!;
      vertices[o + 10] = src[v + 10]!;
    }
    const mirrored = sx * sy * sz < 0; // turns triangles inside out: flip them back
    const si = part.geometry.indices;
    for (let t = 0; t < si.length; t += 3) {
      indices[io + t] = si[t]! + first;
      indices[io + t + 1] = si[t + (mirrored ? 2 : 1)]! + first;
      indices[io + t + 2] = si[t + (mirrored ? 1 : 2)]! + first;
    }
    vo += src.length;
    io += si.length;
  }
  return { vertices, indices };
}

export type ShapeOptions = {
  /** Move the bounding box's center to the origin, so `position` is the middle. Default true. */
  center?: boolean;
  /** Scale so the largest side is this long (1 matches the built-in shapes). Default: keep the size. */
  fit?: number;
  /** How glossy, 0..1 (as for models): around 0.6 for a waxy apple, 0.85 for glass. Default 0. */
  shine?: number;
};

/**
 * Registers geometry as a mesh: pass the result as an entity's `mesh` (or a burst's), with any
 * `texture`, physics and picking. Colliders default to a box holding the shape. Mesh ids are
 * shared by models, fonts and shapes (about 240) and live for the whole app: create each shape once,
 * at module level, not per render or per spawn.
 *
 * ```ts
 * const orange = createShape(lathe(orangeProfile, { color: [1, 0.55, 0.1] }), { fit: 1, shine: 0.3 });
 * world.spawn({ mesh: orange, position: [0, 2, 0], physics: "dynamic" });
 * ```
 */
export function createShape(geometry: Geometry, options: ShapeOptions = {}): Model {
  const n = native();
  const vertices = geometry.vertices.slice();
  if (!vertices.length || !geometry.indices.length) throw new Error("createShape: the geometry is empty");
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < vertices.length; v += VERTEX_FLOATS) {
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k]!, vertices[v + k]!);
      hi[k] = Math.max(hi[k]!, vertices[v + k]!);
    }
  }
  const center = options.center ?? true;
  const largest = Math.max(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!);
  const scale = options.fit && options.fit > 0 && largest > 0 ? options.fit / largest : 1;
  for (let v = 0; v < vertices.length; v += VERTEX_FLOATS) {
    for (let k = 0; k < 3; k++) {
      const mid = center ? (lo[k]! + hi[k]!) / 2 : 0;
      vertices[v + k] = (vertices[v + k]! - mid) * scale;
    }
  }
  const mesh = n.meshCreate(vertices.buffer, geometry.indices.slice().buffer);
  if (mesh < 0) throw new Error(`createShape: ${n.loadError() || "couldn't register the shape"}`);
  registerMesh(mesh, { geometry: nativeGeometry(mesh), shine: Math.max(0, Math.min(1, options.shine ?? 0)) });
  const [x, y, z] = n.modelSize(mesh);
  return { id: mesh, size: [x!, y!, z!] };
}
