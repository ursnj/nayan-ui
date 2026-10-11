// Fruit built from the engine's custom shapes: lathed bodies with painted skins (blushes, streaks,
// stripes, speckles) and dimpled peel, tube stems and bananas, folded serrated leaves, seeds; each
// merged into one mesh. Every fruit also comes in two pieces for slicing, as in Fruit Ninja.
//
// Pieces share the whole fruit's origin and size. Each has its cut face toward +Z and its solid
// toward -Z: spawn pieces[0] turned a quarter turn about Y (cut facing +X, so it's the left piece)
// and pieces[1] turned the other way, where the fruit was, and push them apart.
import { createShape, extrude, lathe, merge, Path, tube, type Color, type Geometry, type Model, type Part, type Quat, type Vec3 } from "@nayan-ui/engine";

export type FruitKind = "apple" | "orange" | "lemon" | "pear" | "strawberry" | "watermelon" | "banana";
export type Fruit = {
  whole: Model;
  /** The left and right pieces after a slice. */
  pieces: [Model, Model];
  /** Color of its juice (for splashes). */
  juice: Color;
};

const TAU = Math.PI * 2;

// ── Little helpers: noise, colors, rotations ─────────────────────────────

const fract = (x: number) => x - Math.floor(x);
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smoothstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));

/** Value noise, 0..1, repeating every `cu` cells in u (so it wraps around a lathe without a seam). */
function noise(u: number, v: number, cu: number, cv: number) {
  const x = u * cu;
  const y = v * cv;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const h = (i: number, j: number) => hash(((i % cu) + cu) % cu, j);
  const top = h(ix, iy) + (h(ix + 1, iy) - h(ix, iy)) * fx;
  const bottom = h(ix, iy + 1) + (h(ix + 1, iy + 1) - h(ix, iy + 1)) * fx;
  return top + (bottom - top) * fy;
}

const mix = (a: Color, b: Color, t: number): Color => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c: Color, k: number): Color => [c[0] * k, c[1] * k, c[2] * k];

const turn = (axis: Vec3, angle: number): Quat => [axis[0] * Math.sin(angle / 2), axis[1] * Math.sin(angle / 2), axis[2] * Math.sin(angle / 2), Math.cos(angle / 2)];
function mul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}
/** The rotation taking +Y to direction `n` (unit). */
function upTo(n: Vec3): Quat {
  const axis: Vec3 = [n[2], 0, -n[0]];
  const len = Math.hypot(axis[0], axis[2]);
  if (len < 1e-6) return n[1] > 0 ? [0, 0, 0, 1] : [1, 0, 0, 0];
  return turn([axis[0] / len, 0, axis[2] / len], Math.acos(Math.max(-1, Math.min(1, n[1]))));
}

// ── Profiles ─────────────────────────────────────────────────────────────

type Profile = [number, number][];

/** A profile from r(t), t going 0 (top) to 1 (bottom), `height` tall. */
function profile(height: number, r: (t: number) => number, steps = 48): Profile {
  const out: Profile = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([Math.max(0, r(t)), height / 2 - t * height]);
  }
  return out;
}

/** Evenly spaced points along a profile, so painted details have vertices to land on. */
function resample(p: Profile, n: number): Profile {
  const lengths = [0];
  for (let i = 1; i < p.length; i++) lengths.push(lengths[i - 1]! + Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]));
  const total = lengths[lengths.length - 1]!;
  const out: Profile = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const at = (i / n) * total;
    while (k < p.length - 2 && lengths[k + 1]! < at) k++;
    const t = (at - lengths[k]!) / (lengths[k + 1]! - lengths[k]! || 1);
    out.push([p[k]![0] + (p[k + 1]![0] - p[k]![0]) * t, p[k]![1] + (p[k + 1]![1] - p[k]![1]) * t]);
  }
  return out;
}

/** Scales a profile so its lathe is 1 unit across its largest side, centered on the origin. */
function normalize(p: Profile): Profile {
  const top = Math.max(...p.map((q) => q[1]));
  const bottom = Math.min(...p.map((q) => q[1]));
  const width = 2 * Math.max(...p.map((q) => q[0]));
  const s = 1 / Math.max(width, top - bottom);
  const mid = (top + bottom) / 2;
  return p.map(([r, y]) => [r * s, (y - mid) * s]);
}

/** The point and outward normal of a lathe of `p` at `v` down the profile and `angle` around. */
function onSurface(p: Profile, v: number, angle: number): [Vec3, Vec3] {
  const f = v * (p.length - 1);
  const i = Math.min(p.length - 2, Math.floor(f));
  const t = f - i;
  const [r0, y0] = p[i]!;
  const [r1, y1] = p[i + 1]!;
  const r = r0 + (r1 - r0) * t;
  const y = y0 + (y1 - y0) * t;
  const len = Math.hypot(r1 - r0, y1 - y0) || 1;
  const [nr, ny] = [(y0 - y1) / len, (r1 - r0) / len];
  const [c, s] = [Math.cos(angle), -Math.sin(angle)];
  return [
    [r * c, y, r * s],
    [nr * c, ny, nr * s],
  ];
}

// ── Parts: leaves, stems, seeds ──────────────────────────────────────────

const LEAF_TOP: Color = [0.24, 0.56, 0.17];
const LEAF_UNDER: Color = [0.19, 0.46, 0.14];
const VEIN: Color = [0.55, 0.74, 0.36];

/**
 * A leaf from its base at the origin to its tip at +X, `length` long: two serrated halves folded up
 * along a pale midrib (a V, like a real leaf), on a short stalk.
 */
function leaf(length: number, width: number, { fold = 0.38, teeth = 14, stalk = 0.16 } = {}): Geometry {
  // One half's outline (y up): along the serrated edge to the tip, then back down the midrib.
  const half = (sign: 1 | -1) => {
    const pts: [number, number][] = [[0, 0]];
    const steps = teeth * 2;
    for (let i = 1; i < steps; i++) {
      const s = i / steps;
      const tooth = i % 2 ? 0.07 : 0; // little saw teeth along the edge
      const w = width * Math.pow(Math.sin(Math.PI * s), 0.75) * (1 - 0.25 * s) * (1 + tooth);
      pts.push([length * s, sign * w]);
    }
    pts.push([length, 0]);
    // Path coordinates are y down.
    return extrude(new Path().addPoly(pts.map(([x, y]) => [x, -y] as [number, number])), { depth: 0.006 });
  };
  return merge([
    { geometry: half(1), rotation: turn([1, 0, 0], fold), color: LEAF_TOP },
    { geometry: half(-1), rotation: turn([1, 0, 0], -fold), color: LEAF_UNDER },
    { geometry: tube([[0, 0, 0], [length * 0.5, 0.004, 0], [length * 0.96, 0, 0]], { radius: (t) => 0.007 * (1 - t) + 0.002, sides: 6 }), color: VEIN },
    { geometry: tube([[-length * stalk, -0.01, 0], [0, 0, 0]], { radius: 0.008, sides: 6 }), color: [0.36, 0.42, 0.18] },
  ]);
}

/** A woody stem curving up from the origin, `height` tall, with a knobbly, paler cut end. */
function stem(height: number, radius = 0.024, bend = 0.06): Geometry {
  return tube(
    [
      [0, -0.03, 0],
      [0.005, height * 0.4, 0],
      [bend * 0.5, height * 0.8, 0],
      [bend, height, 0],
    ],
    {
      radius: (t) => radius * (1.25 - 0.45 * t + (t > 0.9 ? 0.5 * (t - 0.9) * 10 : 0)),
      sides: 8,
      color: (p) => mix([0.33, 0.21, 0.1], [0.5, 0.42, 0.28], smoothstep(0.75, 1, p.v) + 0.15 * noise(p.u, p.v, 6, 10)),
      capColor: [0.62, 0.55, 0.4],
    },
  );
}

/** A seed: a small teardrop, 1 unit tall before scaling, pointing up. */
const seed = (segments = 8) =>
  lathe(
    [
      [0, 0.5],
      [0.22, 0.32],
      [0.4, 0.02],
      [0.36, -0.28],
      [0.2, -0.45],
      [0, -0.5],
    ],
    { segments },
  );

/** A flat, pointed star (a calyx or the scar where a stem was). */
const calyx = (outer: number, inner: number, points: number, depth = 0.012) => extrude(new Path().addStar(0, 0, outer, inner, points), { depth });

/** Faces a geometry made facing +Z (an extrusion) up (+Y) instead. */
const FACE_UP = turn([1, 0, 0], -Math.PI / 2);
/** Turns a piece cut across (cut face down, -Y, solid up) to the convention: cut face +Z, solid -Z. */
const CUT_ACROSS = turn([1, 0, 0], -Math.PI / 2);

// ── The fruit ────────────────────────────────────────────────────────────

const SKIN_SEGMENTS = 72;

type Skin = (p: { u: number; v: number }) => Color;
/** A piece's painter: its u (around half a turn) or v (down half the profile) mapped onto the whole's. */
const halfTurn = (skin: Skin): Skin => (q) => skin({ u: q.u * 0.5, v: q.v });
const upperHalf = (skin: Skin): Skin => (q) => skin({ u: q.u, v: q.v * 0.5 });
const upperDisplace = (d: (u: number, v: number) => number) => (u: number, v: number) => d(u, v * 0.5);

function apple(): Fruit {
  // Drawn as a path (x = distance from the core, y down): dimpled at the top and bottom.
  const outline = Path.fromSVG("M0 0.1 C 0.12 -0.03 0.42 -0.06 0.5 0.3 C 0.55 0.62 0.36 0.9 0.14 0.93 Q 0.05 0.94 0 0.88");
  const p = normalize(resample(outline.toPoints()[0]!.map(([x, y]) => [x, -y]), 64));
  const RED: Color = [0.68, 0.04, 0.06];
  const DEEP: Color = [0.45, 0.02, 0.05];
  const GOLD: Color = [0.86, 0.66, 0.18];
  const skin = ({ u, v }: { u: number; v: number }): Color => {
    // Streaky red over a gold-green ground that shows near the stem and the bottom.
    const streak = noise(u, v, 90, 4);
    let c = mix(RED, DEEP, smoothstep(0.35, 0.9, streak) * 0.7);
    c = mix(c, GOLD, smoothstep(0.55, 0.8, noise(u, v, 7, 3)) * 0.35); // a sunny patch
    c = mix(c, [0.72, 0.68, 0.22], smoothstep(0.16, 0.02, v) * 0.75 + smoothstep(0.86, 0.99, v) * 0.6);
    // Lenticels: tiny pale dots.
    if (hash(Math.floor(u * 140), Math.floor(v * 70)) > 0.975) c = mix(c, [0.95, 0.85, 0.55], 0.55);
    return c;
  };
  const top = p[0]![1];
  const bottom = p[p.length - 1]![1];
  const body = lathe(p, { segments: SKIN_SEGMENTS, color: skin });
  const whole = merge([
    { geometry: body },
    { geometry: stem(0.17, 0.022, 0.05), position: [0, top, 0] },
    { geometry: leaf(0.32, 0.075), position: [0.03, top + 0.11, 0], rotation: mul(turn([0, 1, 0], -0.5), turn([0, 0, 1], 0.55)) },
    { geometry: calyx(0.05, 0.015, 5), position: [0, bottom - 0.004, 0], rotation: turn([1, 0, 0], Math.PI / 2), color: [0.3, 0.2, 0.1] },
  ]);
  // Cut through the core: cream flesh, a faint core outline around the axis, two seeds.
  const flesh = (r: number, y: number): Color => {
    const core = Math.hypot(r / 0.2, y / 0.24);
    let c: Color = [0.97, 0.93, 0.74];
    c = mix(c, [0.92, 0.88, 0.62], smoothstep(1.05, 0.85, core)); // the core is a touch greener
    c = mix(c, [0.82, 0.76, 0.5], smoothstep(0.12, 0, Math.abs(core - 1)) * 0.6); // its outline
    return mix(c, [1, 0.97, 0.88], smoothstep(0.88, 1, r) * 0.6); // paler just under the skin
  };
  const half = merge([
    { geometry: lathe(p, { segments: SKIN_SEGMENTS, sweep: Math.PI, color: halfTurn(skin), cutColor: flesh }) },
    ...[-1, 1].map((side): Part => ({ geometry: seed(), position: [side * 0.06, -0.02, 0.004], scale: [0.045, 0.075, 0.02], rotation: turn([0, 0, 1], side * 0.35), color: [0.3, 0.17, 0.08] })),
  ]);
  const piece = createShape(half, { center: false, shine: 0.3 });
  return { whole: createShape(whole, { center: false, shine: 0.65 }), pieces: [piece, piece], juice: [0.98, 0.94, 0.75] };
}

/** Citrus segments on a face cut across: rind, white pith, wedges with pale membranes, a pithy core. */
function citrusFace(rind: Color, pith: Color, pulp: Color, wedges: number, pithWidth: number) {
  return (r: number, angle: number): Color => {
    if (r > 1 - pithWidth * 0.45) return rind;
    if (r > 1 - pithWidth) return pith;
    if (r < 0.12) return mix(pith, pulp, smoothstep(0.08, 0.12, r));
    const w = TAU / wedges;
    const across = Math.abs(fract(angle / w) - 0.5) * w * r; // distance from the wedge's middle, along the arc
    const membrane = smoothstep(0.5 * w * r - 0.02, 0.5 * w * r - 0.006, across);
    // Juice sacs: slightly lighter and darker grains, longer toward the rim.
    const grain = noise(angle / TAU, r, wedges * 6, 9);
    return mix(shade(pulp, 0.92 + 0.16 * grain), pith, membrane * 0.85);
  };
}

/** Pitted peel: shallow pores pushed into the surface. */
const peel = (depth: number, fine: number) => (u: number, v: number) =>
  -depth * Math.pow(noise(u, v, fine, fine * 0.55), 2) - depth * 0.5 * noise(u, v, fine * 2.5, fine * 1.4);

function orange(): Fruit {
  const p = normalize(profile(0.94, (t) => 0.5 * Math.sin(Math.PI * t), 64));
  const ORANGE: Color = [1, 0.47, 0.03];
  const skin = ({ u, v }: { u: number; v: number }): Color => {
    let c = shade(ORANGE, 0.9 + 0.14 * noise(u, v, 40, 22));
    c = mix(c, [0.82, 0.55, 0.12], smoothstep(0.05, 0, v) * 0.6); // green-brown around the stem
    return mix(c, [0.75, 0.35, 0.05], smoothstep(0.95, 1, v) * 0.7); // the navel
  };
  const displace = peel(0.006, 64);
  const top = p[0]![1];
  const whole = merge([
    { geometry: lathe(p, { segments: 120, color: skin, displace }) },
    { geometry: calyx(0.06, 0.025, 5, 0.01), position: [0, top - 0.002, 0], rotation: FACE_UP, color: [0.3, 0.42, 0.14] },
    { geometry: tube([[0, top - 0.01, 0], [0, top + 0.035, 0]], { radius: 0.014, sides: 6 }), color: [0.42, 0.4, 0.2] },
  ]);
  // Cut across the middle: the top half, its cut face showing ten segments.
  const upper = p.slice(0, Math.floor(p.length / 2) + 1);
  const face = citrusFace(shade(ORANGE, 0.95), [0.99, 0.95, 0.84], [1, 0.58, 0.08], 10, 0.12);
  const piece = createShape(merge([{ geometry: lathe(upper, { segments: 120, color: upperHalf(skin), displace: upperDisplace(displace), capColor: face, capRings: 24 }), rotation: CUT_ACROSS }]), {
    center: false,
    shine: 0.25,
  });
  return { whole: createShape(whole, { center: false, shine: 0.35 }), pieces: [piece, piece], juice: [1, 0.6, 0.1] };
}

function lemon(): Fruit {
  // Pointed at both ends; laid on its side.
  const p = normalize(profile(1, (t) => 0.34 * Math.pow(Math.sin(Math.PI * t), 0.75), 64));
  const YELLOW: Color = [1, 0.86, 0.12];
  const skin = ({ u, v }: { u: number; v: number }): Color => {
    const c = shade(YELLOW, 0.9 + 0.14 * noise(u, v, 36, 20));
    return mix(c, [0.62, 0.72, 0.15], (smoothstep(0.06, 0, v) + smoothstep(0.94, 1, v)) * 0.6); // greenish tips
  };
  const displace = peel(0.005, 56);
  const side = turn([0, 0, 1], Math.PI / 2);
  const whole = merge([{ geometry: lathe(p, { segments: 96, color: skin, displace }), rotation: side }]);
  const upper = p.slice(0, Math.floor(p.length / 2) + 1);
  const face = citrusFace(YELLOW, [0.99, 0.97, 0.86], [1, 0.93, 0.5], 9, 0.1);
  // Cut across the middle of its length (the cut face toward +Z, the rest along -Z, as the whole lies).
  const piece = createShape(merge([{ geometry: lathe(upper, { segments: 96, color: upperHalf(skin), displace: upperDisplace(displace), capColor: face, capRings: 20 }), rotation: CUT_ACROSS }]), {
    center: false,
    shine: 0.3,
  });
  return { whole: createShape(whole, { center: false, shine: 0.4 }), pieces: [piece, piece], juice: [1, 0.95, 0.55] };
}

function pear(): Fruit {
  // Narrow neck, round bottom, a slight dimple where the stem goes in.
  const p = normalize(profile(1, (t) => Math.pow(Math.sin(Math.PI * t), 0.55) * (0.15 + 0.31 * Math.pow(t, 1.35)) * (1 - 0.15 * Math.exp(-t * 30)), 64));
  const skin = ({ u, v }: { u: number; v: number }): Color => {
    let c = mix([0.62, 0.74, 0.2], [0.84, 0.8, 0.28], noise(u, v, 6, 4));
    const blush = Math.pow(Math.max(0, Math.cos((u - 0.2) * TAU)), 2) * smoothstep(0.3, 0.8, v);
    c = mix(c, [0.78, 0.28, 0.12], blush * 0.55); // a red cheek on the sunny side
    c = mix(c, [0.55, 0.42, 0.18], smoothstep(0.12, 0, v) * 0.6); // russet neck
    if (hash(Math.floor(u * 120), Math.floor(v * 64)) > 0.95) c = mix(c, [0.5, 0.38, 0.18], 0.65); // speckles
    return c;
  };
  const top = p[0]![1];
  const bottom = p[p.length - 1]![1];
  const whole = merge([
    { geometry: lathe(p, { segments: SKIN_SEGMENTS, color: skin }) },
    { geometry: stem(0.2, 0.02, 0.07), position: [0, top, 0] },
    { geometry: calyx(0.035, 0.012, 5), position: [0, bottom - 0.003, 0], rotation: turn([1, 0, 0], Math.PI / 2), color: [0.32, 0.22, 0.12] },
  ]);
  // The core sits low in a pear, with its seeds.
  const flesh = (r: number, y: number): Color => {
    const core = Math.hypot(r / 0.17, (y + 0.15) / 0.17);
    let c: Color = [0.98, 0.96, 0.82];
    c = mix(c, [0.92, 0.9, 0.7], smoothstep(1.1, 0.8, core));
    return mix(c, [0.86, 0.82, 0.58], smoothstep(0.1, 0, Math.abs(core - 1)) * 0.6);
  };
  const half = merge([
    { geometry: lathe(p, { segments: SKIN_SEGMENTS, sweep: Math.PI, color: halfTurn(skin), cutColor: flesh }) },
    ...[-1, 1].map((side): Part => ({ geometry: seed(), position: [side * 0.05, -0.16, 0.004], scale: [0.035, 0.06, 0.018], rotation: turn([0, 0, 1], side * 0.3), color: [0.25, 0.14, 0.07] })),
  ]);
  const piece = createShape(half, { center: false, shine: 0.25 });
  return { whole: createShape(whole, { center: false, shine: 0.45 }), pieces: [piece, piece], juice: [0.98, 0.96, 0.8] };
}

function strawberry(): Fruit {
  // Broad shoulders, a pointed tip.
  const p = normalize(profile(1, (t) => 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.45) * (1 - 0.62 * Math.pow(t, 1.2)), 64));
  const skin = ({ v }: { v: number }): Color => {
    let c: Color = [0.82, 0.05, 0.1];
    c = mix(c, [0.95, 0.8, 0.62], smoothstep(0.1, 0.02, v) * 0.7); // pale under the leaves
    return mix(c, [0.95, 0.25, 0.12], smoothstep(0.8, 1, v) * 0.5); // a lighter, orange-red tip
  };
  // Seeds (achenes) spiral over the surface, every one at the golden angle from the last.
  const seeds = (sweep: number): Part[] => {
    const out: Part[] = [];
    const n = 80;
    for (let i = 0; i < n; i++) {
      const v = 0.14 + (0.8 * i) / n;
      const angle = fract(i * 0.381966) * TAU;
      if (angle > sweep) continue;
      const [pos, normal] = onSurface(p, v, angle);
      out.push({
        geometry: seed(6),
        position: [pos[0] + normal[0] * 0.002, pos[1] + normal[1] * 0.002, pos[2] + normal[2] * 0.002],
        rotation: upTo(normal),
        scale: [0.022, 0.03, 0.022],
        color: [0.95, 0.8, 0.3],
      });
    }
    return out;
  };
  const top = p[0]![1];
  // Sepals: narrow pointed leaves fanned around the top, drooping over the shoulders.
  const sepals: Part[] = [];
  for (let i = 0; i < 8; i++) {
    const around = (i / 8) * TAU + 0.2;
    sepals.push({
      geometry: leaf(0.24 + 0.04 * Math.sin(i * 2.3), 0.035, { fold: 0.2, teeth: 4, stalk: 0 }),
      position: [0, top - 0.02, 0],
      rotation: mul(turn([0, 1, 0], around), turn([0, 0, 1], -0.35 - 0.12 * Math.cos(i * 1.7))),
    });
  }
  const crown: Part[] = [...sepals, { geometry: stem(0.12, 0.018, 0.02), position: [0, top - 0.02, 0], color: [0.55, 1.2, 0.5] }];
  const whole = merge([{ geometry: lathe(p, { segments: SKIN_SEGMENTS, color: skin }) }, ...seeds(TAU), ...crown]);
  // Cut lengthwise: a pale heart fading to red at the edge.
  const flesh = (r: number, y: number): Color => {
    const c = mix([1, 0.85, 0.82], [0.88, 0.12, 0.16], smoothstep(0.35, 0.85, r));
    return mix(c, [0.98, 0.75, 0.72], smoothstep(0.12, 0, Math.abs(r - 0.32)) * 0.4 * smoothstep(-0.4, 0.2, y)); // faint vascular ring
  };
  const piece = createShape(merge([{ geometry: lathe(p, { segments: SKIN_SEGMENTS, sweep: Math.PI, color: halfTurn(skin), cutColor: flesh }) }, ...seeds(Math.PI)]), {
    center: false,
    shine: 0.4,
  });
  return { whole: createShape(whole, { center: false, shine: 0.55 }), pieces: [piece, piece], juice: [0.95, 0.15, 0.2] };
}

function watermelon(): Fruit {
  // Oblong: lathed along its length, then laid on its side.
  const p = normalize(profile(1, (t) => 0.36 * Math.pow(Math.sin(Math.PI * t), 0.9), 64));
  const DARK: Color = [0.07, 0.27, 0.08];
  const LIGHT: Color = [0.42, 0.62, 0.26];
  const skin = ({ u, v }: { u: number; v: number }): Color => {
    // Dark, jagged stripes running end to end over a pale ground.
    const wobble = (noise(u, v, 16, 10) - 0.5) * 0.9;
    const stripe = Math.sin((u * 16 + wobble) * TAU);
    let c = mix(LIGHT, DARK, smoothstep(-0.35, 0.1, stripe));
    c = shade(c, 0.9 + 0.15 * noise(u, v, 50, 30));
    // The field spot where it lay on the ground: a creamy yellow patch on one side.
    const spot = smoothstep(0.16, 0.05, Math.hypot((fract(u - 0.75 + 0.5) - 0.5) * 2.2, v - 0.5));
    return mix(c, [0.82, 0.76, 0.38], spot * 0.85);
  };
  const side = turn([0, 0, 1], Math.PI / 2);
  const whole = merge([{ geometry: lathe(p, { segments: 96, color: skin }), rotation: side }]);
  // Cut across the middle: dark rind, a pale band, white, then red flesh, deeper toward the middle.
  const face = (r: number): Color => {
    if (r > 0.965) return DARK;
    if (r > 0.92) return mix([0.62, 0.8, 0.45], [0.85, 0.93, 0.7], (0.965 - r) / 0.045);
    if (r > 0.86) return mix([0.97, 0.97, 0.85], [0.98, 0.55, 0.5], smoothstep(0.92, 0.86, r));
    return mix([0.98, 0.3, 0.32], [0.88, 0.1, 0.16], smoothstep(0.85, 0.2, r));
  };
  const upper = p.slice(0, Math.floor(p.length / 2) + 1);
  const r0 = upper[upper.length - 1]![0]; // the cut face's radius
  const blackSeeds: Part[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + (i % 2) * 0.12;
    const rr = r0 * (0.5 + 0.1 * (i % 3));
    // On the cut face (y = 0, facing -Y in the lathe), pointing out from the middle.
    blackSeeds.push({
      geometry: seed(),
      position: [Math.cos(a) * rr, -0.004, -Math.sin(a) * rr],
      rotation: mul(turn([0, 1, 0], a + Math.PI / 2), turn([1, 0, 0], Math.PI / 2)), // lying flat, pointing outward
      scale: [0.03, 0.05, 0.012],
      color: [0.08, 0.05, 0.04],
    });
  }
  const half = merge([{ geometry: merge([{ geometry: lathe(upper, { segments: 96, color: upperHalf(skin), capColor: face, capRings: 24 }) }, ...blackSeeds]), rotation: CUT_ACROSS }]);
  const piece = createShape(half, { center: false, shine: 0.25 });
  return { whole: createShape(whole, { center: false, shine: 0.35 }), pieces: [piece, piece], juice: [0.95, 0.2, 0.25] };
}

function banana(): Fruit {
  // A tapering, five-sided curve along X, centered, 1 unit from tip to stem.
  const raw: Vec3[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * (0.12 + (0.76 * i) / 12);
    raw.push([-Math.cos(a) * 0.5, -Math.sin(a) * 0.3, 0]);
  }
  const xs = raw.map((q) => q[0]);
  const ys = raw.map((q) => q[1]);
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const scale = 0.92 / (Math.max(...xs) - Math.min(...xs));
  const arc: Vec3[] = raw.map(([x, y]) => [(x - cx) * scale, (y - cy) * scale + 0.06, 0]);
  const radius = (t: number) => 0.012 + 0.07 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.03 + t * 0.97)), 0.55);
  const ridges = (around: number) => 1 + 0.06 * Math.cos(around * TAU * 5);
  const skin = ({ u, v }: { u: number; v: number }): Color => {
    let c: Color = [1, 0.84, 0.16];
    c = mix(c, [0.82, 0.76, 0.18], 0.4 * (0.5 + 0.5 * Math.cos(u * TAU * 5))); // darker in the grooves
    c = mix(c, [0.62, 0.72, 0.2], smoothstep(0.82, 1, v) * 0.6); // still green by the stem
    c = mix(c, [0.18, 0.12, 0.06], smoothstep(0.05, 0, v)); // the dark blossom tip
    // Sugar spots.
    const spot = noise(u, v, 18, 26);
    if (spot > 0.78) c = mix(c, [0.45, 0.28, 0.08], smoothstep(0.78, 0.88, spot) * 0.9);
    return c;
  };
  const flesh = (r: number): Color => (r > 0.9 ? [1, 0.84, 0.16] : r < 0.22 ? [0.86, 0.8, 0.58] : [0.99, 0.95, 0.78]);
  // The stalk: green-brown, a little square, with a darker cut end.
  const end = arc[arc.length - 1]!;
  const prev = arc[arc.length - 2]!;
  const dir = [end[0] - prev[0], end[1] - prev[1]];
  const len = Math.hypot(dir[0]!, dir[1]!);
  const stalkEnd: Vec3 = [end[0] + (dir[0]! / len) * 0.1, end[1] + (dir[1]! / len) * 0.1 + 0.015, 0];
  const stalk = tube([end, stalkEnd], {
    radius: (t) => 0.026 - 0.006 * t,
    shape: (around) => 1 + 0.12 * Math.cos(around * TAU * 4),
    sides: 12,
    color: [0.45, 0.48, 0.2],
    capColor: [0.3, 0.25, 0.12],
  });
  const body = (points: Vec3[], t0: number, t1: number) =>
    tube(points, {
      radius: (t) => radius(t0 + (t1 - t0) * t),
      shape: ridges,
      sides: 30,
      smoothness: 6,
      color: (p) => skin({ u: p.u, v: t0 + (t1 - t0) * p.v }),
      capColor: (r) => flesh(r),
    });
  const whole = merge([{ geometry: body(arc, 0, 1) }, { geometry: stalk }]);
  // Cut in the middle: the tip end on the left, the stalk end on the right, each turned so its cut faces +Z.
  const mid = Math.floor(arc.length / 2);
  const left = body(arc.slice(0, mid + 1), 0, mid / (arc.length - 1));
  const right = merge([{ geometry: body(arc.slice(mid), mid / (arc.length - 1), 1) }, { geometry: stalk }]);
  return {
    whole: createShape(whole, { center: false, shine: 0.3 }),
    pieces: [
      createShape(merge([{ geometry: left, rotation: turn([0, 1, 0], -Math.PI / 2) }]), { center: false, shine: 0.3 }),
      createShape(merge([{ geometry: right, rotation: turn([0, 1, 0], Math.PI / 2) }]), { center: false, shine: 0.3 }),
    ],
    juice: [1, 0.95, 0.72],
  };
}

let fruits: Record<FruitKind, Fruit> | undefined;
/** Every fruit, built once (mesh ids last for the whole app). Needs the native core. */
export function getFruits(): Record<FruitKind, Fruit> {
  fruits ??= { apple: apple(), orange: orange(), lemon: lemon(), pear: pear(), strawberry: strawberry(), watermelon: watermelon(), banana: banana() };
  return fruits;
}
