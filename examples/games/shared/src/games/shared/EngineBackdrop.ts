import { type Geometry, type Model } from '@nayan-ui/engine';
import { type GamePattern, gamePattern, PATTERN_GRID_COLOR, type PatternGradient, type PatternShape } from '../../helpers/GamePatternData';
import type { GameTheme } from '../../services/ThemeService';
// The Playtura game background (theme color plus the rainbow pattern), built by the Nayan Game Engine with
// no original. The pattern (helpers/GamePatternData) is turned into one opaque mesh whose vertex colors are
// what the original pattern composites to at each point: the gradients on a fine grid, the shapes and grid
// lines layered on top with the layers under them baked in. One draw call, nothing to blend each frame.
// Shared by the engine games' scenes and the modal cards (BackdropCard).
import { getScreenDimensions } from '../../services/UtilsService';
import { cacheGameAsset, createGameMesh as createShape } from './EngineMeshes';
import { frontLight, toColor } from './EngineUtils';

type RGBA = [number, number, number, number];

/** Any front light works: these flat meshes face the camera, which it lights at exactly 1. */
export const BACKDROP_LIGHT = frontLight([0, 0, 1], 1);

const GRID_STEP = 16; // points between gradient samples (stops are ~100pt apart)
const SEGMENTS = 40; // around a circle
const CORNER_SEGMENTS = 6;
const LAYER_GAP = 0.05; // depth between layers, toward the camera

// ── Compositing (original's: stops interpolated unpremultiplied, layers source-over, group opacity) ──

function gradientAt(g: PatternGradient, stops: RGBA[], x: number, y: number): RGBA {
  const dx = g.end[0] - g.start[0];
  const dy = g.end[1] - g.start[1];
  const t = Math.max(0, Math.min(1, ((x - g.start[0]) * dx + (y - g.start[1]) * dy) / (dx * dx + dy * dy)));
  const p = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const f = p - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
}

function contains(s: PatternShape, x: number, y: number) {
  switch (s.kind) {
    case 'circle':
      return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r * s.r;
    case 'rrect':
      return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
    default:
      return Math.abs(x - s.cx) + Math.abs(y - s.cy) <= s.size / 2;
  }
}

/** Composites a pattern point: the gradients, then the shapes up to `layers` (index), then `top` if given. */
class Compositor {
  private readonly stops: RGBA[][];
  private readonly colors: RGBA[];
  private readonly gridColor = toColor(PATTERN_GRID_COLOR) as RGBA;
  private readonly bg: RGBA;

  constructor(
    private readonly pattern: GamePattern,
    background: string,
    private readonly opacity: number
  ) {
    this.stops = pattern.gradients.map((g) => g.colors.map((c) => toColor(c) as RGBA));
    this.colors = pattern.shapes.map((s) => toColor(s.color) as RGBA);
    this.bg = toColor(background) as RGBA;
  }

  /** Final RGB at (x, y) with shapes [0, shapes) under it, plus shape `self` (or the grid) on top. */
  at(x: number, y: number, shapes: number, self: number | 'grid' | null): [number, number, number] {
    // Premultiplied accumulation of the pattern group
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    const over = (c: RGBA) => {
      const k = 1 - c[3];
      r = c[0] * c[3] + r * k;
      g = c[1] * c[3] + g * k;
      b = c[2] * c[3] + b * k;
      a = c[3] + a * k;
    };
    this.pattern.gradients.forEach((grad, i) => over(gradientAt(grad, this.stops[i]!, x, y)));
    for (let i = 0; i < shapes; i++) if (contains(this.pattern.shapes[i]!, x, y)) over(this.colors[i]!);
    if (typeof self === 'number') over(this.colors[self]!);
    else if (self === 'grid') over(this.gridColor);
    // The group at the theme's pattern opacity over the background color
    const o = this.opacity;
    return [r * o + this.bg[0] * (1 - a * o), g * o + this.bg[1] * (1 - a * o), b * o + this.bg[2] * (1 - a * o)];
  }
}

// ── Mesh ──────────────────────────────────────────────────────────────

class MeshBuilder {
  vertices: number[] = [];
  indices: number[] = [];
  /** A vertex at pattern point (x, y) (y down), depth z. */
  vertex(x: number, y: number, z: number, [r, g, b]: [number, number, number]) {
    this.vertices.push(x, -y, z, 0, 0, 1, r, g, b, 0, 0);
    return this.vertices.length / 11 - 1;
  }
  /** A quad from its corners, counter-clockwise seen from the camera (y up). */
  quad(a: number, b: number, c: number, d: number) {
    this.indices.push(a, b, c, a, c, d);
  }
  geometry(): Geometry {
    return { vertices: new Float32Array(this.vertices), indices: new Uint32Array(this.indices) };
  }
}

/** A shape's outline in pattern points (y down), counter-clockwise with y up (as the camera sees it). */
function outline(s: PatternShape): [number, number][] {
  if (s.kind === 'circle') {
    return Array.from({ length: SEGMENTS }, (_, k) => {
      const t = (-k / SEGMENTS) * Math.PI * 2;
      return [s.cx + Math.cos(t) * s.r, s.cy + Math.sin(t) * s.r] as [number, number];
    });
  }
  if (s.kind === 'diamond') {
    const h = s.size / 2;
    return [
      [s.cx + h, s.cy],
      [s.cx, s.cy - h],
      [s.cx - h, s.cy],
      [s.cx, s.cy + h]
    ];
  }
  const r = Math.min(s.r, s.w / 2, s.h / 2);
  // Corner centres (y down) with each arc's start angle, counter-clockwise with y up: bottom-right,
  // top-right, top-left, bottom-left. Each arc turns a quarter; y down flips the sine.
  const corners: [number, number, number][] = [
    [s.x + s.w - r, s.y + s.h - r, -Math.PI / 2],
    [s.x + s.w - r, s.y + r, 0],
    [s.x + r, s.y + r, Math.PI / 2],
    [s.x + r, s.y + s.h - r, Math.PI]
  ];
  const points: [number, number][] = [];
  for (const [cx, cy, from] of corners) {
    for (let k = 0; k <= CORNER_SEGMENTS; k++) {
      const t = from + (k / CORNER_SEGMENTS) * (Math.PI / 2);
      points.push([cx + Math.cos(t) * r, cy - Math.sin(t) * r]);
    }
  }
  return points;
}

function centreOf(s: PatternShape): [number, number] {
  return s.kind === 'rrect' ? [s.x + s.w / 2, s.y + s.h / 2] : [s.cx, s.cy];
}

function buildGeometry(pattern: GamePattern, background: string, opacity: number, withGrid = true): Geometry {
  const m = new MeshBuilder();
  const c = new Compositor(pattern, background, opacity);
  const { width, height, shapes } = pattern;
  const grid = withGrid ? pattern.grid : [];

  // The gradients on a grid
  const nx = Math.ceil(width / GRID_STEP);
  const ny = Math.ceil(height / GRID_STEP);
  const first = m.vertices.length / 11;
  for (let j = 0; j <= ny; j++) {
    const y = Math.min(height, j * GRID_STEP);
    for (let i = 0; i <= nx; i++) {
      const x = Math.min(width, i * GRID_STEP);
      m.vertex(x, y, 0, c.at(x, y, 0, null));
    }
  }
  const at = (i: number, j: number) => first + j * (nx + 1) + i;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) m.quad(at(i, j + 1), at(i + 1, j + 1), at(i + 1, j), at(i, j));

  // Each shape as a fan, above the ones before it
  shapes.forEach((s, k) => {
    const z = (k + 1) * LAYER_GAP;
    const [cx, cy] = centreOf(s);
    const centre = m.vertex(cx, cy, z, c.at(cx, cy, k, k));
    const ring = outline(s).map(([x, y]) => m.vertex(x, y, z, c.at(x, y, k, k)));
    ring.forEach((v, i) => m.indices.push(centre, v, ring[(i + 1) % ring.length]!));
  });

  // The grid lines, split along their length so the colors under them follow
  const z = (shapes.length + 1) * LAYER_GAP;
  for (const line of grid) {
    const long = Math.max(line.w, line.h);
    const steps = Math.max(1, Math.ceil(long / GRID_STEP));
    const vertical = line.h > line.w;
    let prev: [number, number] | null = null;
    for (let s = 0; s <= steps; s++) {
      const t = Math.min(long, s * GRID_STEP);
      // The two edge points across the line at distance t along it
      const p: [number, number, number, number] = vertical
        ? [line.x, line.y + t, line.x + line.w, line.y + t]
        : [line.x + t, line.y, line.x + t, line.y + line.h];
      const a = m.vertex(p[0], p[1], z, c.at(p[0], p[1], shapes.length, 'grid'));
      const b = m.vertex(p[2], p[3], z, c.at(p[2], p[3], shapes.length, 'grid'));
      if (prev) {
        // Vertical: prev is above (smaller y). Horizontal: prev is to the left.
        if (vertical) m.quad(a, b, prev[1], prev[0]);
        else m.quad(prev[1], b, a, prev[0]);
      }
      prev = [a, b];
    }
  }
  return m.geometry();
}

// One mesh per theme and window size: mesh ids are app-wide and limited, and they last for the app.
const meshes = new Map<string, Model>();

/** The background mesh in pattern space: x right, y up from the window's top-left (y runs to -height). */
export function backdropMesh(theme: GameTheme): Model {
  const { width, height } = getScreenDimensions();
  const key = `${theme.BACKGROUND}:${theme.PATTERN_OPACITY}:${Math.round(width)}x${Math.round(height)}`;
  let mesh = meshes.get(key);
  if (!mesh) {
    mesh = cacheGameAsset(`shared/EngineBackdrop:${key}`, () =>
      createShape(buildGeometry(gamePattern(width, height), theme.BACKGROUND, theme.PATTERN_OPACITY), { center: false })
    );
    meshes.set(key, mesh);
  }
  return mesh;
}

const FLOATS = 11;

/** Keeps the parts of `geometry` inside a convex polygon (x, y as stored, counter-clockwise), interpolating every vertex attribute. */
function clipGeometry({ vertices, indices }: Geometry, poly: [number, number][]): Geometry {
  type V = number[];
  const out: number[] = [];
  const outIdx: number[] = [];
  const read = (i: number): V => Array.from(vertices.subarray(i * FLOATS, i * FLOATS + FLOATS));
  for (let t = 0; t < indices.length; t += 3) {
    let shape: V[] = [read(indices[t]!), read(indices[t + 1]!), read(indices[t + 2]!)];
    for (let e = 0; e < poly.length && shape.length > 0; e++) {
      const [ax, ay] = poly[e]!;
      const [bx, by] = poly[(e + 1) % poly.length]!;
      const side = (v: V) => (bx - ax) * (v[1]! - ay) - (by - ay) * (v[0]! - ax);
      const next: V[] = [];
      for (let i = 0; i < shape.length; i++) {
        const p = shape[i]!;
        const q = shape[(i + 1) % shape.length]!;
        const sp = side(p);
        const sq = side(q);
        if (sp >= 0) next.push(p);
        if (sp >= 0 !== sq >= 0) {
          const f = sp / (sp - sq);
          next.push(p.map((x, k) => x + (q[k]! - x) * f));
        }
      }
      shape = next;
    }
    if (shape.length < 3) continue;
    const base = out.length / FLOATS;
    for (const v of shape) out.push(...v);
    for (let i = 1; i + 1 < shape.length; i++) outIdx.push(base, base + i, base + i + 1);
  }
  return { vertices: new Float32Array(out), indices: new Uint32Array(outIdx) };
}

/**
 * A modal card's background: the window pattern's top-left `width` x `height` (its gradients and
 * shapes, without the grid lines), cut to a rounded rectangle of corner `radius`. Same space as
 * `backdropMesh` (from the top-left, y up).
 */
export function cardBackdropMesh(theme: GameTheme, width: number, height: number, radius: number): Model {
  const win = getScreenDimensions();
  const [w, h] = [Math.round(width), Math.round(height)];
  const key = `card-nogrid:${theme.BACKGROUND}:${theme.PATTERN_OPACITY}:${Math.round(win.width)}x${Math.round(win.height)}:${w}x${h}:${radius}`;
  let mesh = meshes.get(key);
  if (!mesh) {
    const r = Math.min(radius, w / 2, h / 2);
    // The rounded rectangle, counter-clockwise with y up (stored y = -pattern y)
    const poly: [number, number][] = [];
    const corners: [number, number, number][] = [
      [w - r, -h + r, -Math.PI / 2],
      [w - r, -r, 0],
      [r, -r, Math.PI / 2],
      [r, -h + r, Math.PI]
    ];
    for (const [cx, cy, from] of corners) {
      for (let k = 0; k <= CORNER_SEGMENTS; k++) {
        const t = from + (k / CORNER_SEGMENTS) * (Math.PI / 2);
        poly.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
      }
    }
    const full = buildGeometry(gamePattern(win.width, win.height), theme.BACKGROUND, theme.PATTERN_OPACITY, false);
    mesh = createShape(clipGeometry(full, poly), { center: false });
    meshes.set(key, mesh);
  }
  return mesh;
}
