"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Color,
  type FieldGraph,
  type FieldInput,
  type GeometryPart,
  lathe,
  merge,
  type Model,
  shapeGeometry,
  surfaceColor,
  tube,
  type Vec3,
  type Entity,
  type Keyframe,
  type Quat,
  quat,
  type World,
  GameView,
  useWorld,
  createShape,
  type Camera,
} from "@nayan-ui/engine";

// Geometry and all ten native keyframe clips are copied from ../playtura's Penguin Run.
// Only the game-specific mesh cache wrapper is replaced by the original module-level caches.
// The cartoon penguin's meshes: a glossy navy body and big round head (one mesh, with the heart-shaped
// white face, oval belly, huge shiny eyes, rosy cheeks, orange beak, head tufts and tail all baked
// in), paddle flippers and chunky orange feet on short legs. Model units: the bird is about 1 tall,
// the body's origin is the pelvis (0.36 above the ground).

type RGB = [number, number, number];
const NAVY: RGB = [0.06, 0.08, 0.14];
const NAVY_SHEEN: RGB = [0.16, 0.2, 0.32];
const CREAM: RGB = [1, 0.98, 0.93];
const CREAM_SHADE: RGB = [0.88, 0.9, 0.95];
const ORANGE: RGB = [1, 0.62, 0.12];
const ORANGE_DARK: RGB = [0.92, 0.42, 0.08];
const IRIS: RGB = [0.18, 0.5, 0.95];
const IRIS_DARK: RGB = [0.06, 0.2, 0.55];
const rgba = (c: RGB, a = 1): Color => [c[0], c[1], c[2], a];

const mix = (a: RGB, b: RGB, t: number): RGB => {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};
/** `mix` on fields (evaluated per vertex by the native core): t clamped to 0..1 as well. */
type Mixed = readonly [FieldInput, FieldInput, FieldInput];
const mixF = (f: FieldGraph, a: Mixed, b: Mixed, t: FieldInput): Mixed => {
  const k = f.clamp(t, 0, 1);
  return [f.mix(a[0], b[0], k), f.mix(a[1], b[1], k), f.mix(a[2], b[2], k)];
};

/** An ellipse profile (rx across, ry tall, centred at cy), top to bottom, for `lathe`. */
const ellipse = (rx: number, ry: number, cy: number, n = 28): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = Math.PI / 2 - (i / n) * Math.PI;
    return [Math.max(0.001, Math.cos(a) * rx), cy + Math.sin(a) * ry];
  });

// Head: an ellipsoid sitting on the body
const HEAD_Y = 0.49;
const HEAD_RX = 0.25;
const HEAD_RY = 0.225;
/** Depth of the head's front surface at (x, y), for placing features on it. */
const headZ = (x: number, y: number) =>
  HEAD_RX * Math.sqrt(Math.max(0, 1 - (x / HEAD_RX) ** 2 - ((y - HEAD_Y) / HEAD_RY) ** 2));

/** 1 inside `edge`, 0 outside, blended over `soft`. */
const insideF = (f: FieldGraph, d: FieldInput, edge: number, soft: number) =>
  f.clamp(f.add(f.div(f.sub(edge, d), soft), 0.5), 0, 1);

/** Body: navy with a sheen up the back, and a cream oval belly in front. */
const bodyColor = surfaceColor((f, { x, y, z }) => {
  const base = mixF(
    f,
    NAVY,
    NAVY_SHEEN,
    f.product(f.add(y, 0.3), 0.6, f.max(0, f.add(f.div(f.neg(z), 0.3), 0.3))),
  );
  const e = f.sqrt(f.add(f.square(f.div(x, 0.235)), f.square(f.div(f.add(y, 0.04), 0.255))));
  const belly = f.mul(insideF(f, e, 1, 0.06), insideF(f, f.neg(z), -0.04, 0.04));
  return mixF(f, base, mixF(f, CREAM_SHADE, CREAM, f.mul(f.add(y, 0.25), 2)), belly);
});

/** Head: navy, with a heart-shaped white face (two rounded lobes over the eyes, a round chin). */
const headColor = surfaceColor((f, { x, y, z }) => {
  const base = mixF(f, NAVY, NAVY_SHEEN, f.mul(f.max(0, f.div(f.sub(y, HEAD_Y), HEAD_RY)), 0.5));
  const lobe = f.min(
    f.div(f.hypot(f.sub(x, 0.072), f.sub(y, 0.53)), 0.1),
    f.div(f.hypot(f.add(x, 0.072), f.sub(y, 0.53)), 0.1),
  );
  const chin = f.div(f.hypot(f.div(x, 1.15), f.sub(y, 0.44)), 0.115);
  const face = f.mul(insideF(f, f.min(lobe, chin), 1, 0.08), insideF(f, f.neg(z), -0.06, 0.04));
  return mixF(f, base, CREAM, face);
});

/** A feature on the face: an ellipsoid at (x, y), pushed `out` from the head's surface. */
const onFace = (
  x: number,
  y: number,
  scale: Vec3 | number,
  out: number,
  color: Color,
): GeometryPart => ({
  geometry: shapeGeometry("sphere"),
  position: [x, y, headZ(x, y) + out],
  scale,
  color,
});

function eye(side: number): GeometryPart[] {
  const x = side * 0.074;
  const y = 0.525;
  return [
    // Sclera, iris (lighter toward the bottom), pupil, a big and a small highlight
    onFace(x, y, [0.1, 0.122, 0.05], -0.012, rgba([1, 1, 1])),
    onFace(x + side * 0.004, y - 0.006, [0.07, 0.08, 0.03], 0.004, rgba(IRIS_DARK)),
    onFace(x + side * 0.004, y - 0.012, [0.058, 0.06, 0.03], 0.008, rgba(IRIS)),
    onFace(x + side * 0.004, y - 0.006, [0.036, 0.042, 0.03], 0.013, rgba([0.02, 0.02, 0.04])),
    onFace(x - 0.014, y + 0.014, 0.024, 0.024, [1.8, 1.8, 1.8, 1]),
    onFace(x + 0.016, y - 0.022, 0.011, 0.022, [1.6, 1.6, 1.6, 1]),
    // A soft brow arching over each eye
    {
      geometry: tube(
        [
          [x + side * 0.05, y + 0.068, headZ(x + side * 0.05, y + 0.068) + 0.004],
          [x, y + 0.085, headZ(x, y + 0.085) + 0.006],
          [x - side * 0.045, y + 0.075, headZ(x - side * 0.045, y + 0.075) + 0.004],
        ],
        { radius: (t) => 0.009 + Math.sin(t * Math.PI) * 0.005, sides: 6, color: rgba(NAVY) },
      ),
    },
  ];
}

/** The beak: a rounded upper bill with a curved tip, a smaller lower bill and a dark mouth line. */
function beak(): GeometryPart[] {
  const z = headZ(0, 0.46);
  const wide = (a: number) => 1 + 0.45 * Math.abs(Math.cos(a * Math.PI * 2));
  return [
    {
      geometry: tube(
        [
          [0, 0.468, z - 0.03],
          [0, 0.464, z + 0.03],
          [0, 0.452, z + 0.075],
          [0, 0.44, z + 0.09],
        ],
        {
          radius: (t) => 0.048 * (1 - t * 0.85),
          shape: wide,
          sides: 16,
          color: surfaceColor((f, { v }) => mixF(f, ORANGE, ORANGE_DARK, f.mul(v, 0.6))),
        },
      ),
    },
    {
      geometry: tube(
        [
          [0, 0.436, z - 0.03],
          [0, 0.434, z + 0.02],
          [0, 0.432, z + 0.05],
        ],
        { radius: (t) => 0.03 * (1 - t * 0.8), shape: wide, sides: 14, color: rgba(ORANGE_DARK) },
      ),
    },
  ];
}

/** Three little feather tufts curling forward off the top of the head. */
const tufts = (): GeometryPart[] =>
  [-1, 0, 1].map((i) => ({
    geometry: tube(
      [
        [i * 0.035, HEAD_Y + HEAD_RY - 0.03, -0.02],
        [i * 0.05, HEAD_Y + HEAD_RY + 0.04, 0.0 - Math.abs(i) * 0.01],
        [i * 0.065, HEAD_Y + HEAD_RY + 0.07, 0.05],
      ],
      {
        radius: (t) => 0.022 * (1 - t * 0.85) * (i === 0 ? 1.15 : 0.9),
        sides: 8,
        color: rgba(NAVY),
      },
    ),
  }));

/** A stubby tail at the back. */
const tail = (): GeometryPart => ({
  geometry: tube(
    [
      [0, -0.2, -0.26],
      [0, -0.27, -0.33],
      [0, -0.3, -0.38],
    ],
    {
      radius: (t) => 0.07 * (1 - t * 0.8),
      shape: (a) => 0.4 + 0.6 * Math.abs(Math.cos(a * Math.PI * 2)),
      sides: 12,
      color: rgba(NAVY),
    },
  ),
});

let bodyModel: Model | null = null;
/** The one-piece body: torso, head and every face detail in a single mesh. */
export function bodyMesh(): Model {
  return bodyMeshUncached();
}

function bodyMeshUncached(): Model {
  if (bodyModel) return bodyModel;
  // A pear-shaped torso, widest low down
  const torso = lathe(
    [
      [0.001, 0.42],
      [0.14, 0.4],
      [0.18, 0.34],
      [0.2, 0.29],
      [0.225, 0.24],
      [0.258, 0.17],
      [0.284, 0.09],
      [0.302, 0.0],
      [0.306, -0.08],
      [0.296, -0.16],
      [0.268, -0.24],
      [0.215, -0.3],
      [0.13, -0.33],
      [0.001, -0.338],
    ],
    { segments: 64, color: bodyColor },
  );
  const head = lathe(ellipse(HEAD_RX, HEAD_RY, HEAD_Y, 32), { segments: 64, color: headColor });
  bodyModel = createShape(
    merge([
      { geometry: torso },
      { geometry: head },
      ...eye(-1),
      ...eye(1),
      ...beak(),
      ...tufts(),
      tail(),
    ]),
    {
      center: false,
      optimize: true,
      shine: 0.55,
    },
  );
  return bodyModel;
}

const flipperModels: Partial<Record<-1 | 1, Model>> = {};
/** A paddle flipper hanging from its shoulder (origin): glossy navy outside, cream inside; `side` -1 is the left. */
export function flipperMesh(side: -1 | 1): Model {
  return flipperMeshUncached(side);
}

function flipperMeshUncached(side: -1 | 1): Model {
  const cached = flipperModels[side];
  if (cached) return cached;
  const g = tube(
    [
      [-side * 0.07, 0.05, 0],
      [-side * 0.01, 0.02, 0],
      [side * 0.02, -0.08, 0.01],
      [side * 0.022, -0.17, 0.005],
      [side * 0.01, -0.24, -0.01],
      [-side * 0.006, -0.27, -0.015],
    ],
    {
      radius: (t) => 0.06 * Math.sin(0.6 + t * 2.2) + 0.012,
      shape: (a) => 0.32 + 0.68 * Math.abs(Math.cos(a * Math.PI * 2)),
      sides: 18,
      smoothness: 10,
      // Cream where the flipper faces in (nx · side < -0.25), navy elsewhere.
      color: surfaceColor((f, { nx }) => {
        const facing = f.add(f.mul(nx, side), 0.25);
        const pick = (k: 0 | 1 | 2) => f.select(f.neg(facing), NAVY[k], CREAM_SHADE[k]);
        return [pick(0), pick(1), pick(2)];
      }),
    },
  );
  const model = createShape(g, { center: false, optimize: true, shine: 0.5 });
  flipperModels[side] = model;
  return model;
}

let footModel: Model | null = null;
/** A chunky orange foot from its heel (origin) forward: a rounded pad and three plump toes. */
export function footMesh(): Model {
  return footMeshUncached();
}

function footMeshUncached(): Model {
  if (footModel) return footModel;
  const sphere = shapeGeometry("sphere");
  const toes: GeometryPart[] = [-0.42, 0, 0.42].map((a) => ({
    geometry: tube(
      [
        [0, 0.03, 0.04],
        [Math.sin(a) * 0.05, 0.026, 0.09],
        [Math.sin(a) * 0.08, 0.022, 0.135],
      ],
      { radius: (t) => 0.032 - t * 0.008, sides: 10, color: rgba(ORANGE) },
    ),
  }));
  const tips: GeometryPart[] = [-0.42, 0, 0.42].map((a) => ({
    geometry: sphere,
    position: [Math.sin(a) * 0.08, 0.022, 0.135],
    scale: 0.048,
    color: rgba(ORANGE),
  }));
  // A short, stout leg from the heel up into the body (its top hidden inside it): orange at the ankle,
  // feathered navy above, so the foot always reads as joined on, even mid-step
  const leg: GeometryPart = {
    geometry: tube(
      [
        [0, 0.04, 0.02],
        [0, 0.12, 0.0],
        [0, 0.22, -0.01],
      ],
      {
        radius: (t) => 0.045 + t * 0.04,
        sides: 12,
        color: surfaceColor((f, { v }) => {
          // Orange toes up to v = 0.35, then the navy leg.
          const toes = mixF(f, ORANGE_DARK, ORANGE, f.mul(v, 2));
          const pick = (k: 0 | 1 | 2) => f.select(f.sub(0.35, v), NAVY[k], toes[k]);
          return [pick(0), pick(1), pick(2)];
        }),
      },
    ),
  };
  footModel = createShape(
    merge([
      leg,
      {
        geometry: sphere,
        position: [0, 0.03, 0.05],
        scale: [0.15, 0.06, 0.16],
        color: rgba(mix(ORANGE, ORANGE_DARK, 0.3)),
      },
      ...toes,
      ...tips,
    ]),
    {
      center: false,
      optimize: true,
      shine: 0.35,
    },
  );
  return footModel;
}

/** Reusable assets; the game loader advances one builder per frame. */
export function* warmAssets(): Iterable<() => unknown> {
  yield bodyMesh;
  yield footMesh;
  yield () => flipperMesh(-1);
  yield () => flipperMesh(1);
}

// The procedural penguin and animation library copied from Playtura’s Penguin Run. We rig
// this example as attached entities: a root on
// the ground (moves and turns the whole bird), a pelvis (waddle, lean, crouch), the one-piece body
// (head, face, eyes, beak, belly, tufts and tail in one mesh), two flippers hinged at the
// shoulders and two feet. Every clip runs as keyframes in the engine's Rust core: no per-frame JS.
//
//   const p = spawnPenguin(world, [0, 0, 0], 1.6);
//   playPenguin(world, p, 'walk');            // loops until another clip
//   await playPenguin(world, p, 'punch');     // one-shots resolve when done

export type PenguinAnim =
  | "idle"
  | "walk"
  | "run"
  | "punch"
  | "jab"
  | "jump"
  | "slide"
  | "hit"
  | "dance"
  | "dead";

/** Clips that loop until another one starts. */
export const LOOPING: ReadonlySet<PenguinAnim> = new Set(["idle", "walk", "run", "dance"]);

/** How long each one-shot clip runs, in seconds. */
export const CLIP_TIME: Record<PenguinAnim, number> = {
  idle: 5,
  walk: 0.9,
  run: 0.44,
  punch: 0.52,
  jab: 0.4,
  jump: 0.95,
  slide: 1.35,
  hit: 0.75,
  dance: 1.1,
  dead: 1.7,
};

export type Penguin = {
  root: Entity;
  pelvis: Entity;
  body: Entity;
  flipperL: Entity;
  flipperR: Entity;
  footL: Entity;
  footR: Entity;
  /** Where the root stands (ground x), kept in step with root moves. */
  x: number;
  /** The yaw the root faces, radians (0 looks at the camera). */
  yaw: number;
  anim: PenguinAnim | null;
};

// ── Rest pose (model units: the bird is about 1 tall) ────────────────

const PELVIS_Y = 0.39;
const BODY_SCALE: Vec3 = [0.94, 1.15, 0.94];
const SHOULDER: Vec3 = [0.246, 0.18, 0.0];
const FOOT: Vec3 = [0.12, 0.0, 0.06];
const IDENTITY: Quat = [0, 0, 0, 1];

/** Left flipper: positive `out` swings it away from the body (around z), `fwd` forward (around x, negative is forward). */
const flipL = (fwd: number, out: number, twist = 0) => quat.fromEuler(fwd, twist, -out);
const flipR = (fwd: number, out: number, twist = 0) => quat.fromEuler(fwd, -twist, out);
const REST_L = flipL(0, 0.14);
const REST_R = flipR(0, 0.14);
const pelvisAt = (y = 0, z = 0): Vec3 => [0, PELVIS_Y + y, z];
const footLAt = (y = 0, z = 0): Vec3 => [-FOOT[0], FOOT[1] + y, FOOT[2] + z];
const footRAt = (y = 0, z = 0): Vec3 => [FOOT[0], FOOT[1] + y, FOOT[2] + z];
const FOOT_L_REST = quat.y(-0.18);
const FOOT_R_REST = quat.y(0.18);

/** Builds the meshes ahead of time (each is made once per app). */
export function preparePenguin() {
  bodyMesh();
  flipperMesh(-1);
  flipperMesh(1);
  footMesh();
}

// ── Rig ───────────────────────────────────────────────────────────────

/** Spawns a penguin standing at `position` (feet on the ground), `size` units tall, facing the camera. */
export function spawnPenguin(
  world: World,
  position: Vec3,
  size = 1,
  tint: Color = [1, 1, 1, 1],
): Penguin {
  const root = world.spawn({ mesh: "none", position, scale: size, pickable: false });
  const pelvis = world.spawn({ mesh: "none", parent: root, position: pelvisAt(), pickable: false });
  const body = world.spawn({
    mesh: bodyMesh(),
    parent: pelvis,
    position: [0, 0, 0],
    scale: BODY_SCALE,
    color: tint,
    pickable: false,
  });
  const flipperL = world.spawn({
    mesh: flipperMesh(-1),
    parent: pelvis,
    position: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]],
    rotation: REST_L,
    color: tint,
    pickable: false,
  });
  const flipperR = world.spawn({
    mesh: flipperMesh(1),
    parent: pelvis,
    position: [SHOULDER[0], SHOULDER[1], SHOULDER[2]],
    rotation: REST_R,
    color: tint,
    pickable: false,
  });
  const footL = world.spawn({
    mesh: footMesh(),
    parent: root,
    position: footLAt(),
    rotation: FOOT_L_REST,
    color: tint,
    pickable: false,
  });
  const footR = world.spawn({
    mesh: footMesh(),
    parent: root,
    position: footRAt(),
    rotation: FOOT_R_REST,
    color: tint,
    pickable: false,
  });
  return {
    root,
    pelvis,
    body,
    flipperL,
    flipperR,
    footL,
    footR,
    x: position[0],
    yaw: 0,
    anim: null,
  };
}

const parts = (p: Penguin) => [p.pelvis, p.flipperL, p.flipperR, p.footL, p.footR];

/** Puts every limb back in its rest pose over `duration` seconds (0 snaps). */
function toRest(world: World, p: Penguin, duration: number) {
  for (const e of parts(p)) world.stopAnimation(e);
  const rest: [Entity, Vec3, Quat][] = [
    [p.pelvis, pelvisAt(), IDENTITY],
    [p.flipperL, [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], REST_L],
    [p.flipperR, [SHOULDER[0], SHOULDER[1], SHOULDER[2]], REST_R],
    [p.footL, footLAt(), FOOT_L_REST],
    [p.footR, footRAt(), FOOT_R_REST],
  ];
  for (const [e, position, rotation] of rest) {
    if (duration <= 0) world.set(e, { position, rotation, ...(e === p.pelvis && { scale: 1 }) });
    else
      world.animate(
        e,
        { position, rotation, ...(e === p.pelvis && { scale: 1 }) },
        { duration, easing: "easeOut" },
      );
  }
}

/** Turns the whole bird to `yaw` (0 faces the camera, π/2 faces +x). */
export function facePenguin(world: World, p: Penguin, yaw: number, duration = 0.12) {
  p.yaw = yaw;
  if (duration <= 0) world.set(p.root, { rotation: quat.y(yaw) });
  else world.animate(p.root, { rotation: quat.y(yaw) }, { duration });
}

/** Walks, runs or slides the root to ground x over `duration` (the limbs play whatever clip is on). */
export function movePenguin(
  world: World,
  p: Penguin,
  x: number,
  duration: number,
  easing: "linear" | "easeOut" | "easeInOut" = "linear",
) {
  p.x = x;
  return world.animate(p.root, { position: [x, 0, 0] }, { duration, easing });
}

/** Snaps the bird to ground x, upright and facing `yaw`, every limb at rest (a new run). */
export function placePenguin(world: World, p: Penguin, x: number, yaw = 0) {
  world.stopAnimation(p.root);
  p.x = x;
  world.set(p.root, { position: [x, 0, 0] });
  facePenguin(world, p, yaw, 0);
  toRest(world, p, 0);
  p.anim = null;
}

const BLEND = 0.12;

// Pose helpers for the clips: pelvis offset and lean, foot placement with toe pitch
const hip = (x: number, y: number, z: number): Vec3 => [x, PELVIS_Y + y, z];
const lean = (rx: number, ry: number, rz: number) => quat.fromEuler(rx, ry, rz);
const footRot = (side: -1 | 1, pitch: number, yaw = 0) =>
  quat.fromEuler(pitch, side * 0.18 + yaw, 0);
const k = (at: number, frame: Omit<Keyframe, "at">): Keyframe => ({ ...frame, at });
/** The jump's height (model units) through the clip: on the ground until take-off at 0.26, landing at 0.78. */
const AIR: [number, number][] = [
  [0, 0],
  [0.26, 0],
  [0.4, 0.72],
  [0.52, 0.95],
  [0.64, 0.72],
  [0.78, 0],
  [1, 0],
];
const airAt = (t: number) => {
  for (let i = 1; i < AIR.length; i++) {
    const [t1, h1] = AIR[i]!;
    const [t0, h0] = AIR[i - 1]!;
    if (t <= t1) return h0 + ((h1 - h0) * (t - t0)) / Math.max(1e-6, t1 - t0);
  }
  return 0;
};

/**
 * Plays a clip. Looping clips (idle, walk, run, dance) run until the next call and resolve at once;
 * one-shots resolve when they end. `speed` scales the clip's pace.
 *
 * Every clip is keyed for weight and timing rather than evenly: a beat of anticipation before each
 * action, a fast action, overshoot and a settle after it; feet planted while the body shifts its
 * weight over them; flippers trailing the body's moves (overlapping action); squash on landings and
 * stretch on take-offs. Curves run through the keys smoothly.
 */
export function playPenguin(world: World, p: Penguin, anim: PenguinAnim, speed = 1): Promise<void> {
  if (p.anim === anim && LOOPING.has(anim)) return Promise.resolve();
  p.anim = anim;
  toRest(world, p, BLEND);
  const T = CLIP_TIME[anim] / speed;
  const loop = {
    duration: T,
    repeat: "forever" as const,
    delay: BLEND,
    easing: "linear" as const,
    path: "smooth" as const,
  };
  const once = { duration: T, delay: BLEND, easing: "linear" as const, path: "smooth" as const };
  const a = (e: Entity, keys: Keyframe[], o: Parameters<World["animate"]>[2]) =>
    world.animate(e, keys, o);
  const { pelvis, flipperL: fl, flipperR: fr, footL, footR } = p;

  switch (anim) {
    case "idle": {
      // A slow, alive stand: breathing, a glance left, a glance right, a flipper twitch, a weight shift
      a(
        pelvis,
        [
          k(0, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
          k(0.12, {
            position: hip(0, 0.012, 0),
            rotation: lean(-0.02, 0, 0),
            scale: [1.01, 1.03, 1.01],
          }),
          k(0.26, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
          k(0.36, { position: hip(0.006, 0, 0), rotation: lean(0.04, 0.42, -0.04), scale: 1 }),
          k(0.5, {
            position: hip(0.006, 0.01, 0),
            rotation: lean(0.02, 0.38, -0.04),
            scale: [1.01, 1.025, 1.01],
          }),
          k(0.58, { position: hip(-0.006, 0, 0), rotation: lean(0.04, -0.36, 0.04), scale: 1 }),
          k(0.72, {
            position: hip(-0.006, 0.01, 0),
            rotation: lean(0.02, -0.33, 0.04),
            scale: [1.01, 1.025, 1.01],
          }),
          k(0.8, { position: hip(-0.012, 0, 0), rotation: lean(0, 0, 0.05), scale: 1 }),
          k(0.9, {
            position: hip(0, 0.012, 0),
            rotation: lean(-0.02, 0, 0),
            scale: [1.01, 1.03, 1.01],
          }),
          k(1, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
        ],
        loop,
      );
      a(
        fl,
        [
          k(0, { rotation: REST_L }),
          k(0.12, { rotation: flipL(0.02, 0.2) }),
          k(0.26, { rotation: REST_L }),
          k(0.4, { rotation: REST_L }),
          k(0.44, { rotation: flipL(-0.1, 0.55) }),
          k(0.48, { rotation: flipL(0, 0.25) }),
          k(0.51, { rotation: flipL(-0.05, 0.45) }),
          k(0.58, { rotation: REST_L }),
          k(0.9, { rotation: flipL(0.02, 0.2) }),
          k(1, { rotation: REST_L }),
        ],
        loop,
      );
      a(
        fr,
        [
          k(0, { rotation: REST_R }),
          k(0.12, { rotation: flipR(0.02, 0.2) }),
          k(0.26, { rotation: REST_R }),
          k(0.64, { rotation: REST_R }),
          k(0.68, { rotation: flipR(0.15, 0.5) }),
          k(0.74, { rotation: REST_R }),
          k(0.9, { rotation: flipR(0.02, 0.2) }),
          k(1, { rotation: REST_R }),
        ],
        loop,
      );
      // Settling the weight: one foot shuffles as the body shifts onto the other
      a(
        footR,
        [
          k(0, { position: footRAt() }),
          k(0.78, { position: footRAt() }),
          k(0.82, { position: footRAt(0.025, 0.02) }),
          k(0.86, { position: footRAt() }),
          k(1, { position: footRAt() }),
        ],
        loop,
      );
      return Promise.resolve();
    }

    case "walk":
    case "run": {
      const run = anim === "run";
      // The waddle: the body rolls and slides over whichever foot is planted, twisting a little with
      // each step; the free foot lifts low (walk) or high (run), swings forward and lands flat.
      const sway = run ? 0.025 : 0.04;
      const roll = run ? 0.09 : 0.15;
      const twist = run ? 0.04 : 0.08;
      const pitch = run ? 0.4 : 0.05;
      const low = run ? -0.025 : -0.005;
      const high = run ? 0.06 : 0.025;
      a(
        pelvis,
        [
          k(0, { position: hip(-sway, low, 0), rotation: lean(pitch, twist, roll) }),
          k(0.25, { position: hip(0, high, 0), rotation: lean(pitch + 0.02, 0, 0) }),
          k(0.5, { position: hip(sway, low, 0), rotation: lean(pitch, -twist, -roll) }),
          k(0.75, { position: hip(0, high, 0), rotation: lean(pitch + 0.02, 0, 0) }),
          k(1, { position: hip(-sway, low, 0), rotation: lean(pitch, twist, roll) }),
        ],
        loop,
      );
      const lift = run ? 0.09 : 0.045;
      const stride = run ? 0.11 : 0.06;
      // A foot's cycle: planted and sliding back under the body, then a quick swing forward
      const stepKeys = (
        side: -1 | 1,
        at: (y?: number, z?: number) => Vec3,
        phase: number,
      ): Keyframe[] => {
        const frames: [number, Vec3, Quat][] = [
          [0, at(0, -stride), footRot(side, 0)],
          [0.12, at(lift * 0.6, -stride * 0.4), footRot(side, 0.35)],
          [0.25, at(lift, stride * 0.4), footRot(side, -0.1)],
          [0.4, at(0, stride), footRot(side, -0.15)],
          [0.46, at(0, stride * 0.9), footRot(side, 0)],
          [1, at(0, -stride), footRot(side, 0)],
        ];
        // Shift the cycle by `phase` (0 or 0.5) so the feet alternate
        const shifted = frames
          .map(([t, position, rotation]) => [(t + phase) % 1, position, rotation] as const)
          .sort((x, y) => x[0] - y[0]);
        const first = shifted[0]!;
        const keys = shifted.map(([t, position, rotation]) => k(t, { position, rotation }));
        if (first[0] > 0) {
          const last = shifted[shifted.length - 1]!;
          keys.unshift(k(0, { position: last[1], rotation: last[2] }));
        }
        if (keys[keys.length - 1]!.at! < 1)
          keys.push(k(1, { position: keys[0]!.position!, rotation: keys[0]!.rotation! }));
        return keys;
      };
      a(footR, stepKeys(1, footRAt, 0), loop);
      a(footL, stepKeys(-1, footLAt, 0.5), loop);
      // Flippers: held out for balance, rising on the side away from the planted foot; swept back
      // and beating when running
      const [fwd, outLo, outHi] = run ? [0.95, 0.55, 0.85] : [0.15, 0.3, 0.55];
      a(
        fl,
        [
          k(0, { rotation: flipL(fwd, outLo) }),
          k(0.25, { rotation: flipL(fwd - 0.08, (outLo + outHi) / 2) }),
          k(0.5, { rotation: flipL(fwd, outHi) }),
          k(0.75, { rotation: flipL(fwd - 0.08, (outLo + outHi) / 2) }),
          k(1, { rotation: flipL(fwd, outLo) }),
        ],
        loop,
      );
      a(
        fr,
        [
          k(0, { rotation: flipR(fwd, outHi) }),
          k(0.25, { rotation: flipR(fwd - 0.08, (outLo + outHi) / 2) }),
          k(0.5, { rotation: flipR(fwd, outLo) }),
          k(0.75, { rotation: flipR(fwd - 0.08, (outLo + outHi) / 2) }),
          k(1, { rotation: flipR(fwd, outHi) }),
        ],
        loop,
      );
      return Promise.resolve();
    }

    case "punch":
    case "jab": {
      // Wind up (twist back, crouch, cock the flipper), snap forward with the hips leading, overshoot,
      // hold the extension a beat, then recover slowly. The lead foot steps in; the rear foot pivots.
      const right = anim === "punch";
      const s = right ? 1 : -1;
      const power = right ? 1 : 0.7;
      const strike = right ? fr : fl;
      const guard = right ? fl : fr;
      const f = right ? flipR : flipL;
      const g = right ? flipL : flipR;
      const lead = right ? footL : footR;
      const rear = right ? footR : footL;
      const leadAt = right ? footLAt : footRAt;
      const rearSide: -1 | 1 = right ? 1 : -1;
      a(
        pelvis,
        [
          k(0, { position: hip(0, 0, 0), rotation: IDENTITY }),
          k(0.3, {
            position: hip(0, -0.035 * power, -0.03),
            rotation: lean(-0.12, 0.45 * s * power, 0),
          }),
          k(0.4, {
            position: hip(0, -0.04 * power, 0.1 * power),
            rotation: lean(0.32 * power, -0.38 * s * power, 0),
          }),
          k(0.48, {
            position: hip(0, -0.04 * power, 0.12 * power),
            rotation: lean(0.38 * power, -0.46 * s * power, 0),
          }),
          k(0.64, {
            position: hip(0, -0.03 * power, 0.09 * power),
            rotation: lean(0.26 * power, -0.32 * s * power, 0),
          }),
          k(1, { position: hip(0, 0, 0), rotation: IDENTITY }),
        ],
        once,
      );
      a(
        strike,
        [
          k(0, { rotation: right ? REST_R : REST_L }),
          k(0.3, { rotation: f(0.95, 0.55) }),
          k(0.4, { rotation: f(-1.6, 0.2, 0.15) }),
          k(0.48, { rotation: f(-1.85, 0.12, 0.2) }),
          k(0.64, { rotation: f(-1.55, 0.2, 0.1) }),
          k(1, { rotation: right ? REST_R : REST_L }),
        ],
        once,
      );
      a(
        guard,
        [
          k(0, { rotation: right ? REST_L : REST_R }),
          k(0.3, { rotation: g(-0.5, 0.35) }),
          k(0.42, { rotation: g(0.7, 0.55) }),
          k(0.64, { rotation: g(0.5, 0.45) }),
          k(1, { rotation: right ? REST_L : REST_R }),
        ],
        once,
      );
      a(
        lead,
        [
          k(0, { position: leadAt() }),
          k(0.3, { position: leadAt() }),
          k(0.36, { position: leadAt(0.035, 0.07) }),
          k(0.42, { position: leadAt(0, 0.13 * power) }),
          k(0.7, { position: leadAt(0, 0.12 * power) }),
          k(0.85, { position: leadAt(0.02, 0.05) }),
          k(1, { position: leadAt() }),
        ],
        once,
      );
      return a(
        rear,
        [
          k(0, { rotation: footRot(rearSide, 0) }),
          k(0.4, { rotation: footRot(rearSide, -0.15, -0.45 * s) }),
          k(0.7, { rotation: footRot(rearSide, -0.1, -0.35 * s) }),
          k(1, { rotation: footRot(rearSide, 0) }),
        ],
        once,
      );
    }

    case "jump": {
      // Deep crouch with flippers swung back, explode up stretching, flap hard at the top, tuck the
      // feet, reach for the ground, land in a squash and bounce back up past standing to settle.
      // The whole bird rises (pelvis and feet together), so whatever moves the root can keep moving it
      const lift = (keys: Keyframe[]): Keyframe[] =>
        keys.map((key) =>
          key.position
            ? {
                ...key,
                position: [key.position[0], key.position[1] + airAt(key.at ?? 0), key.position[2]],
              }
            : key,
        );
      const done = a(
        pelvis,
        lift([
          k(0, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
          k(0.22, {
            position: hip(0, -0.09, 0.02),
            rotation: lean(0.22, 0, 0),
            scale: [1.14, 0.84, 1.14],
          }),
          k(0.3, {
            position: hip(0, 0.02, 0),
            rotation: lean(-0.06, 0, 0),
            scale: [0.9, 1.16, 0.9],
          }),
          k(0.4, { position: hip(0, 0.02, 0), rotation: lean(0.02, 0, 0), scale: 1 }),
          k(0.52, { position: hip(0, 0.02, 0), rotation: lean(0.05, 0, 0), scale: 1 }),
          k(0.64, { position: hip(0, 0.01, 0), rotation: lean(0, 0, 0), scale: 1 }),
          k(0.72, {
            position: hip(0, 0.01, 0),
            rotation: lean(-0.04, 0, 0),
            scale: [0.95, 1.07, 0.95],
          }),
          k(0.8, {
            position: hip(0, -0.09, 0.01),
            rotation: lean(0.18, 0, 0),
            scale: [1.16, 0.82, 1.16],
          }),
          k(0.9, {
            position: hip(0, 0.015, 0),
            rotation: lean(-0.03, 0, 0),
            scale: [0.96, 1.05, 0.96],
          }),
          k(1, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
        ]),
        once,
      );
      const flap = (fn: typeof flipL, rest: Quat): Keyframe[] => [
        k(0, { rotation: rest }),
        k(0.22, { rotation: fn(1.1, 0.5) }),
        k(0.32, { rotation: fn(-0.2, 2.3) }),
        k(0.42, { rotation: fn(0.1, 1.0) }),
        k(0.52, { rotation: fn(-0.1, 2.1) }),
        k(0.66, { rotation: fn(0.1, 1.1) }),
        k(0.8, { rotation: fn(-0.2, 1.7) }),
        k(0.9, { rotation: fn(0, 0.5) }),
        k(1, { rotation: rest }),
      ];
      a(fl, flap(flipL, REST_L), once);
      a(fr, flap(flipR, REST_R), once);
      for (const [foot, at, side] of [
        [footL, footLAt, -1],
        [footR, footRAt, 1],
      ] as const)
        a(
          foot,
          lift([
            k(0, { position: at(), rotation: footRot(side, 0) }),
            k(0.28, { position: at(), rotation: footRot(side, -0.3) }),
            k(0.42, { position: at(0.07, -0.05), rotation: footRot(side, 0.6) }),
            k(0.52, { position: at(0.07, -0.04), rotation: footRot(side, 0.5) }),
            k(0.62, { position: at(0.06, -0.03), rotation: footRot(side, 0.4) }),
            k(0.76, { position: at(0.01, 0.02), rotation: footRot(side, -0.25) }),
            k(0.8, { position: at(), rotation: footRot(side, 0) }),
            k(1, { position: at(), rotation: footRot(side, 0) }),
          ]),
          once,
        );
      return done;
    }

    case "slide": {
      // Drop back into a low, feet-first slide leaning backwards, flippers out for balance,
      // glide under the obstacle with a slight sway, then rock forward back onto the feet.
      a(
        pelvis,
        [
          k(0, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
          k(0.12, {
            position: hip(0, -0.06, -0.03),
            rotation: lean(-0.35, 0, 0),
            scale: [1.04, 0.92, 1.04],
          }),
          k(0.24, {
            position: hip(0, -0.13, -0.08),
            rotation: lean(-1.05, 0, 0),
            scale: [1.06, 0.88, 1.06],
          }),
          k(0.45, {
            position: hip(0, -0.13, -0.08),
            rotation: lean(-1.02, 0.04, 0.04),
            scale: [1.06, 0.88, 1.06],
          }),
          k(0.6, {
            position: hip(0, -0.13, -0.08),
            rotation: lean(-1.05, -0.04, -0.04),
            scale: [1.06, 0.88, 1.06],
          }),
          k(0.74, {
            position: hip(0, -0.13, -0.08),
            rotation: lean(-1.02, 0.03, 0.02),
            scale: [1.06, 0.88, 1.06],
          }),
          k(0.86, {
            position: hip(0, -0.05, -0.03),
            rotation: lean(-0.3, 0, 0),
            scale: [1.03, 0.95, 1.03],
          }),
          k(0.93, {
            position: hip(0, 0.01, 0),
            rotation: lean(0.06, 0, 0),
            scale: [0.98, 1.02, 0.98],
          }),
          k(1, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
        ],
        once,
      );
      const paddle = (fn: typeof flipL, rest: Quat, offset: number): Keyframe[] => [
        k(0, { rotation: rest }),
        k(0.12, { rotation: fn(-0.3, 0.6) }),
        k(0.24, { rotation: fn(-0.5, 0.9) }),
        k(0.4 + offset, { rotation: fn(-0.45, 1.0) }),
        k(0.55 + offset, { rotation: fn(-0.55, 0.9) }),
        k(0.74, { rotation: fn(-0.5, 0.95) }),
        k(0.86, { rotation: fn(-0.15, 0.5) }),
        k(1, { rotation: rest }),
      ];
      a(fl, paddle(flipL, REST_L, 0), once);
      a(fr, paddle(flipR, REST_R, 0.04), once);
      for (const [foot, at, side, offset] of [
        [footL, footLAt, -1, 0],
        [footR, footRAt, 1, 0.05],
      ] as const)
        a(
          foot,
          [
            k(0, { position: at(), rotation: footRot(side, 0) }),
            k(0.12, { position: at(0.01, 0.08), rotation: footRot(side, -0.3) }),
            k(0.24, { position: at(0.03, 0.18), rotation: footRot(side, -0.55) }),
            k(0.5 + offset, { position: at(0.03, 0.18), rotation: footRot(side, -0.5) }),
            k(0.76, { position: at(0.03, 0.18), rotation: footRot(side, -0.55) }),
            k(0.88, { position: at(0.01, 0.05), rotation: footRot(side, -0.1) }),
            k(1, { position: at(), rotation: footRot(side, 0) }),
          ],
          once,
        );
      return a(p.body, [k(0, { scale: 1 }), k(1, { scale: 1 })], once);
    }

    case "hit": {
      // Snapped back by the blow, flippers flung up, a stumble back, then a damped wobble to standing
      world.animate(p.root, { shake: 0.045 }, { duration: T * 0.4 });
      a(
        pelvis,
        [
          k(0, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
          k(0.1, {
            position: hip(0, -0.02, -0.08),
            rotation: lean(-0.55, 0, 0.15),
            scale: [1.06, 0.93, 1.06],
          }),
          k(0.26, { position: hip(0, 0, -0.05), rotation: lean(0.22, 0, -0.08), scale: 1 }),
          k(0.42, { position: hip(0, 0, -0.03), rotation: lean(-0.12, 0, 0.05), scale: 1 }),
          k(0.58, { position: hip(0, 0, -0.01), rotation: lean(0.06, 0, -0.02), scale: 1 }),
          k(0.75, { position: hip(0, 0, 0), rotation: lean(-0.02, 0, 0), scale: 1 }),
          k(1, { position: hip(0, 0, 0), rotation: IDENTITY, scale: 1 }),
        ],
        once,
      );
      a(
        fl,
        [
          k(0, { rotation: REST_L }),
          k(0.1, { rotation: flipL(-0.4, 1.9) }),
          k(0.28, { rotation: flipL(0.2, 0.6) }),
          k(0.44, { rotation: flipL(-0.1, 1.0) }),
          k(0.62, { rotation: flipL(0, 0.4) }),
          k(1, { rotation: REST_L }),
        ],
        once,
      );
      a(
        fr,
        [
          k(0, { rotation: REST_R }),
          k(0.12, { rotation: flipR(-0.4, 1.8) }),
          k(0.3, { rotation: flipR(0.2, 0.55) }),
          k(0.46, { rotation: flipR(-0.1, 0.95) }),
          k(0.64, { rotation: flipR(0, 0.4) }),
          k(1, { rotation: REST_R }),
        ],
        once,
      );
      a(
        footL,
        [
          k(0, { position: footLAt() }),
          k(0.14, { position: footLAt(0.04, -0.06) }),
          k(0.24, { position: footLAt(0, -0.1) }),
          k(0.7, { position: footLAt(0, -0.06) }),
          k(1, { position: footLAt() }),
        ],
        once,
      );
      return a(
        footR,
        [
          k(0, { position: footRAt() }),
          k(0.3, { position: footRAt() }),
          k(0.4, { position: footRAt(0.03, -0.04) }),
          k(0.5, { position: footRAt(0, -0.07) }),
          k(1, { position: footRAt() }),
        ],
        once,
      );
    }

    case "dance": {
      // A happy shuffle: hop from foot to foot with a body roll, both flippers waving overhead
      a(
        pelvis,
        [
          k(0, {
            position: hip(-0.03, 0, 0),
            rotation: lean(0, 0.35, 0.18),
            scale: [1.04, 0.95, 1.04],
          }),
          k(0.12, {
            position: hip(-0.01, 0.07, 0),
            rotation: lean(0, 0.2, 0.08),
            scale: [0.97, 1.05, 0.97],
          }),
          k(0.25, { position: hip(0, 0.09, 0), rotation: lean(-0.05, 0, 0), scale: 1 }),
          k(0.38, {
            position: hip(0.01, 0.07, 0),
            rotation: lean(0, -0.2, -0.08),
            scale: [0.97, 1.05, 0.97],
          }),
          k(0.5, {
            position: hip(0.03, 0, 0),
            rotation: lean(0, -0.35, -0.18),
            scale: [1.04, 0.95, 1.04],
          }),
          k(0.62, {
            position: hip(0.01, 0.07, 0),
            rotation: lean(0, -0.2, -0.08),
            scale: [0.97, 1.05, 0.97],
          }),
          k(0.75, { position: hip(0, 0.09, 0), rotation: lean(-0.05, 0, 0), scale: 1 }),
          k(0.88, {
            position: hip(-0.01, 0.07, 0),
            rotation: lean(0, 0.2, 0.08),
            scale: [0.97, 1.05, 0.97],
          }),
          k(1, {
            position: hip(-0.03, 0, 0),
            rotation: lean(0, 0.35, 0.18),
            scale: [1.04, 0.95, 1.04],
          }),
        ],
        loop,
      );
      a(
        fl,
        [
          k(0, { rotation: flipL(0, 2.6) }),
          k(0.25, { rotation: flipL(-0.35, 1.9) }),
          k(0.5, { rotation: flipL(0, 2.6) }),
          k(0.75, { rotation: flipL(-0.35, 1.9) }),
          k(1, { rotation: flipL(0, 2.6) }),
        ],
        loop,
      );
      a(
        fr,
        [
          k(0, { rotation: flipR(-0.35, 1.9) }),
          k(0.25, { rotation: flipR(0, 2.6) }),
          k(0.5, { rotation: flipR(-0.35, 1.9) }),
          k(0.75, { rotation: flipR(0, 2.6) }),
          k(1, { rotation: flipR(-0.35, 1.9) }),
        ],
        loop,
      );
      a(
        footL,
        [
          k(0, { position: footLAt() }),
          k(0.6, { position: footLAt() }),
          k(0.75, { position: footLAt(0.07, 0.03) }),
          k(0.9, { position: footLAt() }),
          k(1, { position: footLAt() }),
        ],
        loop,
      );
      a(
        footR,
        [
          k(0, { position: footRAt() }),
          k(0.1, { position: footRAt() }),
          k(0.25, { position: footRAt(0.07, 0.03) }),
          k(0.4, { position: footRAt() }),
          k(1, { position: footRAt() }),
        ],
        loop,
      );
      return Promise.resolve();
    }

    case "dead": {
      // Rocked by the hit, staggers dizzily from side to side, then topples onto its back, bounces
      // once and lies still with the flippers splayed and the feet in the air.
      a(
        pelvis,
        [
          k(0, { position: hip(0, 0, 0), rotation: IDENTITY }),
          k(0.08, { position: hip(0, -0.02, -0.05), rotation: lean(-0.35, 0, 0.08) }),
          k(0.2, { position: hip(0.02, 0, 0), rotation: lean(0.18, 0.15, 0.14) }),
          k(0.34, { position: hip(-0.02, 0, 0), rotation: lean(-0.05, -0.2, -0.16) }),
          k(0.48, { position: hip(0.015, 0, 0), rotation: lean(0.08, 0.15, 0.12) }),
          k(0.6, { position: hip(0, -0.02, -0.03), rotation: lean(-0.3, 0, 0.05) }),
          k(0.76, { position: [0, 0.3, -0.26], rotation: lean(-1.55, 0, 0.1) }),
          k(0.84, { position: [0, 0.36, -0.24], rotation: lean(-1.38, 0, 0.12) }),
          k(0.92, { position: [0, 0.3, -0.26], rotation: lean(-1.55, 0, 0.1) }),
          k(1, { position: [0, 0.3, -0.26], rotation: lean(-1.55, 0, 0.1) }),
        ],
        once,
      );
      a(
        fl,
        [
          k(0, { rotation: REST_L }),
          k(0.08, { rotation: flipL(-0.3, 1.2) }),
          k(0.3, { rotation: flipL(0.2, 0.8) }),
          k(0.6, { rotation: flipL(-0.4, 1.6) }),
          k(0.8, { rotation: flipL(-0.2, 1.45) }),
          k(0.88, { rotation: flipL(-0.3, 1.7) }),
          k(1, { rotation: flipL(-0.2, 1.4) }),
        ],
        once,
      );
      a(
        fr,
        [
          k(0, { rotation: REST_R }),
          k(0.1, { rotation: flipR(-0.3, 1.1) }),
          k(0.36, { rotation: flipR(0.2, 0.9) }),
          k(0.62, { rotation: flipR(-0.4, 1.5) }),
          k(0.8, { rotation: flipR(-0.2, 1.4) }),
          k(0.88, { rotation: flipR(-0.3, 1.65) }),
          k(1, { rotation: flipR(-0.2, 1.35) }),
        ],
        once,
      );
      a(
        footL,
        [
          k(0, { position: footLAt(), rotation: footRot(-1, 0) }),
          k(0.2, { position: footLAt(0.03, 0.03), rotation: footRot(-1, 0) }),
          k(0.26, { position: footLAt(0, 0.04), rotation: footRot(-1, 0) }),
          k(0.6, { position: footLAt(), rotation: footRot(-1, 0) }),
          k(0.78, { position: footLAt(0.2, 0.05), rotation: footRot(-1, -1.2) }),
          k(1, { position: footLAt(0.18, 0.04), rotation: footRot(-1, -1.3) }),
        ],
        once,
      );
      return a(
        footR,
        [
          k(0, { position: footRAt(), rotation: footRot(1, 0) }),
          k(0.34, { position: footRAt(0.03, -0.03), rotation: footRot(1, 0) }),
          k(0.4, { position: footRAt(0, -0.04), rotation: footRot(1, 0) }),
          k(0.6, { position: footRAt(), rotation: footRot(1, 0) }),
          k(0.8, { position: footRAt(0.22, 0.03), rotation: footRot(1, -1.1) }),
          k(1, { position: footRAt(0.2, 0.02), rotation: footRot(1, -1.25) }),
        ],
        once,
      );
    }
  }
}

/** Hand position for effects: where a strike lands, in world space, for a bird of `size` at its x and yaw. */
export function strikePoint(p: Penguin, size: number): Vec3 {
  return [p.x + Math.sin(p.yaw) * 0.45 * size, 0.55 * size, Math.cos(p.yaw) * 0.45 * size];
}

// Standalone React preview. useWorld handles startup and cleanup; the native core runs every clip.
type PenguinSceneProps = {
  action?: PenguinAnim;
  playing?: boolean;
  rendering?: boolean;
  speed?: number;
  replay?: number;
  viewReset?: number;
  background?: string;
  groundColor?: string;
  captureTime?: number;
  onFrame?: (time: number) => void;
  onReady?: () => void;
};
export default function PenguinScene({
  action = "idle",
  playing = true,
  rendering = true,
  speed = 1,
  replay = 0,
  viewReset = 0,
  background = "#101d30",
  groundColor = "#172b43",
  captureTime,
  onFrame,
  onReady,
}: PenguinSceneProps = {}) {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [aspect, setAspect] = useState(1.7);
  const bird = useRef<Penguin | null>(null),
    floor = useRef<Entity | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const orbit = useRef({ yaw: 0, pitch: 0.08 });
  const drag = useRef({ yaw: 0, pitch: 0.08 });
  const camera = useRef<Camera>({ eye: [0, 0.95, 2.7], target: [0, 0.75, 0], fov: 0.9 }).current;
  const command = useRef({ action, replay });
  const presented = useRef(false);
  const captured = useRef({ key: "", frames: 0 });
  const world = useWorld(
    16,
    (w) => {
      preparePenguin();
      floor.current = w.spawn({
        mesh: "plane",
        scale: [200, 1, 200],
        position: [0, -0.015, 0],
        color: groundColor,
        pickable: false,
      });
      bird.current = spawnPenguin(w, [0, 0, 0], 1.2);
      void playPenguin(w, bird.current, action);
      command.current = { action, replay };
    },
    [],
    () => setError("The penguin preview could not start. Please reload the page."),
  );

  useEffect(() => {
    if (world && floor.current !== null) world.set(floor.current, { color: groundColor });
  }, [world, groundColor]);
  useEffect(() => {
    orbit.current = { yaw: 0, pitch: 0.08 };
  }, [viewReset]);
  useEffect(() => {
    if (!surface.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height) setAspect(entry.contentRect.width / entry.contentRect.height);
    });
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={surface}
      role="group"
      aria-label="Rotate penguin: drag or use arrow keys; Home resets the view"
      tabIndex={0}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: background,
        cursor: "grab",
        outlineOffset: -3,
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") orbit.current.yaw -= 0.12;
        else if (event.key === "ArrowRight") orbit.current.yaw += 0.12;
        else if (event.key === "ArrowUp")
          orbit.current.pitch = Math.min(0.9, orbit.current.pitch + 0.08);
        else if (event.key === "ArrowDown")
          orbit.current.pitch = Math.max(0.02, orbit.current.pitch - 0.08);
        else if (event.key === "Home") orbit.current = { yaw: 0, pitch: 0.08 };
        else return;
        event.preventDefault();
      }}
    >
      {world && !error ? (
        <GameView
          source={world}
          camera={camera}
          quality="high"
          adaptQuality={false}
          paused={!rendering}
          background={background}
          light={{ direction: [-3, 6, 5], ambient: 0.5, shadows: true, shadowExtent: 3 }}
          style={{ width: "100%", height: "100%", touchAction: "none" }}
          onError={() => setError("The 3D renderer could not start. Please reload the page.")}
          onDrag={(event) => {
            if (event.phase === "start") drag.current = { ...orbit.current };
            if (event.phase === "move")
              orbit.current = {
                yaw: drag.current.yaw - event.dx * 0.008,
                pitch: Math.max(0.02, Math.min(0.9, drag.current.pitch + event.dy * 0.006)),
              };
          }}
          onUpdate={(dt) => {
            const p = bird.current;
            if (!p) return;
            const jumping = action === "jump";
            const radius = Math.max(jumping ? 3.8 : 2.7, 1.8 / (2 * Math.tan(0.45) * aspect));
            const targetY = jumping ? 1.2 : 0.75;
            const { yaw, pitch } = orbit.current;
            camera.target = [0, targetY, 0];
            camera.eye = [
              radius * Math.sin(yaw) * Math.cos(pitch),
              targetY + radius * Math.sin(pitch),
              radius * Math.cos(yaw) * Math.cos(pitch),
            ];
            const changed = command.current.action !== action || command.current.replay !== replay;
            if (captureTime !== undefined) {
              const key = `${action}:${replay}:${captureTime}`;
              if (captured.current.key !== key) {
                placePenguin(world, p, 0);
                void playPenguin(world, p, action);
                // Seek only for frame capture. Normal playback remains entirely native keyframes.
                const frames = Math.floor(captureTime * 60);
                for (let i = 0; i < frames; i++) world.update(1 / 60);
                world.update(Math.max(0, captureTime - frames / 60));
                captured.current = { key, frames: 0 };
              } else world.update(0);
              if (++captured.current.frames >= 2) queueMicrotask(() => onFrame?.(captureTime));
            } else {
              if (changed) {
                if (command.current.action === action) placePenguin(world, p, 0);
                void playPenguin(world, p, action);
              }
              // Scaling the world's clock changes pace without restarting the current clip.
              // Calling update here also lets orbit controls work while animation is paused.
              world.update(playing ? dt * speed : 0);
            }
            command.current = { action, replay };
            if (!presented.current) {
              presented.current = true;
              queueMicrotask(() => {
                setReady(true);
                onReady?.();
              });
            }
          }}
        />
      ) : null}
      {error || !ready ? (
        <div
          role={error ? "alert" : "status"}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 24,
            color: "#8294aa",
            backgroundColor: background,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {error || "Loading the penguin…"}
        </div>
      ) : null}
    </div>
  );
}
