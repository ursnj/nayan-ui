// Fruit built from the engine's custom shapes: lathed bodies, tube stems and bananas, extruded
// leaves, merged into one mesh each. Every fruit also has a half (cut face up +Z, solid toward -Z)
// for slicing, as in Fruit Ninja. Halves share the whole fruit's origin and size: spawn two where the
// fruit was, one turned half a turn about Y, and push them apart.
import { createShape, extrude, lathe, merge, Path, tube, type Color, type Model, type Quat, type Vec3 } from "@nayan-ui/engine";

export type FruitKind = "apple" | "orange" | "lemon" | "pear" | "strawberry" | "watermelon" | "banana";
export type Fruit = {
  whole: Model;
  /** Null for fruit that's sliced differently (the banana is cut across: both pieces are the same tube). */
  half: Model | null;
  /** Color of its juice and cut face (for splashes). */
  juice: Color;
};

type Profile = [number, number][];

/** A profile from r(t), t going 0 (top) to 1 (bottom), `height` tall. */
function profile(height: number, r: (t: number) => number, steps = 24): Profile {
  const out: Profile = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([Math.max(0, r(t)), height / 2 - t * height]);
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

const turn = (axis: Vec3, angle: number): Quat => [axis[0] * Math.sin(angle / 2), axis[1] * Math.sin(angle / 2), axis[2] * Math.sin(angle / 2), Math.cos(angle / 2)];

const STEM: Color = [0.42, 0.27, 0.13];
const LEAF: Color = [0.25, 0.62, 0.2];

// A leaf outline (Skia / SVG style, y down), extruded thin.
const leafPath = Path.fromSVG("M0 0 C 0.12 -0.1 0.34 -0.1 0.5 0 C 0.34 0.1 0.12 0.1 0 0 Z");
const leaf = () => extrude(leafPath, { depth: 0.015 });
const stem = (height: number) => tube([[0, 0, 0], [0.01, height * 0.6, 0], [0.04, height, 0]], { radius: 0.022, sides: 8 });

/** A lathed fruit with optional extras on top (y = its top), and its half. */
function lathed(body: Profile, color: Color, flesh: Color, shine: number, extras: (top: number) => Parameters<typeof merge>[0] = () => []) {
  const p = normalize(body);
  const top = p[0]![1];
  const whole = merge([{ geometry: lathe(p, { segments: 40, color }) }, ...extras(top)]);
  return {
    whole: createShape(whole, { center: false, shine }),
    half: createShape(lathe(p, { segments: 40, sweep: Math.PI, color, cutColor: flesh }), { center: false, shine: shine * 0.5 }),
    juice: flesh,
  };
}

function build(): Record<FruitKind, Fruit> {
  // An apple drawn as a path (x = distance from the core, y down): dimpled at the top and bottom.
  const appleOutline = Path.fromSVG("M0 0.1 C 0.12 -0.03 0.42 -0.06 0.5 0.3 C 0.55 0.62 0.36 0.9 0.14 0.93 Q 0.05 0.94 0 0.88");
  const apple = lathed(appleOutline.toPoints()[0]!.map(([x, y]) => [x, -y]), [0.85, 0.08, 0.1], [0.98, 0.93, 0.72], 0.6, (top) => [
    { geometry: stem(0.16), position: [0, top - 0.06, 0], color: STEM },
    { geometry: leaf(), position: [0.04, top + 0.06, 0], rotation: turn([0, 0, 1], 0.5), color: LEAF },
  ]);

  const orange = lathed(profile(0.92, (t) => 0.5 * Math.sin(Math.PI * t)), [1, 0.52, 0.06], [1, 0.66, 0.18], 0.3, (top) => [
    { geometry: leaf(), position: [0, top - 0.01, 0], rotation: turn([0, 0, 1], 0.25), scale: 0.6, color: LEAF },
  ]);

  // Pointed at both ends: the radius grows a little faster than linearly from each tip.
  const lemon = lathed(profile(1, (t) => 0.36 * Math.pow(Math.sin(Math.PI * t), 0.85)), [1, 0.88, 0.15], [1, 0.95, 0.55], 0.4);

  // Narrow neck, round bottom.
  const pear = lathed(
    profile(1, (t) => Math.pow(Math.sin(Math.PI * t), 0.55) * (0.16 + 0.3 * Math.pow(t, 1.3))),
    [0.72, 0.82, 0.25],
    [0.97, 0.95, 0.78],
    0.35,
    (top) => [{ geometry: stem(0.18), position: [0, top - 0.04, 0], color: STEM }],
  );

  // Wide shoulders, a pointed tip, and a star of leaves on top.
  const calyx = extrude(new Path().addStar(0, 0, 0.26, 0.09, 6), { depth: 0.02 });
  const strawberry = lathed(
    profile(1, (t) => 0.5 * Math.pow(Math.sin(Math.PI * t), 0.55) * (1 - 0.6 * t)),
    [0.9, 0.1, 0.14],
    [1, 0.45, 0.45],
    0.5,
    (top) => [
      { geometry: calyx, position: [0, top - 0.015, 0], rotation: turn([1, 0, 0], -Math.PI / 2), color: LEAF },
      { geometry: stem(0.1), position: [0, top, 0], color: [0.3, 0.55, 0.2] },
    ],
  );

  // Oblong: lathed along its length, then laid on its side.
  const melonBody = normalize(profile(1, (t) => 0.36 * Math.sin(Math.PI * t)));
  const side = turn([0, 0, 1], Math.PI / 2);
  const watermelon = {
    whole: createShape(merge([{ geometry: lathe(melonBody, { segments: 40, color: [0.16, 0.48, 0.15] }), rotation: side }]), { center: false, shine: 0.3 }),
    half: createShape(merge([{ geometry: lathe(melonBody, { segments: 40, sweep: Math.PI, color: [0.16, 0.48, 0.15], cutColor: [0.95, 0.2, 0.25] }), rotation: side }]), {
      center: false,
      shine: 0.15,
    }),
    juice: [0.95, 0.2, 0.25] as Color,
  };

  // A curved, tapering tube with dark tips.
  const arc: Vec3[] = [];
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI * (0.15 + (0.7 * i) / 6);
    arc.push([-Math.cos(a) * 0.5, -Math.sin(a) * 0.32 + 0.16, 0]);
  }
  const banana = merge([
    { geometry: tube(arc, { radius: (t) => 0.02 + 0.075 * Math.pow(Math.sin(Math.PI * t), 0.6), sides: 10 }), color: [1, 0.86, 0.2] },
    { geometry: tube([arc[6]!, [arc[6]![0] + 0.04, arc[6]![1] + 0.08, 0]], { radius: 0.022, sides: 6 }), color: [0.4, 0.3, 0.12] },
  ]);

  return {
    apple,
    orange,
    lemon,
    pear,
    strawberry,
    watermelon,
    banana: { whole: createShape(banana, { fit: 1, shine: 0.25 }), half: null, juice: [1, 0.95, 0.7] },
  };
}

let fruits: Record<FruitKind, Fruit> | undefined;
/** Every fruit, built once (mesh ids last for the whole app). Needs the native core. */
export function getFruits(): Record<FruitKind, Fruit> {
  fruits ??= build();
  return fruits;
}
