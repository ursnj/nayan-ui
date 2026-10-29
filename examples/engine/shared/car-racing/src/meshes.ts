// The car and the roadside tree, built in code (as Penguin Run's penguin) rather than loaded from
// files. The car is a mid-engined supercar: a low wedge nose with LED headlights in dark housings and
// vents in the bonnet, a cab-forward glasshouse, flanks that pinch at the doors and swell over the
// wheels, cut-out arches with big low-profile wheels flush inside them, and a long louvred engine deck
// under an airfoil wing on swan-neck mounts. Model units are metres: it sits on y = 0 facing -z, about
// 2.4 wide (mirrors) by 1.18 tall by 4.36 long. Three meshes, as any model: the body (white, so each car
// paints its own color), the glass, and the trim (wheels, lights, carbon, vents, exhausts) in its own colors.
import {
  lathe,
  merge,
  tube,
  type Color,
  type Geometry,
  type Model,
  type Quat,
  type Vec3,
  block,
  ellipsoid,
  loft,
  smoothCurve,
  type LoftSection as Section,
} from "@nayan-ui/engine";

type GeometryPart = Parameters<typeof merge>[0][number];
import { createGameMesh as createShape, cacheGameAsset } from "./cache";
import type { Footprint } from "./footprint";

const TAU = Math.PI * 2;
const GLASS: Color = [0.05, 0.065, 0.09];
const TREAD: Color = [0.035, 0.035, 0.04];
const SIDEWALL: Color = [0.07, 0.07, 0.075];
const GUNMETAL: Color = [0.14, 0.14, 0.16];
const SPOKE: Color = [0.72, 0.73, 0.77];
const DISC: Color = [0.32, 0.32, 0.34];
const CALIPER: Color = [0.85, 0.08, 0.06];
const CARBON: Color = [0.055, 0.055, 0.065];
const BLACK: Color = [0.025, 0.025, 0.03];
const HEADLIGHT: Color = [0.95, 0.97, 1];
const DRL: Color = [1.4, 1.4, 1.45];
const TAIL_LIGHT: Color = [0.8, 0.03, 0.03];
const TAIL_LED: Color = [1.2, 0.08, 0.06];
const CHROME: Color = [0.8, 0.81, 0.84];

/** Turns a lathe's axis (y) onto x, for wheels. */
export const AXLE_X: Quat = [0, 0, Math.SQRT1_2, Math.SQRT1_2];

export type WheelOptions = {
  /** The rim's radius as a share of the wheel's (a low-profile tyre is around 0.75). Default 0.7. */
  rim?: number;
  /** Spokes. Default 10. */
  spokes?: number;
  /** The rim's and the spokes' colors. Default gunmetal and bright silver. */
  rimColor?: Color;
  spokeColor?: Color;
  /** What shows between the spokes (the brake disc on a car; dark on a bike, as if open). Default disc grey. */
  gapColor?: Color;
  /** A red brake caliper behind the spokes, toward the front (-z) and up, as on a car. Default false. */
  caliper?: boolean;
};

/**
 * A wheel `radius` across and `width` wide around the y axis (turn it with AXLE_X): a tyre with a
 * rounded tread and darker sidewall, around a dished alloy rim with slim spokes over a brake disc.
 * Wheels don't spin in these games, so the caliper is painted where it shows.
 */
export function wheel(radius: number, width: number, options: WheelOptions = {}): Geometry {
  const h = width / 2;
  const rim = radius * (options.rim ?? 0.7);
  const spokes = options.spokes ?? 10;
  const rimColor = options.rimColor ?? GUNMETAL;
  const spokeColor = options.spokeColor ?? SPOKE;
  const gapColor = options.gapColor ?? DISC;
  const profile: [number, number][] = [
    [0.001, h * 0.45],
    [rim * 0.18, h * 0.5],
    [rim * 0.92, h * 0.86],
    [rim * 1.02, h * 0.98],
    [rim * 1.04, h],
    [radius * 0.94, h * 0.97],
    [radius * 0.995, h * 0.7],
    [radius * 1.005, 0],
    [radius * 0.995, -h * 0.7],
    [radius * 0.94, -h * 0.97],
    [rim * 1.04, -h],
    [rim * 1.02, -h * 0.98],
    [rim * 0.92, -h * 0.86],
    [rim * 0.18, -h * 0.5],
    [0.001, -h * 0.45],
  ];
  return lathe(profile, {
    segments: 48,
    color: ({ u, position: [x, , z] }) => {
      const r = Math.hypot(x, z);
      if (r > radius * 0.97) return TREAD;
      if (r > rim * 1.05) return SIDEWALL;
      if (r > rim * 0.94) return spokeColor; // the rim's polished lip
      if (r < rim * 0.14) return BLACK; // centre lock
      if (r < rim * 0.26) return rimColor;
      if (Math.cos(u * TAU * spokes) > 0.55) return spokeColor;
      if (
        options.caliper &&
        r > rim * 0.58 &&
        r < rim * 0.86 &&
        x > 0 &&
        z < 0 &&
        Math.atan2(x, -z) > 0.35 &&
        Math.atan2(x, -z) < 1.2
      )
        return CALIPER;
      return r > rim * 0.42 ? gapColor : rimColor;
    },
  });
}

// ── The car ───────────────────────────────────────────────────────────

const WHEEL_R = 0.36;
const FRONT_AXLE = -1.36;
const REAR_AXLE = 1.38;
const ARCH_R = WHEEL_R + 0.05;
const SKIRT = 0.17;

/** The body's profiles along its length (z): roof of the lower body, half widths, and the floor. */
const topLine = smoothCurve([
  [-2.18, 0.48],
  [-2.06, 0.58],
  [-1.75, 0.69],
  [-1.36, 0.8], // over the front wheels
  [-1.05, 0.78], // the scuttle, at the foot of the windscreen
  [-0.3, 0.8],
  [0.55, 0.86],
  [1.38, 0.92], // the rear haunches
  [1.9, 0.92],
  [2.1, 0.86],
  [2.18, 0.78],
]);
const halfWidth = smoothCurve([
  [-2.18, 0.84],
  [-2.02, 1.04],
  [-1.6, 1.15],
  [-1.36, 1.17], // front flares
  [-0.95, 1.11],
  [-0.15, 1.06], // the waist at the doors
  [0.6, 1.12],
  [1.1, 1.19],
  [1.4, 1.2], // rear haunches
  [1.85, 1.16],
  [2.18, 1.0],
]);
/** The floor: low along the sills, arched over each wheel. */
const floorAt = (z: number) => {
  let y = smoothCurve([
    [-2.18, 0.24],
    [-1.95, SKIRT],
    [1.95, SKIRT],
    [2.18, 0.3],
  ])(z);
  for (const axle of [FRONT_AXLE, REAR_AXLE]) {
    const d = z - axle;
    if (Math.abs(d) < ARCH_R) y = Math.max(y, WHEEL_R + Math.sqrt(ARCH_R * ARCH_R - d * d));
  }
  return y;
};

/** Sections, closely spaced around the arches so their curves come out round. */
function bodySections(): Section[] {
  const zs = new Set<number>();
  for (let z = -2.18; z < 2.18; z += 0.1) zs.add(Math.round(z * 1000) / 1000);
  zs.add(2.18);
  for (const axle of [FRONT_AXLE, REAR_AXLE])
    for (let i = 0; i <= 20; i++)
      zs.add(Math.round((axle - ARCH_R * Math.cos((i / 20) * Math.PI)) * 1000) / 1000);
  for (const axle of [FRONT_AXLE, REAR_AXLE])
    for (const d of [-ARCH_R - 0.015, ARCH_R + 0.015]) zs.add(Math.round((axle + d) * 1000) / 1000);
  return [...zs].sort((a, b) => a - b).map(sectionAt);
}

/** The body's section at `z`. */
function sectionAt(z: number): Section {
  const top = topLine(z);
  const bottom = Math.min(floorAt(z), top - 0.06);
  const width = halfWidth(z);
  const nose = Math.max(0, Math.min(1, (z + 2.18) / 0.3));
  return { z, bottom, top, width, topWidth: width * 0.86, square: 3 + 1.8 * nose };
}

/** How far out the body's side is at height `y`, `z` along it (its outline there is a superellipse). */
function surfaceX(z: number, y: number) {
  const { bottom, top, width, topWidth = width, square = 4 } = sectionAt(z);
  const py = Math.max(-1, Math.min(1, (y - (bottom + top) / 2) / ((top - bottom) / 2)));
  const px = (1 - Math.abs(py) ** square) ** (1 / square);
  return px * (py > 0 ? width + (topWidth - width) * py : width);
}

/** Door mirrors: where each stalk leaves the door (just under its surface) and where its cap sits. */
const MIRROR_Z = -0.9;
const MIRROR_BASE_Y = 0.7;
const mirrorBase = (s: number): Vec3 => [
  s * (surfaceX(MIRROR_Z, MIRROR_BASE_Y) - 0.02),
  MIRROR_BASE_Y,
  MIRROR_Z,
];
const mirrorCap = (s: number): Vec3 => [
  s * (surfaceX(MIRROR_Z, MIRROR_BASE_Y) + 0.15),
  MIRROR_BASE_Y + 0.08,
  MIRROR_Z + 0.04,
];

/** The glasshouse, narrowing above a painted shoulder: a steep wrapped windscreen and a fastback onto the deck. */
const CABIN: Section[] = [
  { z: -1.06, bottom: 0.55, top: 0.79, width: 0.82, topWidth: 0.78 },
  { z: -0.72, bottom: 0.55, top: 0.95, width: 0.8, topWidth: 0.62 },
  { z: -0.3, bottom: 0.55, top: 1.09, width: 0.79, topWidth: 0.55 },
  { z: 0.05, bottom: 0.55, top: 1.12, width: 0.78, topWidth: 0.53 },
  { z: 0.45, bottom: 0.55, top: 1.1, width: 0.79, topWidth: 0.55 },
  { z: 0.95, bottom: 0.6, top: 1.0, width: 0.8, topWidth: 0.62 },
  { z: 1.4, bottom: 0.7, top: 0.93, width: 0.86, topWidth: 0.8 },
];
/** The painted roof panel, flush over the glass. */
const ROOF: Section[] = [
  { z: -0.36, bottom: 1.07, top: 1.09, width: 0.44, square: 6 },
  { z: -0.2, bottom: 1.09, top: 1.13, width: 0.52, square: 6 },
  { z: 0.42, bottom: 1.09, top: 1.125, width: 0.53, square: 6 },
  { z: 0.66, bottom: 1.05, top: 1.07, width: 0.46, square: 6 },
];

const yaw = (a: number): Quat => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
const pitch = (a: number): Quat => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
const mul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

/** The rear wing: a cambered airfoil across the car (lofted along its span, then turned across). */
function wingGeometry(span: number, chord: number, thickness: number): Geometry {
  const sections: Section[] = [-1, -0.92, 0, 0.92, 1].map((t) => ({
    z: (t * span) / 2,
    bottom: -thickness / 2,
    top: thickness / 2,
    width: (chord / 2) * (Math.abs(t) > 0.95 ? 0.94 : 1),
    square: 2.6,
  }));
  return loft(sections, { around: 20, smoothness: 2, color: CARBON });
}

export type CarMeshes = { body: Model; glass: Model; trim: Model };
let car: CarMeshes | null = null;

/** The car's three meshes, built once per app. */
export function carMeshes(): CarMeshes {
  return cacheGameAsset("car-racing/CarMeshes:carMeshes", () => carMeshesUncached());
}

function carMeshesUncached(): CarMeshes {
  if (car) return car;
  // Paint darkens toward the sills, so the flanks read as curved under any color
  const shell = loft(bodySections(), {
    around: 56,
    smoothness: 2,
    color: ([, y]) => {
      const k = 0.62 + 0.38 * Math.max(0, Math.min(1, (y - 0.18) / 0.34));
      return [k, k, k];
    },
  });
  const bodyParts: GeometryPart[] = [
    { geometry: shell },
    { geometry: loft(ROOF, { around: 32, smoothness: 3 }) },
  ];
  // Mirror caps in the body color
  for (const s of [-1, 1])
    bodyParts.push({ geometry: ellipsoid([0.09, 0.05, 0.12]), position: mirrorCap(s) });
  const body = createShape(merge(bodyParts), { center: false, shine: 0.9 });
  const glass = createShape(loft(CABIN, { around: 40, smoothness: 4, color: GLASS }), {
    center: false,
    shine: 0.95,
  });

  const parts: GeometryPart[] = [];
  const front = wheel(WHEEL_R, 0.26, { rim: 0.76, spokes: 10, caliper: true });
  const rear = wheel(WHEEL_R, 0.31, { rim: 0.76, spokes: 10, caliper: true });
  const liner = lathe(
    [
      [0.001, 0.01],
      [WHEEL_R + 0.03, 0.01],
      [WHEEL_R + 0.03, -0.01],
      [0.001, -0.01],
    ],
    { segments: 24, color: BLACK },
  );
  const hoodY = (z: number) => topLine(z) + 0.004;
  for (const s of [-1, 1]) {
    parts.push(
      { geometry: front, position: [s * 0.98, WHEEL_R, FRONT_AXLE], rotation: AXLE_X },
      { geometry: rear, position: [s * 0.97, WHEEL_R, REAR_AXLE], rotation: AXLE_X },
      // Dark wheel wells behind the wheels
      { geometry: liner, position: [s * 0.8, WHEEL_R + 0.03, FRONT_AXLE], rotation: AXLE_X },
      { geometry: liner, position: [s * 0.78, WHEEL_R + 0.03, REAR_AXLE], rotation: AXLE_X },
      // LED headlights in dark housings, a daytime-running-light strip along their top edge
      {
        geometry: ellipsoid([0.3, 0.05, 0.09], BLACK),
        position: [s * 0.64, 0.555, -2.04],
        rotation: yaw(s * 0.32),
      },
      {
        geometry: ellipsoid([0.26, 0.034, 0.08], HEADLIGHT),
        position: [s * 0.64, 0.555, -2.06],
        rotation: yaw(s * 0.32),
      },
      {
        geometry: block(0.32, 0.012, 0.02, 6, DRL),
        position: [s * 0.62, 0.585, -2.08],
        rotation: yaw(s * 0.32),
      },
      // Intakes either side of the nose, vents in the bonnet, and vents behind the front wheels
      {
        geometry: block(0.46, 0.14, 0.08, 6, BLACK),
        position: [s * 0.52, 0.34, -2.14],
        rotation: yaw(s * 0.15),
      },
      {
        geometry: block(0.3, 0.012, 0.16, 6, BLACK),
        position: [s * 0.36, hoodY(-1.58), -1.58],
        rotation: pitch(-0.27),
      },
      ...[0.47, 0.53, 0.59].map((y): GeometryPart => ({
        geometry: block(0.016, 0.022, 0.2, 6, BLACK),
        position: [s * (halfWidth(-0.84) - 0.01), y, -0.84 + (y - 0.53) * 0.4],
      })),
      // Side intakes ahead of the rear wheels, carbon side skirts
      { geometry: ellipsoid([0.02, 0.08, 0.3], BLACK), position: [s * 1.115, 0.58, 0.72] },
      { geometry: block(0.06, 0.06, 2.0, 6, CARBON), position: [s * 1.05, 0.2, 0.01] },
      // Carbon mirror stalks to the body-colored caps
      {
        geometry: tube(
          [
            mirrorBase(s),
            [s * (surfaceX(MIRROR_Z, MIRROR_BASE_Y) + 0.05), MIRROR_BASE_Y + 0.06, MIRROR_Z + 0.02],
            mirrorCap(s),
          ],
          {
            radius: 0.02,
            sides: 8,
            smoothness: 3,
          },
        ),
        color: CARBON,
      },
      // Wing endplates and swan-neck mounts over the top of the wing
      { geometry: block(0.012, 0.16, 0.34, 6, CARBON), position: [s * 0.87, 1.07, 1.98] },
      {
        geometry: tube(
          [
            [s * 0.42, 0.93, 2.04],
            [s * 0.42, 1.08, 1.96],
            [s * 0.42, 1.115, 1.99],
          ],
          {
            radius: 0.018,
            shape: (a) => 0.45 + 0.55 * Math.abs(Math.cos(a * TAU)),
            sides: 10,
            smoothness: 4,
          },
        ),
        color: CARBON,
      },
      // Tail lights: a slim red LED at each corner, curving down the rear
      {
        geometry: tube(
          [
            [s * 0.62, 0.79, 2.17],
            [s * 0.86, 0.79, 2.15],
            [s * 0.96, 0.72, 2.11],
            [s * 0.94, 0.62, 2.09],
          ],
          { radius: 0.022, sides: 8, smoothness: 4 },
        ),
        color: TAIL_LED,
      },
    );
    // Quad exhausts, chrome with dark bores
    for (const x of [0.2, 0.34]) {
      parts.push({
        geometry: tube(
          [
            [s * x, 0.3, 2.04],
            [s * x, 0.3, 2.2],
          ],
          { radius: 0.042, sides: 14, smoothness: 1, color: CHROME, capColor: BLACK },
        ),
      });
    }
  }
  parts.push(
    {
      geometry: wingGeometry(1.74, 0.3, 0.035),
      position: [0, 1.1, 1.98],
      rotation: mul(pitch(0.08), yaw(Math.PI / 2)),
    }, // the wing
    { geometry: block(1.85, 0.035, 0.26, 8, CARBON), position: [0, 0.19, -2.04] }, // front splitter
    { geometry: block(0.5, 0.09, 0.06, 6, BLACK), position: [0, 0.31, -2.18] }, // centre intake
    { geometry: block(1.24, 0.03, 0.04, 8, TAIL_LIGHT), position: [0, 0.79, 2.18] }, // light bar between the tail lights
    { geometry: block(1.1, 0.08, 0.03, 6, BLACK), position: [0, 0.5, 2.18] }, // rear mesh panel
    { geometry: block(1.62, 0.13, 0.26, 6, CARBON), position: [0, 0.24, 2.06] }, // diffuser
    { geometry: block(1.84, 0.12, 3.5, 4, BLACK), position: [0, 0.22, 0] }, // undertray
  );
  // Diffuser fins and engine-cover louvres
  for (let i = -2; i <= 2; i++)
    parts.push({ geometry: block(0.02, 0.1, 0.22, 4, BLACK), position: [i * 0.28, 0.25, 2.08] });
  for (let i = 0; i < 6; i++)
    parts.push({
      geometry: block(0.9, 0.012, 0.035, 4, BLACK),
      position: [0, 0.93, 1.48 + i * 0.075],
    });
  const trim = createShape(merge(parts), { center: false, shine: 0.4 });
  car = { body, glass, trim };
  return car;
}

/**
 * The car's outline from above, for collisions: the body's own half widths along its length (the
 * mirrors fold in on contact, so they don't count), a couple of centimetres inside the paint.
 */
export const CAR_FOOTPRINT: Footprint = {
  length: 4.36,
  halfWidth: (z) => Math.max(0, halfWidth(z) - 0.03),
};

/** Where the car's lamps are (for the night glow over them): the headlights' centres and the tail-light bar. */
export const CAR_LAMPS = {
  headlights: [-0.64, 0.64].map((x): Vec3 => [x, 0.555, -2.08]),
  headlightSize: [0.46, 0.06, 0.04] as Vec3,
  tail: [0, 0.79, 2.2] as Vec3,
  tailSize: [1.9, 0.04, 0.03] as Vec3,
};

// ── The roadside tree ─────────────────────────────────────────────────

const BARK: Color = [0.45, 0.3, 0.18];
const NEEDLES_DARK: Color = [0.25, 0.6, 0.3];
const NEEDLES: Color = [0.32, 0.7, 0.35];

let tree: Model | null = null;
/** A low-poly pine about 1.2 tall and 1.5 across, its base at the origin: a trunk under three tiers. */
export function treeMesh(): Model {
  return cacheGameAsset("car-racing/CarMeshes:treeMesh", () => treeMeshUncached());
}

function treeMeshUncached(): Model {
  if (tree) return tree;
  const trunk = lathe(
    [
      [0.001, 0.4],
      [0.07, 0.4],
      [0.09, 0],
      [0.001, 0],
    ],
    { segments: 8, color: BARK },
  );
  const tier = (bottom: number, top: number, radius: number, color: Color): GeometryPart => ({
    geometry: lathe(
      [
        [0.001, top],
        [radius, bottom],
        [0.001, bottom],
      ],
      { segments: 7, color },
    ),
  });
  tree = createShape(
    merge([
      { geometry: trunk },
      tier(0.22, 0.72, 0.75, NEEDLES_DARK),
      tier(0.5, 0.98, 0.56, NEEDLES),
      tier(0.76, 1.2, 0.36, NEEDLES_DARK),
    ]),
    {
      center: false,
    },
  );
  return tree;
}
