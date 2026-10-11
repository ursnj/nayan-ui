import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Share, StyleSheet, Switch, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  audio,
  GameView,
  haptics,
  loadModel,
  loadTexture,
  World,
  type Camera,
  type Color,
  type DragEvent,
  type Entity,
  type Light,
  type Model,
  type Quat,
  type Texture,
  type Vec3,
  type Voice,
} from "@nayan-ui/engine";
import { HEADER_HEIGHT, SAFE_TOP } from "../layout";

// Rules follow Playtura's Car Racing: a 2-minute timer, 3 lives, 500 points per car passed. The run
// ends when the timer runs out ("TIME UP!") or the last life is lost ("CRASHED!").
const GAME_DURATION = 120; // seconds
const LIVES = 3;
const POINTS_PER_CAR_PASSED = 500;
const LOW_TIME = 10; // the timer turns red from here

// The road is a track that curves and climbs. Everything on it is placed by distance along it (s)
// and offset across it (d, metres to the right of the centre line).
const LANE_W = 3.4;
const LANES = [-LANE_W, 0, LANE_W];
const ROAD_HALF = LANE_W * 1.5;
const EDGE = ROAD_HALF - 1.05; // furthest a car's centre goes before scraping the rail
const START_SPEED = 26;
const MAX_SPEED = 52;
const ACCELERATION = 0.22; // m/s per second
const NITRO_BOOST = 1.45;
const NITRO_BURN = 0.32; // of a full tank per second
const LATERAL_SPEED = 15; // m/s across the road
const STEER_RESPONSE = 9; // how quickly the sideways speed eases toward what the finger asks for
const STEER_WIDTH = 0.6; // a swipe across this much of the screen crosses the whole road
const TRAFFIC_SPEED = 14; // one speed: cars keep the gaps they spawned with, so no wall forms later
const SPAWN_AHEAD = 170; // hidden by fog
const CRASH_SLOWDOWN = 0.55;
const INVULNERABLE = 1.6; // seconds after a crash
const SEG_LEN = 6;
const SEGMENTS = 42;
const RS = 0.2; // road segment roots sit this far below the surface: their colliders are 0.4 thick
const BEHIND = 8; // segments kept behind the player, so neither camera sees where the road ends

const SKY = [0.62, 0.78, 0.95] as const;
// Dark mode drives at night, as Playtura repaints its outdoor scenes (NIGHT_SCENE): its night sky,
// dim bluish moonlight, and glowing lamps, lights and billboards (colors above 1 glow).
const NIGHT_SKY = [0.141, 0.114, 0.251] as const; // NIGHT_SCENE.SKY horizon #241D40
const DAY_LIGHT: Light = { direction: [0.45, 0.85, 0.3], ambient: 0.5, shadowExtent: 26 };
const NIGHT_LIGHT: Light = { direction: [0.25, 0.9, 0.35], ambient: 0.6, shadowExtent: 26, color: [0.34, 0.36, 0.58] };
const LAMP: Color = [1, 0.97, 0.82];
const LAMP_LIT: Color = [2, 1.85, 1.3];
const LINE: Color = [0.95, 0.95, 0.9];
const RAIL: Color = [0.72, 0.74, 0.78];
const PAINTS: Color[] = [
  [0.15, 0.32, 0.95],
  [0.1, 0.75, 0.35],
  [1, 0.8, 0.15],
  [0.92, 0.92, 0.95],
  [0.12, 0.12, 0.14],
  [0.95, 0.45, 0.1],
  [0.55, 0.2, 0.75],
];
const PLAYER_PAINT: Color = [0.92, 0.08, 0.1];

// Demo / QA mode: a bot drives and restarts. Run Metro with EXPO_PUBLIC_AUTOPLAY=1.
const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";

// Decoded once by the Rust mixer, shared by every run.
const sfx = audio.load({
  engine: require("../../assets/sfx/engine.wav"),
  nitro: require("../../assets/sfx/nitro.wav"),
  point: require("../../assets/sfx/point.wav"),
  hit: require("../../assets/sfx/hit.wav"),
  die: require("../../assets/sfx/die.wav"),
  bump: require("../../assets/sfx/bump.wav"),
});

// ── Assets ──────────────────────────────────────────────────────────────

/**
 * One car for everyone: Khronos' "Car Concept" (CC-BY 4.0, converted by scripts/import-car.py). A
 * glossy white body each entity paints its own color, the windows, and untinted trim (tyres, lights).
 */
type CarModel = { body: Model; glass: Model; trim: Model; size: Vec3 };
type Assets = { car: CarModel; asphalt: Texture; facade: Texture; grass: Texture; ads: Texture[]; tree: Model };

let assets: Promise<Assets> | undefined;
function loadAssets(): Promise<Assets> {
  assets ??= Promise.all([
    loadModel(require("../../assets/models/car_body.glb"), { center: false, shine: 0.85 }),
    loadModel(require("../../assets/models/car_glass.glb"), { center: false, shine: 0.95 }),
    loadModel(require("../../assets/models/car_trim.glb"), { center: false, shine: 0.25 }),
    loadTexture(require("../../assets/textures/asphalt.png")),
    loadTexture(require("../../assets/textures/facade.png")),
    loadTexture(require("../../assets/textures/grass.png")),
    Promise.all([
      loadTexture(require("../../assets/textures/ad_chevrons.png")),
      loadTexture(require("../../assets/textures/ad_bubbles.png")),
      loadTexture(require("../../assets/textures/ad_bolt.png")),
    ]),
    loadModel(require("../../assets/models/tree.glb"), { center: false }),
  ]).then(([body, glass, trim, asphalt, facade, grass, ads, tree]) => ({
    car: { body, glass, trim, size: [Math.max(body.size[0], trim.size[0]), Math.max(body.size[1], trim.size[1]), Math.max(body.size[2], trim.size[2])] as Vec3 },
    asphalt,
    facade,
    grass,
    ads,
    tree,
  }));
  return assets;
}

// ── Track ───────────────────────────────────────────────────────────────

/** A straight start, then sweeping bends and rolling hills. */
const fadeIn = (s: number) => Math.min(1, Math.max(0, (s - 60) / 200));
const curvature = (s: number) => (0.0052 * Math.sin(s / 95) + 0.0034 * Math.sin(s / 41 + 1.3)) * fadeIn(s);
const elevation = (s: number) => (7 * Math.sin(s / 150) + 2.5 * Math.sin(s / 57 + 0.7)) * fadeIn(s);

type Sample = { x: number; y: number; z: number; heading: number; pitch: number };

/** The centre line, integrated a metre at a time as the player drives. */
class Track {
  private xs = [0];
  private zs = [0];
  private hs = [0];

  private ensure(s: number) {
    for (let i = this.xs.length; i <= s + 1; i++) {
      const h = this.hs[i - 1]! + curvature(i);
      this.hs.push(h);
      this.xs.push(this.xs[i - 1]! + Math.sin(h));
      this.zs.push(this.zs[i - 1]! - Math.cos(h));
    }
  }

  sample(s: number, out: Sample): Sample {
    if (s < 0) {
      // Behind the start line the road runs straight back (the start-screen camera sees it).
      out.x = 0;
      out.y = 0;
      out.z = -s;
      out.heading = 0;
      out.pitch = 0;
      return out;
    }
    const t = s;
    this.ensure(t);
    const i = Math.floor(t);
    const f = t - i;
    out.x = this.xs[i]! + (this.xs[i + 1]! - this.xs[i]!) * f;
    out.z = this.zs[i]! + (this.zs[i + 1]! - this.zs[i]!) * f;
    out.heading = this.hs[i]! + (this.hs[i + 1]! - this.hs[i]!) * f;
    out.y = elevation(t);
    out.pitch = Math.atan(elevation(t + 0.5) - elevation(t - 0.5));
    return out;
  }
}

// Heading 0 drives toward -z with +x on the right; a positive heading bends right.
const forwardOf = (h: number): Vec3 => [Math.sin(h), 0, -Math.cos(h)];
const rightOf = (h: number): Vec3 => [Math.cos(h), 0, Math.sin(h)];

/** The world point at a track sample, `d` to the right and `h` above the road. */
function placeAt(t: Sample, d: number, h: number, out: [number, number, number]) {
  out[0] = t.x + Math.cos(t.heading) * d;
  out[1] = t.y + h;
  out[2] = t.z + Math.sin(t.heading) * d;
  return out;
}

function mul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}
/** Facing along `heading` (turned `yaw` further right), nose up by `pitch`, rolled left by `roll`. */
function orient(heading: number, pitch: number, yaw = 0, roll = 0): Quat {
  const a = -(heading + yaw) / 2;
  const qy: Quat = [0, Math.sin(a), 0, Math.cos(a)];
  const qx: Quat = [Math.sin(pitch / 2), 0, 0, Math.cos(pitch / 2)];
  const qz: Quat = [0, 0, Math.sin(roll / 2), Math.cos(roll / 2)];
  return mul(mul(qy, qx), qz);
}

// ── Game ────────────────────────────────────────────────────────────────

type Phase = "ready" | "playing" | "over";
type Car = {
  root: Entity;
  s: number;
  d: number;
  /** The lane it spawned in (a sideswipe can shove it out of it). */
  lane: number;
  /** Sideways speed from a sideswipe, fading back to 0. */
  vd: number;
  passed: boolean;
  crashed: boolean;
  /** It was sideswiped (no near-miss bonus for it). */
  bumped: boolean;
  /** Seconds until another sideswipe makes a sound again. */
  bumpCooldown: number;
  /** Closest it came beside the player, for near misses. */
  closest: number;
};
/** A stretch of road; `props` is its scenery, rebuilt for the zone it lands in each time it jumps ahead. */
type Segment = { root: Entity; s: number; props: Entity[] };

let best = 0;
/** This session's best runs, for the leaderboard (the example has no backend). */
const topScores: number[] = [];
// Playtura's TrophyIcon and ShareIcon, rendered to white PNGs and tinted to the theme.
const TROPHY_ICON = require("../../assets/icons/trophy.png");
const SHARE_ICON = require("../../assets/icons/share.png");
// Reused per frame, so the game loop doesn't allocate.
const tmp: [number, number, number] = [0, 0, 0];
const at: [number, number, number] = [0, 0, 0];
const sample: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
const look: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A car: an invisible root at its middle (the collider's centre once wrecked) with body, glass and trim attached. */
function spawnCar(world: World, a: Assets, paint: Color, position: Vec3, night: boolean) {
  const model = a.car;
  const root = world.spawn({ mesh: "none", position });
  const lift = -model.size[1] / 2;
  const offset: Vec3 = [0, lift, 0];
  const body = world.spawn({ mesh: model.body, parent: root, position: offset, color: paint });
  const glass = world.spawn({ mesh: model.glass, parent: root, position: offset });
  const trim = world.spawn({ mesh: model.trim, parent: root, position: offset });
  if (night) {
    // Headlights and the tail-light bar glow, over where the model has them.
    for (const x of [-0.6, 0.6]) {
      world.spawn({ mesh: "cube", parent: root, position: [x, lift + 0.66, -2.04], scale: [0.42, 0.06, 0.05], color: [2, 1.95, 1.7], pickable: false });
    }
    world.spawn({ mesh: "cube", parent: root, position: [0, lift + 0.96, 1.87], scale: [1.2, 0.045, 0.04], color: [2, 0.16, 0.1], pickable: false });
  }
  return { root, body, glass, trim };
}

function createGame(a: Assets, night: boolean) {
  const world = new World(2600);
  const camera: Camera = { eye: [6, 3, 6], target: [0, 0.6, 0], fov: 1 };

  // Road segments: a root carrying the ground collider, with asphalt, curbs, markings, rails and
  // scenery attached. Segments that fall behind jump ahead with everything on them.
  const segments: Segment[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const root = world.spawn({
      mesh: "none",
      physics: { type: "fixed", size: [90, 0.4, SEG_LEN + 0.4], layer: 4, mask: 0, friction: 0.7 },
    });
    const add = (mesh: "cube" | "cylinder" | Model, position: Vec3, scale: Vec3 | number, color: Color, texture?: Texture) =>
      world.spawn({ mesh, parent: root, position, scale, color, texture, pickable: false });
    const lift = (i % 2) * 0.004; // overlapping neighbours never z-fight
    const len = SEG_LEN + 0.35;
    add("cube", [0, RS - 0.05 + lift, 0], [ROAD_HALF * 2 + 0.6, 0.1, len], [1, 1, 1], a.asphalt);
    for (const side of [-1, 1]) {
      add("cube", [side * (ROAD_HALF + 31), RS - 0.09 + lift, 0], [62, 0.1, len], i % 2 ? [1, 1, 1] : [0.94, 0.97, 0.92], a.grass);
      for (const z of [-SEG_LEN / 4, SEG_LEN / 4]) {
        const red = (i * 2 + (z > 0 ? 1 : 0)) % 2 === 0;
        add("cube", [side * (ROAD_HALF + 0.2), RS + 0.01 + lift, z], [0.5, 0.08, SEG_LEN / 2], red ? [0.85, 0.12, 0.1] : [0.95, 0.95, 0.95]);
      }
      add("cube", [side * (ROAD_HALF - 0.12), RS + 0.004 + lift, 0], [0.14, 0.02, len], LINE);
      add("cube", [side * (LANE_W / 2), RS + 0.004 + lift, 0], [0.14, 0.02, 2.6], LINE);
      add("cube", [side * (ROAD_HALF + 1.1), RS + 0.55, 0], [0.1, 0.26, len], RAIL);
      add("cube", [side * (ROAD_HALF + 1.15), RS + 0.3, 0], [0.12, 0.6, 0.12], [0.45, 0.46, 0.5]);
    }
    segments.push({ root, s: (i - BEHIND) * SEG_LEN, props: [] });
  }

  // Mountains and rolling hills all around, riding along with the player so they never get closer.
  const horizon = world.spawn({ mesh: "none" });
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 + rand(-0.08, 0.08);
    const r = rand(150, 210);
    const size = rand(40, 75);
    world.spawn({
      mesh: "sphere",
      parent: horizon,
      position: [Math.sin(angle) * r, -size * 0.32, -Math.cos(angle) * r],
      scale: [size * 1.6, size * 0.9, size * 1.6],
      color: [0.3 + rand(0, 0.06), 0.52 + rand(0, 0.08), 0.24],
      pickable: false,
    });
  }
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + rand(-0.1, 0.1);
    const size = rand(45, 80);
    world.spawn({
      mesh: "cone",
      parent: horizon,
      position: [Math.sin(angle) * 330, size * 0.35 - 10, -Math.cos(angle) * 330],
      scale: [size * 1.7, size, size * 1.7],
      color: [0.45 + rand(0, 0.08), 0.55 + rand(0, 0.06), 0.68],
      pickable: false,
    });
  }

  if (night) {
    // A moon and stars, riding along with the horizon.
    world.spawn({ mesh: "sphere", parent: horizon, position: [-120, 120, -230], scale: 26, color: [2, 1.95, 1.8], pickable: false });
    for (let i = 0; i < 70; i++) {
      const angle = rand(0, Math.PI * 2);
      world.spawn({ mesh: "sphere", parent: horizon, position: [Math.sin(angle) * 280, rand(50, 190), -Math.cos(angle) * 280], scale: rand(0.6, 1.4), color: [2, 2, 2.2], pickable: false });
    }
  }

  const player = spawnCar(world, a, PLAYER_PAINT, [0, a.car.size[1] / 2, 0], night);
  world.listener = player.root;

  const g = {
    world,
    night,
    track: new Track(),
    assets: a,
    camera,
    player,
    horizon,
    segments,
    traffic: [] as Car[],
    /** Wrecks on fire: flames and smoke come off them until `until` (game time). */
    burning: [] as { root: Entity; until: number; smoke: number }[],
    phase: "ready" as Phase,
    time: 0,
    s: 0,
    d: 0,
    target: 0, // where the finger wants the car across the road
    dragX: 0, // the finger's last dx, so each move steers by its own distance
    speed: 0,
    baseSpeed: START_SPEED,
    lateral: 0,
    nitro: 0.5,
    boosting: false,
    spawnTimer: 0.5,
    invulnerable: 0,
    scrape: 0,
    orbit: 0,
    score: 0,
    lives: LIVES,
    timeLeft: GAME_DURATION,
    secondTimer: 0,
    shake: 0,
    engine: null as Voice | null,
    // UI hooks, set by the component.
    onPhase: (_p: Phase) => {},
    onScore: (_s: number) => {},
    onLives: (_l: number) => {},
    onTime: (_t: number) => {},
    onFlash: () => {},
    onNearMiss: () => {},
  };
  for (const seg of segments) {
    placeSegment(g, seg);
    spawnProps(g, seg);
  }
  return g;
}
type Game = ReturnType<typeof createGame>;

function placeSegment(g: Game, seg: Segment) {
  const t = g.track.sample(seg.s, sample);
  g.world.set(seg.root, { position: [t.x, t.y - RS, t.z], rotation: orient(t.heading, t.pitch) });
}

// ── Scenery ─────────────────────────────────────────────────────────────

type Zone = "city" | "suburb" | "country";
/** Every 600 m the roadside changes. */
const zoneAt = (s: number): Zone => (["city", "suburb", "country"] as const)[Math.floor(Math.max(0, s + 300) / 600) % 3]!;

const HOUSE_WALLS: Color[] = [[0.95, 0.9, 0.78], [0.86, 0.9, 0.95], [0.95, 0.82, 0.75], [0.9, 0.93, 0.82]];
const ROOFS: Color[] = [[0.62, 0.2, 0.15], [0.35, 0.25, 0.2], [0.3, 0.32, 0.38]];

/** Fills a segment's roadside for its zone. Positions are in the segment's frame: x across, z along, y up. */
function spawnProps(g: Game, seg: Segment) {
  const { world, assets: a } = g;
  const add = (options: Parameters<World["spawn"]>[0] & {}) =>
    seg.props.push(world.spawn({ parent: seg.root, pickable: false, ...options }));
  const index = Math.round(seg.s / SEG_LEN);
  const zone = zoneAt(seg.s);
  const z = () => rand(-SEG_LEN / 2, SEG_LEN / 2);

  for (const side of [-1, 1]) {
    // Bushes along the rail, everywhere.
    if (Math.random() < 0.55) {
      add({ mesh: "sphere", position: [side * (ROAD_HALF + rand(2.2, 3.4)), RS + 0.25, z()], scale: [rand(1, 1.8), rand(0.7, 1.1), rand(1, 1.8)], color: [0.18 + rand(0, 0.08), 0.4 + rand(0, 0.12), 0.14] });
    }
    if (zone === "city") {
      add({ mesh: "cube", position: [side * (ROAD_HALF + 3.2), RS + 0.05, 0], scale: [2.6, 0.12, SEG_LEN + 0.35], color: [0.68, 0.68, 0.66] }); // sidewalk
      if ((index + (side > 0 ? 1 : 0)) % 2 === 0) {
        const h = rand(14, 42);
        const tone = rand(0.72, 1);
        add({ mesh: "cube", texture: a.facade, position: [side * (ROAD_HALF + rand(10, 15)), RS + h / 2, rand(-1, 1)], scale: [rand(8, 12), h, rand(8, 11)], color: [tone, tone * rand(0.92, 1), tone * rand(0.86, 1)] });
        if (Math.random() < 0.5) {
          const h2 = rand(20, 55);
          add({ mesh: "cube", texture: a.facade, position: [side * (ROAD_HALF + rand(24, 32)), RS + h2 / 2, rand(-2, 2)], scale: [rand(9, 14), h2, rand(9, 12)], color: [0.8, 0.82, 0.88] });
        }
      }
    } else if (zone === "suburb") {
      if ((index + (side > 0 ? 1 : 0)) % 3 === 0) {
        // A house: walls, a door, two windows, a gable roof (a cube turned 45° under a flattened group), a fence.
        const x = side * (ROAD_HALF + rand(10, 14));
        const wall = pick(HOUSE_WALLS);
        const face = x - side * 2.52; // the wall facing the road
        add({ mesh: "cube", position: [x, RS + 1.6, 0], scale: [5, 3.2, 5.6], color: wall });
        add({ mesh: "cube", position: [face, RS + 0.95, 0.9], scale: [0.06, 1.9, 0.9], color: [0.35, 0.22, 0.14] });
        for (const wz of [-1.4, 2.2]) add({ mesh: "cube", position: [face, RS + 2, wz], scale: [0.06, 0.8, 0.9], color: [0.55, 0.7, 0.85] });
        const roof = world.spawn({ mesh: "none", parent: seg.root, pickable: false, position: [x, RS + 3.2, 0], scale: [1, 0.55, 1] });
        seg.props.push(roof);
        seg.props.push(world.spawn({ mesh: "cube", parent: roof, pickable: false, rotation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)], scale: [4, 4, 6.2], color: pick(ROOFS) }));
        add({ mesh: "cube", position: [side * (ROAD_HALF + 6.5), RS + 0.35, 0], scale: [0.08, 0.6, SEG_LEN], color: [0.95, 0.95, 0.95] }); // fence
      } else {
        const x = side * (ROAD_HALF + rand(7, 16));
        const zz = z();
        const h = rand(1.6, 2.6);
        add({ mesh: "cylinder", position: [x, RS + h / 2, zz], scale: [0.35, h, 0.35], color: [0.42, 0.29, 0.17] });
        add({ mesh: "sphere", position: [x, RS + h + 1.1, zz], scale: rand(2.6, 3.6), color: [0.24 + rand(0, 0.08), 0.5 + rand(0, 0.12), 0.2] });
      }
    } else {
      // Countryside: a pine forest, rocks, a wooden fence and the odd power pole.
      for (let t = 0; t < 3; t++) add({ mesh: a.tree, position: [side * (ROAD_HALF + rand(5, 28)), RS, z()], scale: rand(2.4, 4.2), color: [1, 1, 1] });
      if (Math.random() < 0.35) add({ mesh: "sphere", position: [side * (ROAD_HALF + rand(4, 12)), RS, z()], scale: [rand(0.8, 1.8), rand(0.5, 0.9), rand(0.8, 1.6)], color: [0.52, 0.5, 0.48] });
      for (const y of [0.45, 0.85]) add({ mesh: "cube", position: [side * (ROAD_HALF + 4.2), RS + y, 0], scale: [0.07, 0.1, SEG_LEN + 0.3], color: [0.48, 0.34, 0.2] });
      add({ mesh: "cube", position: [side * (ROAD_HALF + 4.2), RS + 0.5, 0], scale: [0.12, 1, 0.12], color: [0.4, 0.28, 0.16] });
      if (index % 6 === (side > 0 ? 0 : 3)) {
        add({ mesh: "cylinder", position: [side * (ROAD_HALF + 7), RS + 4.5, 0], scale: [0.22, 9, 0.22], color: [0.38, 0.27, 0.18] });
        add({ mesh: "cube", position: [side * (ROAD_HALF + 7), RS + 8.4, 0], scale: [2.2, 0.14, 0.14], color: [0.38, 0.27, 0.18] });
      }
    }
  }

  // Street lights (closer together in the city) and, now and then, a billboard angled toward traffic.
  const side = index % 2 ? 1 : -1;
  if (index % (zone === "city" ? 2 : 4) === 0) {
    add({ mesh: "cylinder", position: [side * (ROAD_HALF + 1.7), RS + 3.2, 0], scale: [0.16, 6.4, 0.16], color: [0.35, 0.36, 0.4] });
    add({ mesh: "cube", position: [side * (ROAD_HALF + 0.8), RS + 6.35, 0], scale: [1.9, 0.1, 0.12], color: [0.35, 0.36, 0.4] });
    add({ mesh: "cube", position: [side * (ROAD_HALF - 0.05), RS + 6.25, 0], scale: [0.7, 0.1, 0.32], color: g.night ? LAMP_LIT : LAMP });
  }
  if (index % 11 === 5) {
    const x = -side * (ROAD_HALF + 6);
    for (const px of [-2.2, 2.2]) add({ mesh: "cylinder", position: [x + px, RS + 2.5, 0], scale: [0.25, 5, 0.25], color: [0.3, 0.3, 0.34] });
    add({ mesh: "cube", texture: pick(a.ads), position: [x, RS + 6, 0], scale: [7.5, 3.6, 0.25], rotation: [0, Math.sin((side * 0.35) / 2), 0, Math.cos((side * 0.35) / 2)], color: g.night ? [1.7, 1.7, 1.7] : [1, 1, 1] }); // lit at night
  }
}

function start(g: Game) {
  g.phase = "playing";
  g.speed = START_SPEED * 0.6;
  // Fill the road ahead, so the first cars arrive within seconds.
  for (let ahead = 50; ahead < SPAWN_AHEAD; ahead += rand(18, 26)) spawnTraffic(g, ahead);
  g.engine = sfx.play("engine", { volume: 0.32, loop: true });
  g.onPhase("playing");
  sfx.play("nitro", { volume: 0.6 });
  haptics.impact(0.6, 0.4);
}

function boost(g: Game) {
  if (g.phase !== "playing" || g.boosting || g.nitro < 0.15) return;
  g.boosting = true;
  g.shake = Math.max(g.shake, 0.12);
  sfx.play("nitro", { volume: 1 });
  haptics.impact(0.8, 0.3);
}

/** Traffic ahead, in a lane that doesn't close the road: cars close together always leave a lane open. */
function spawnTraffic(g: Game, ahead = SPAWN_AHEAD) {
  const s = g.s + ahead;
  const window = 14 + g.speed * 0.35;
  const blocked = new Set<number>();
  for (const car of g.traffic) if (!car.crashed && Math.abs(car.s - s) < window) blocked.add(car.lane);
  const open = [0, 1, 2].filter((l) => !blocked.has(l));
  if (open.length <= 1) return;
  const d = LANES[pick(open)]!;
  const t = g.track.sample(s, sample);
  placeAt(t, d, g.assets.car.size[1] / 2, at);
  const { root } = spawnCar(g.world, g.assets, pick(PAINTS), [at[0], at[1], at[2]], g.night);
  g.world.set(root, { rotation: orient(t.heading, t.pitch) });
  g.traffic.push({ root, s, d, lane: LANES.indexOf(d), vd: 0, passed: false, crashed: false, bumped: false, bumpCooldown: 0, closest: Infinity });
}

/** Moves an entity to (s, d) by giving it the velocity that gets it there this frame: the core smooths the rest. */
function drive(g: Game, root: Entity, s: number, d: number, h: number, dt: number, yaw = 0, roll = 0) {
  const now = g.world.position(root, tmp);
  const t = g.track.sample(s, sample);
  placeAt(t, d, h, at);
  if (!now || dt <= 0) return;
  g.world.set(root, {
    velocity: [(at[0] - now[0]) / dt, (at[1] - now[1]) / dt, (at[2] - now[2]) / dt],
    rotation: orient(t.heading, t.pitch, yaw, roll),
  });
}

function crash(g: Game, car: Car) {
  car.crashed = true;
  car.passed = true; // no points for a car you hit
  // The other car is knocked off the road: real physics from here, with the core thumping on impacts.
  const t = g.track.sample(car.s, sample);
  const right = rightOf(t.heading);
  const fwd = forwardOf(t.heading);
  const side = Math.sign(car.d - g.d) || (Math.random() < 0.5 ? -1 : 1);
  const size = g.assets.car.size;
  g.world.set(car.root, {
    physics: { type: "dynamic", size: [size[0] * 0.95, size[1], size[2] * 0.95], layer: 8, mask: 4 | 8, bounce: 0.25, friction: 0.6, density: 0.4 },
    spin: [rand(-2, 2), rand(-5, 5), -side * rand(2, 5)],
    impact: { sound: sfx.get("bump"), minSpeed: 2, maxSpeed: 14, volume: 0.8, haptic: 0.3 },
    lifetime: 2.6,
  });
  g.world.impulse(car.root, [right[0] * side * 10 + fwd[0] * g.speed * 0.5, 8, right[2] * side * 10 + fwd[2] * g.speed * 0.5]);
  const p = g.world.position(car.root);
  if (p) explode(g, p);
  g.burning.push({ root: car.root, until: g.time + 2.4, smoke: 0 });

  g.speed = Math.max(START_SPEED * 0.6, g.speed * CRASH_SLOWDOWN);
  g.boosting = false;
  g.shake = 0.5;
  g.lives -= 1;
  g.onLives(g.lives);
  g.onFlash();
  sfx.play("hit", { volume: 1 });
  haptics.impact(1, 0.8);
  if (g.lives <= 0) {
    // The player's car catches fire too, and keeps burning behind the results.
    g.burning.push({ root: g.player.root, until: Infinity, smoke: 0 });
    end(g);
    return;
  }
  g.invulnerable = INVULNERABLE; // a moment's grace, so one pile-up doesn't cost two lives
}

/**
 * A sideswipe: no life lost. The other car is shoved sideways (its nose kicks out as it slides), the
 * player bounces back a little, and the two are pushed apart so the contact doesn't repeat.
 */
function sideswipe(g: Game, car: Car, overlap: number) {
  const away = Math.sign(car.d - g.d) || 1;
  car.d += away * overlap * 0.65;
  g.d -= away * overlap * 0.35;
  car.vd = away * (4 + Math.abs(g.lateral) * 0.8);
  g.lateral = -away * Math.abs(g.lateral) * 0.3;
  car.bumped = true;
  g.speed *= 0.97;
  g.shake = Math.max(g.shake, 0.15);
  if (car.bumpCooldown > 0) return;
  car.bumpCooldown = 0.3;
  const t = g.track.sample((car.s + g.s) / 2, sample);
  placeAt(t, (car.d + g.d) / 2, 0.6, at);
  g.world.burst({ position: [at[0], at[1], at[2]], count: 10, speed: 7, size: 0.07, lifetime: 0.4, color: [[2, 1.8, 0.8], [2, 1.3, 0.4]] });
  sfx.play("bump", { volume: 0.9 });
  haptics.impact(0.6, 0.7);
}

// ── Fire ────────────────────────────────────────────────────────────────

// Channels above 1 glow (the engine draws them self-lit): flames stay bright in shadow. Particles keep
// their color, so a flame is layered instead: a white-hot base, orange tongues, red tips above.
const FLAME_BASE: Color[] = [
  [2, 2, 1.6],
  [2, 1.85, 1],
];
const FLAME: Color[] = [
  [2, 1.44, 0.36],
  [2, 1.15, 0.24],
  [2, 0.84, 0.16],
];
const FLAME_TIP: Color[] = [
  [1.8, 0.36, 0.1],
  [1.5, 0.22, 0.06],
];
const SMOKE: Color[] = [
  [0.22, 0.21, 0.21, 0.28],
  [0.32, 0.31, 0.3, 0.22],
  [0.16, 0.16, 0.16, 0.3],
];

/** A crash: a white-hot flash, a rolling fireball, sparks and a cloud of smoke. Round particles rise as they burn out. */
function explode(g: Game, at: Vec3) {
  const w = g.world;
  w.burst({ position: at, mesh: "sphere", count: 10, size: 0.6, speed: 3, lifetime: 0.22, gravity: 2, color: FLAME_BASE });
  w.burst({ position: at, mesh: "sphere", count: 30, size: 0.38, speed: 6, lifetime: 0.55, gravity: 5, color: FLAME });
  w.burst({ position: at, mesh: "sphere", count: 18, size: 0.32, speed: 8, lifetime: 0.75, gravity: 6, direction: [0, 1, 0], spread: 1.1, color: FLAME_TIP });
  w.burst({ position: at, count: 22, size: 0.06, speed: 13, lifetime: 0.5, color: [[2, 1.8, 0.8], [2, 1.4, 0.4]] }); // sparks fall
  w.burst({ position: [at[0], at[1] + 0.6, at[2]], mesh: "sphere", count: 6, size: 0.6, speed: 2.2, lifetime: 1.2, gravity: 2.5, direction: [0, 1, 0], spread: 1, color: SMOKE });
}

/**
 * Burning wrecks: layered flames every frame and a puff of smoke now and then. They're launched with the
 * wreck's own velocity (plus a rise), so they ride along with it and stream off behind.
 */
const wreckVelocity: [number, number, number] = [0, 0, 0];
function burn(g: Game, dt: number) {
  for (let i = g.burning.length - 1; i >= 0; i--) {
    const fire = g.burning[i]!;
    const p = g.world.worldPosition(fire.root, tmp);
    if (!p || g.time > fire.until) {
      g.burning.splice(i, 1);
      continue;
    }
    const v = g.world.velocity(fire.root, wreckVelocity) ?? [0, 0, 0];
    const flames = (rise: number, y: number, count: number, size: number, lifetime: number, color: Color[]) => {
      const dir: Vec3 = [v[0], v[1] + rise, v[2]];
      const speed = Math.hypot(dir[0], dir[1], dir[2]);
      g.world.burst({
        position: [p[0] + rand(-0.7, 0.7), p[1] + y, p[2] + rand(-1.2, 1.2)],
        mesh: "sphere",
        count,
        size,
        speed,
        lifetime,
        gravity: rise * 2,
        direction: [dir[0] / speed, dir[1] / speed, dir[2] / speed],
        spread: 0.35,
        color,
      });
    };
    flames(2.5, 0.7, 3, rand(0.16, 0.26), rand(0.16, 0.24), FLAME_BASE);
    flames(3.5, 0.9, 3, rand(0.22, 0.36), rand(0.28, 0.4), FLAME);
    flames(4, 1.25, 2, rand(0.28, 0.42), rand(0.4, 0.55), FLAME_TIP);
    fire.smoke -= dt;
    if (fire.smoke <= 0) {
      fire.smoke = 0.14;
      flames(2.2, 1.6, 1, rand(0.35, 0.55), 1, SMOKE);
    }
  }
}

function end(g: Game) {
  g.phase = "over";
  g.boosting = false;
  audio.stop(g.engine);
  g.engine = null;
  best = Math.max(best, g.score);
  if (g.score > 0) {
    topScores.push(g.score);
    topScores.sort((x, y) => y - x);
    topScores.length = Math.min(topScores.length, 5);
  }
  if (g.lives > 0) {
    sfx.play("point", { volume: 0.9, pitch: 1.25 });
    haptics.notify("success");
  } else {
    sfx.play("die", { volume: 0.8 });
    haptics.notify("error");
  }
  g.onPhase("over");
}

function tick(g: Game, dt: number) {
  g.time += dt;
  const playing = g.phase === "playing";

  if (playing) {
    // Playtura counts the timer down in whole seconds.
    g.secondTimer += dt;
    while (g.secondTimer >= 1 && g.phase === "playing") {
      g.secondTimer -= 1;
      g.timeLeft -= 1;
      g.onTime(g.timeLeft);
      if (g.timeLeft <= 0) end(g);
    }
    g.baseSpeed = Math.min(MAX_SPEED, g.baseSpeed + ACCELERATION * dt);
    if (!g.boosting && g.nitro >= 1) boost(g); // a full tank fires by itself
    if (g.boosting) {
      g.nitro = Math.max(0, g.nitro - NITRO_BURN * dt);
      if (g.nitro <= 0) g.boosting = false;
    }
    const want = g.baseSpeed * (g.boosting ? NITRO_BOOST : 1);
    g.speed += (want - g.speed) * (1 - Math.exp(-dt * (g.boosting ? 2.5 : 1.2)));
    g.invulnerable = Math.max(0, g.invulnerable - dt);
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = Math.max(0.4, 1.0 - (g.speed - START_SPEED) * 0.02) * rand(0.8, 1.2);
      spawnTraffic(g);
    }
    if (AUTOPLAY) autopilot(g);
  } else if (g.phase === "over") {
    g.speed = Math.max(0, g.speed - 25 * dt); // roll to a stop
  }

  // Steering: slide toward the finger, scraping along the rail at the edges.
  const goal = clamp(g.target, -EDGE - 0.6, EDGE + 0.6);
  // The sideways speed eases toward the target instead of jumping to it, so lane changes curve in and settle.
  const wanted = playing ? clamp((goal - g.d) * 6, -LATERAL_SPEED, LATERAL_SPEED) : 0;
  g.lateral += (wanted - g.lateral) * (1 - Math.exp(-dt * STEER_RESPONSE));
  g.d += g.lateral * dt;
  g.scrape -= dt;
  if (Math.abs(g.d) > EDGE) {
    g.d = Math.sign(g.d) * EDGE;
    if (Math.sign(g.lateral) === Math.sign(g.d)) g.lateral = 0; // the rail stops it; steering away responds at once
    if (playing && Math.abs(goal) > EDGE + 0.2 && g.scrape <= 0) {
      g.scrape = 0.06;
      g.speed *= 0.985;
      const t = g.track.sample(g.s + 1.5, sample);
      placeAt(t, Math.sign(g.d) * (ROAD_HALF + 0.9), 0.6, at);
      g.world.burst({ position: [at[0], at[1], at[2]], count: 5, speed: 6, size: 0.08, lifetime: 0.35, color: [[1, 0.85, 0.3], [1, 0.55, 0.1]] });
      haptics.impact(0.25, 1);
    }
  }

  g.s += g.speed * dt;
  const size = g.assets.car.size;
  const steerYaw = Math.atan2(g.lateral, Math.max(8, g.speed)) * 0.9;
  drive(g, g.player.root, g.s, g.d, size[1] / 2, dt, steerYaw, clamp(g.lateral * 0.006, -0.06, 0.06));

  // Exhaust flames while boosting: launched at up to the car's own speed, so they trail behind it.
  if (g.boosting) {
    const t = g.track.sample(g.s - size[2] / 2 - 0.1, sample);
    const fwd = forwardOf(t.heading);
    for (const side of [-0.45, 0.45]) {
      placeAt(t, g.d + side, 0.38, at);
      g.world.burst({ position: [at[0], at[1], at[2]], direction: fwd, spread: 0.08, count: 3, size: 0.3, speed: g.speed * 0.95, lifetime: 0.25, gravity: 0, color: [[1, 0.55, 0.1], [0.45, 0.7, 1], [1, 0.85, 0.3]] });
    }
  }

  // Traffic drives along its lane; scored once behind the player, gone once far behind.
  for (let i = g.traffic.length - 1; i >= 0; i--) {
    const car = g.traffic[i]!;
    if (car.crashed) {
      if (!g.world.has(car.root)) g.traffic.splice(i, 1); // its lifetime ended
      continue;
    }
    const carSize = g.assets.car.size;
    car.s += TRAFFIC_SPEED * dt;
    // A shove slides it sideways, fading out; the rails bounce it back.
    car.bumpCooldown -= dt;
    car.d += car.vd * dt;
    car.vd *= Math.exp(-dt * 2.5);
    if (Math.abs(car.d) > EDGE) {
      car.d = Math.sign(car.d) * EDGE;
      car.vd = -car.vd * 0.3;
    }
    drive(g, car.root, car.s, car.d, carSize[1] / 2, dt, Math.atan2(car.vd, TRAFFIC_SPEED) * 0.9);
    const ds = car.s - g.s;
    const reach = (carSize[2] + size[2]) / 2 - 0.2;
    const gap = Math.abs(car.d - g.d);
    if (Math.abs(ds) < reach) {
      car.closest = Math.min(car.closest, gap);
      // Touching: the axis they overlap least on says how. Mostly side by side = a sideswipe; nose to
      // tail = a crash.
      const across = (carSize[0] + size[0]) / 2 - 0.1 - gap;
      const along = reach - Math.abs(ds);
      if (playing && across > 0) {
        if (across < along) {
          sideswipe(g, car, across);
        } else if (g.invulnerable <= 0) {
          crash(g, car);
          continue;
        }
      }
    }
    if (!car.passed && playing && ds < -reach) {
      car.passed = true;
      g.score += POINTS_PER_CAR_PASSED;
      g.onScore(g.score);
      g.nitro = Math.min(1, g.nitro + 0.12);
      sfx.play("point", { volume: 0.5 });
      haptics.impact(0.25, 0.9);
      if (car.closest < 2.9 && !car.bumped) {
        g.nitro = Math.min(1, g.nitro + 0.12);
        g.onNearMiss();
      }
    }
    if (ds < -30) {
      g.world.despawn(car.root);
      g.traffic.splice(i, 1);
    }
  }

  burn(g, dt);
  g.world.update(dt);

  // Segments left behind jump to the front.
  for (const seg of g.segments) {
    if (seg.s >= g.s - SEG_LEN * BEHIND) continue;
    seg.s += SEGMENTS * SEG_LEN;
    placeSegment(g, seg);
    for (const e of seg.props) g.world.despawn(e);
    seg.props.length = 0;
    spawnProps(g, seg);
  }

  // Camera: orbiting the car on the start screen, then low behind it, looking down the road.
  const drawn = g.world.worldPosition(g.player.root, tmp);
  if (drawn) {
    const cam = g.camera;
    const t = g.track.sample(g.s, look);
    const fwd = forwardOf(t.heading);
    let ex: number, ey: number, ez: number;
    if (g.phase === "ready") {
      g.orbit += dt * 0.35;
      const a = g.orbit + 0.9;
      ex = drawn[0] + Math.sin(a) * 9;
      ey = drawn[1] + 3;
      ez = drawn[2] + Math.cos(a) * 9;
      cam.target[0] = drawn[0];
      cam.target[1] = drawn[1] + 0.2;
      cam.target[2] = drawn[2];
    } else {
      // Low, like Asphalt: it sees under the tail to the rear tyres.
      ex = drawn[0] - fwd[0] * 7.6;
      ey = drawn[1] + 2.5 + Math.max(0, -t.pitch) * 3;
      ez = drawn[2] - fwd[2] * 7.6;
      cam.target[0] = drawn[0] + fwd[0] * 12;
      cam.target[1] = drawn[1] + 0.5 + Math.tan(t.pitch) * 12;
      cam.target[2] = drawn[2] + fwd[2] * 12;
    }
    const k = 1 - Math.exp(-dt * (g.phase === "ready" ? 20 : 7));
    cam.eye[0] += (ex - cam.eye[0]) * k + rand(-1, 1) * g.shake;
    cam.eye[1] += (ey - cam.eye[1]) * k + rand(-1, 1) * g.shake;
    cam.eye[2] += (ez - cam.eye[2]) * k;
    const fov = 0.95 + (g.speed / MAX_SPEED) * 0.28 + (g.boosting ? 0.18 : 0);
    cam.fov += (fov - cam.fov) * (1 - Math.exp(-dt * 4));
    g.world.set(g.horizon, { position: [drawn[0], 0, drawn[2]] });
  }
  g.shake *= Math.exp(-dt * 6);
  if (g.boosting) g.shake = Math.max(g.shake, 0.03);
}

/** Demo bot: head for the lane whose next car is furthest away; use nitro when the tank is full. */
function autopilot(g: Game) {
  const nearest = [Infinity, Infinity, Infinity];
  for (const car of g.traffic) {
    if (car.crashed) continue;
    const ahead = car.s - g.s;
    const lane = car.lane;
    if (ahead > -4 && lane >= 0) nearest[lane] = Math.min(nearest[lane]!, ahead);
  }
  let current = 0;
  for (let l = 1; l < 3; l++) if (Math.abs(LANES[l]! - g.d) < Math.abs(LANES[current]! - g.d)) current = l;
  let lane = current;
  if (nearest[current]! < 40) {
    for (const l of [current - 1, current + 1]) {
      if (l >= 0 && l < 3 && nearest[l]! > nearest[lane]! + 6) lane = l;
    }
  }
  g.target = LANES[lane]!;

}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

/**
 * How a host app configures the game, like Playtura's GameProps: the side buttons appear only when
 * given (Playtura shows its leaderboard and share buttons only for `onShowLeaderboard` / `onShare`).
 */
export type RacingProps = {
  /** The leaderboard button: a function to handle it yourself, `true` for the built-in session leaderboard, omitted to hide it. */
  leaderboard?: boolean | (() => void);
  /** The share button: a function given the score, `true` for the system share sheet, omitted to hide it. */
  share?: boolean | ((score: number) => void);
  /** "light" or "dark", like Playtura's `settings.theme`. Default: the system theme (and the in-game switch). */
  theme?: "light" | "dark";
};

type RunProps = RacingProps & { assets: Assets; onRestart: () => void; dark: boolean; onDark: (dark: boolean) => void };

function Run({ assets: a, onRestart, dark, onDark, leaderboard, share }: RunProps) {
  const game = useMemo(() => createGame(a, dark), [a, dark]);
  const theme = dark ? DARK : LIGHT;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const gameWidth = Math.min(width - 30, 500); // Playtura's getGameDimensions(): the scoreboard and controls are this wide
  const [phase, setPhase] = useState<Phase>("ready");
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [kmh, setKmh] = useState(0);
  const [nitro, setNitro] = useState(0.5);
  const [boosting, setBoosting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(!audio.muted);
  const [hapticsOn, setHapticsOn] = useState(haptics.enabled);
  // HUD animations run on the UI thread (Reanimated), so the game loop never stutters them.
  const flash = useSharedValue(0);
  const pulse = useSharedValue(1);
  const card = useSharedValue(0);
  const pop = useSharedValue(1);
  const near = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: card.value, transform: [{ scale: 0.85 + card.value * 0.15 }] }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const nearStyle = useAnimatedStyle(() => ({ opacity: near.value }));

  useEffect(() => {
    game.onPhase = setPhase;
    game.onLives = setLives;
    game.onTime = setTimeLeft;
    game.onScore = (s) => {
      setScore(s);
      pop.value = withSequence(withTiming(1.3, { duration: 0 }), withSpring(1, { damping: 8, stiffness: 320 }));
    };
    game.onFlash = () => {
      flash.value = withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 400 }));
    };
    game.onNearMiss = () => {
      near.value = withSequence(withTiming(1, { duration: 0 }), withTiming(0, { duration: 900 }));
    };
    // Gauges only need a few updates a second.
    const gauges = setInterval(() => {
      setKmh(Math.round(game.speed * 3.6));
      setNitro(game.nitro);
      setBoosting(game.boosting);
    }, 150);
    return () => {
      clearInterval(gauges);
      audio.stop(game.engine);
      game.world.dispose();
    };
  }, [game, flash, pop, near]);

  // The results wait a moment, so the crash (or the finish) is seen before the panel covers it.
  useEffect(() => {
    if (phase !== "over") return;
    const t = setTimeout(() => setShowResults(true), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  // Playtura's START GAME button breathes while the game waits for you.
  useEffect(() => {
    if (phase === "playing") {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1);
    return () => cancelAnimation(pulse);
  }, [phase, pulse]);

  // The results card springs in.
  useEffect(() => {
    if (!showResults) return;
    card.value = 0;
    card.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [showResults, card]);

  // Autoplay: start by itself and restart after a pause.
  useEffect(() => {
    if (!AUTOPLAY || phase === "playing") return;
    const t = setTimeout(phase === "ready" ? () => start(game) : onRestart, phase === "ready" ? 1500 : 3000);
    return () => clearTimeout(t);
  }, [phase, game, onRestart]);

  const onUpdate = useMemo(() => (dt: number) => tick(game, dt), [game]);

  // Relative steering: wherever the swipe starts, the car moves by how far the finger moves. Each move
  // adds its own distance, so pushing past the rail and swiping back responds at once.
  const onDrag = useMemo(
    () =>
      ({ phase: touch, dx }: DragEvent) => {
        if (touch === "start") game.dragX = 0;
        if (touch === "end") return;
        const metresPerPoint = (2 * EDGE) / (STEER_WIDTH * width);
        game.target = clamp(game.target + (dx - game.dragX) * metresPerPoint, -EDGE - 0.6, EDGE + 0.6);
        game.dragX = dx;
      },
    [game, width],
  );

  const won = lives > 0;
  return (
    <View style={styles.root}>
      <GameView source={game.world} camera={game.camera} light={dark ? NIGHT_LIGHT : DAY_LIGHT} background={dark ? NIGHT_SKY : SKY} fog={0.0075} onUpdate={onUpdate} onDrag={onDrag} />

      {/* Header, like Playtura's game screen: (back), title and level, settings. The example's screen
          switcher sits in the left slot, where Playtura has its back button. */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Car Racing
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {best > 0 ? `Best ${best}` : "Level 1"}
          </Text>
        </View>
        <Pressable style={styles.headerSide} onPress={() => setSettingsOpen(true)} hitSlop={10} accessibilityLabel="Game settings">
          <Text style={styles.headerIcon}>⚙︎</Text>
        </Pressable>
      </View>

      {/* Playtura's scoreboard: SCORE, LIVES and TIMER. */}
      <View style={styles.boardWrap} pointerEvents="none">
        <View style={[styles.board, { width: gameWidth }]}>
          <View style={styles.column}>
            <Text style={styles.label}>SCORE</Text>
            <Animated.Text style={[styles.value, popStyle]}>{score}</Animated.Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>LIVES</Text>
            <View style={styles.hearts}>
              {Array.from({ length: LIVES }, (_, i) => (
                <Text key={i} style={styles.heart}>
                  {i < lives ? "❤️" : "🖤"}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>TIMER</Text>
            <Text style={[styles.value, timeLeft <= LOW_TIME && styles.timeLow]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>
      </View>

      <Animated.Text pointerEvents="none" style={[styles.nearMiss, nearStyle]}>
        NEAR MISS!
      </Animated.Text>

      {phase === "ready" && (
        <View style={styles.readyNotes} pointerEvents="none">
          <Text style={styles.hint}>Swipe to steer · pass cars to fill nitro</Text>
          {/* The car model is CC-BY 4.0: it must be credited. */}
          <Text style={styles.credit}>Car: “Car Concept” by Khronos Group, after Unity Fan (CC BY 4.0)</Text>
        </View>
      )}

      {/* Speed and nitro, while driving. */}
      {phase === "playing" && (
        <View style={styles.gauges} pointerEvents="none">
          <View style={[styles.gauge, boosting && styles.gaugeBoost]}>
            <View style={[styles.nitroFill, { width: `${Math.round(nitro * 100)}%` }]} />
            <Text style={styles.gaugeText}>{boosting ? "NITRO!" : "NITRO"}</Text>
          </View>
          <View style={styles.gauge}>
            <Text style={styles.gaugeText}>{kmh} km/h</Text>
          </View>
        </View>
      )}

      {/* Playtura's game controls: leaderboard, the main button, share. */}
      <View style={styles.controls} pointerEvents="box-none">
        <View style={[styles.controlsRow, { width: gameWidth }]}>
          {leaderboard && (
            <Pressable
              style={styles.iconButton}
              onPress={typeof leaderboard === "function" ? leaderboard : () => setLeaderboardOpen(true)}
              accessibilityLabel="Leaderboard"
            >
              <Image source={TROPHY_ICON} style={[styles.icon, { tintColor: theme.TEXT }]} />
            </Pressable>
          )}

          {phase === "playing" ? (
            <View style={styles.mainWrap}>
              <Pressable style={styles.mainButton} onPress={onRestart}>
                <Text style={styles.mainText}>STOP GAME</Text>
                <Text style={styles.mainSubtext}>Stop current game</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View style={[styles.mainWrap, pulseStyle]}>
              <Pressable style={styles.mainButton} onPress={phase === "ready" ? () => start(game) : onRestart}>
                <Text style={styles.mainText} numberOfLines={1}>
                  START GAME
                </Text>
                <Text style={styles.mainSubtext} numberOfLines={1}>
                  Dodge traffic to score!
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {share && (
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                const result = Math.max(score, best);
                if (typeof share === "function") share(result);
                else Share.share({ message: `I scored ${result} in Car Racing on the Nayan engine! Can you beat it?` });
              }}
              accessibilityLabel="Share"
            >
              <Image source={SHARE_ICON} style={[styles.icon, { tintColor: theme.TEXT }]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Playtura's game-over card. */}
      {showResults && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.card, cardStyle]}>
            <Image source={TROPHY_ICON} style={[styles.cardIcon, { tintColor: theme.SCORE_HIGHLIGHT }]} />
            <Text style={styles.cardTitle}>{won ? "TIME UP!" : "CRASHED!"}</Text>
            <Text style={styles.cardMessage}>{won ? "Great driving!" : "You ran out of lives!"}</Text>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Final Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreBest}>Best {best}</Text>
            </View>
            <Pressable
              style={styles.playAgain}
              onPress={() => {
                haptics.selection();
                onRestart();
              }}
            >
              <Text style={styles.playAgainText}>▶  Play Again!</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Leaderboard: this session's best runs. */}
      {leaderboardOpen && (
        <Pressable style={styles.overlay} onPress={() => setLeaderboardOpen(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Image source={TROPHY_ICON} style={[styles.cardIcon, { tintColor: theme.SCORE_HIGHLIGHT }]} />
            <Text style={styles.cardTitle}>Leaderboard</Text>
            {topScores.length === 0 ? (
              <Text style={styles.cardMessage}>No runs yet: start a game!</Text>
            ) : (
              <View style={styles.ranks}>
                {topScores.map((value, i) => (
                  <View key={i} style={styles.rankRow}>
                    <Text style={styles.rankPlace}>#{i + 1}</Text>
                    <Text style={styles.rankScore}>{value}</Text>
                  </View>
                ))}
              </View>
            )}
            <Pressable style={styles.playAgain} onPress={() => setLeaderboardOpen(false)}>
              <Text style={styles.playAgainText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* Playtura's settings: sound and haptics. */}
      {settingsOpen && (
        <Pressable style={styles.overlay} onPress={() => setSettingsOpen(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>Settings</Text>
            {(
              [
                ["Sounds", soundOn, (on: boolean) => ((audio.muted = !on), setSoundOn(on))],
                ["Haptics", hapticsOn, (on: boolean) => ((haptics.enabled = on), setHapticsOn(on))],
                ["Dark mode", dark, onDark],
              ] as const
            ).map(([label, on, set]) => (
              <View key={label} style={styles.settingRow}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Switch value={on} onValueChange={set} trackColor={{ false: theme.SWITCH_TRACK_OFF, true: theme.SWITCH_TRACK_ON }} thumbColor={theme.SWITCH_THUMB} />
              </View>
            ))}
            <Pressable style={styles.playAgain} onPress={() => setSettingsOpen(false)}>
              <Text style={styles.playAgainText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
    </View>
  );
}

export function Racing(props: RacingProps) {
  const [run, setRun] = useState(0);
  const [loaded, setLoaded] = useState<Assets | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([loadAssets(), sfx.ready])
      .then(([a]) => alive && setLoaded(a))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);
  const restart = useMemo(() => () => setRun((r) => r + 1), []);
  // Follows the system theme like Playtura's games, and can be switched in the game's settings.
  const system = useColorScheme() === "dark";
  const [choice, setChoice] = useState<boolean | null>(null);
  const dark = choice ?? (props.theme ? props.theme === "dark" : system);
  if (!loaded) {
    return (
      <View style={[baseStyles.root, baseStyles.loading, { backgroundColor: (dark ? DARK : LIGHT).BACKGROUND }]}>
        <Text style={[baseStyles.loadingText, { color: (dark ? DARK : LIGHT).TEXT }]}>{error ?? "Loading…"}</Text>
      </View>
    );
  }
  // A new theme rebuilds the scene (day or night), so it starts a fresh run.
  return <Run key={`${run}-${dark}`} {...props} assets={loaded} onRestart={restart} dark={dark} onDark={setChoice} />;
}

// Playtura's game themes (ThemeService): light, and dark (which also drives the scene at night).
type Theme = typeof LIGHT;
const LIGHT = {
  BACKGROUND: "#C8C2E0",
  SURFACE: "rgba(255, 255, 255, 0.55)",
  BORDER: "rgba(255, 255, 255, 0.9)",
  BORDER_WIDTH: 1.5,
  TEXT: "#0F1729",
  TEXT_SUBTLE: "#0F1729",
  TEXT_SHADOW: "transparent",
  SOLID: "#6F3EF4",
  ON_SOLID: "#FFFFFF",
  SCORE_HIGHLIGHT: "#6F3EF4",
  DANGER: "#EF4343",
  OVERLAY: "rgba(15, 23, 41, 0.8)",
  SWITCH_TRACK_OFF: "rgba(15, 23, 41, 0.15)",
  SWITCH_TRACK_ON: "#6F3EF4",
  SWITCH_THUMB: "#FFFFFF",
  HEADER_BACKGROUND: "rgba(255, 255, 255, 0.55)",
  HEADER_BORDER: "rgba(255, 255, 255, 0.9)",
  HEADER_TINT: "#0F1729",
  NITRO: "rgba(111, 62, 244, 0.45)",
  NEAR_MISS: "#6F3EF4",
};
const DARK: Theme = {
  BACKGROUND: "#17122B",
  SURFACE: "rgba(153, 118, 249, 0.16)",
  BORDER: "rgba(153, 118, 249, 0.22)",
  BORDER_WIDTH: 1.5,
  TEXT: "#F9F8FB",
  TEXT_SUBTLE: "#F9F8FB",
  TEXT_SHADOW: "transparent",
  SOLID: "#9976F9",
  ON_SOLID: "#FFFFFF",
  SCORE_HIGHLIGHT: "#F6A823",
  DANGER: "#DC2828",
  OVERLAY: "rgba(0, 0, 0, 0.86)",
  SWITCH_TRACK_OFF: "rgba(153, 118, 249, 0.3)",
  SWITCH_TRACK_ON: "#9976F9",
  SWITCH_THUMB: "#F9F8FB",
  HEADER_BACKGROUND: "rgba(153, 118, 249, 0.16)",
  HEADER_BORDER: "rgba(153, 118, 249, 0.2)",
  HEADER_TINT: "#F9F8FB",
  NITRO: "rgba(153, 118, 249, 0.5)",
  NEAR_MISS: "#F6A823",
};

const baseStyles = StyleSheet.create({
  root: { flex: 1 },
  loading: { alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 18, fontWeight: "700" },
});

function makeStyles(t: Theme) {
  const shadow = { textShadowColor: t.TEXT_SHADOW, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 };
  const panel = { backgroundColor: t.SURFACE, borderColor: t.BORDER, borderWidth: t.BORDER_WIDTH };
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.BACKGROUND },

    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_HEIGHT,
      paddingTop: SAFE_TOP,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.HEADER_BACKGROUND,
      borderBottomWidth: 1,
      borderBottomColor: t.HEADER_BORDER,
    },
    headerSide: { width: 88, alignItems: "flex-end", justifyContent: "center" },
    headerTitleBox: { flex: 1, alignItems: "center" },
    headerTitle: { color: t.HEADER_TINT, fontSize: 18, fontWeight: "600" },
    headerSubtitle: { color: t.HEADER_TINT, fontSize: 14, fontWeight: "600", marginTop: -1 },
    headerIcon: { color: t.HEADER_TINT, fontSize: 24 },

    boardWrap: { position: "absolute", top: HEADER_HEIGHT + 15, left: 0, right: 0, alignItems: "center" },
    board: { ...panel, flexDirection: "row", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 18 },
    column: { flex: 1, alignItems: "center" },
    label: { color: t.TEXT, fontSize: 12, fontWeight: "500", letterSpacing: 1.2, marginBottom: 4, ...shadow },
    value: { color: t.TEXT, fontSize: 24, fontWeight: "800", fontVariant: ["tabular-nums"], ...shadow },
    timeLow: { color: t.DANGER },
    hearts: { flexDirection: "row" },
    heart: { fontSize: 22, marginHorizontal: 3 },

    nearMiss: { position: "absolute", top: HEADER_HEIGHT + 110, alignSelf: "center", color: t.NEAR_MISS, fontSize: 30, fontWeight: "900", fontStyle: "italic" },
    readyNotes: { position: "absolute", bottom: 128, left: 16, right: 16, alignItems: "center", gap: 6 },
    hint: { ...panel, color: t.TEXT, fontSize: 14, fontWeight: "600", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: "hidden" },
    credit: { ...panel, color: t.TEXT, fontSize: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },

    controls: { position: "absolute", bottom: 5, left: 0, right: 0, alignItems: "center" },
    controlsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 20, paddingHorizontal: 16, gap: 20 },
    iconButton: { ...panel, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    icon: { width: 24, height: 24 },
    gauges: { position: "absolute", bottom: 112, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 10 },
    gauge: { ...panel, minWidth: 104, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, alignItems: "center", overflow: "hidden" },
    gaugeBoost: { borderColor: t.SCORE_HIGHLIGHT },
    gaugeText: { color: t.TEXT, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: 0.5, ...shadow },
    nitroFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: t.NITRO },
    mainWrap: { flex: 1 },
    mainButton: { ...panel, minHeight: 60, borderRadius: 30, paddingHorizontal: 24, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    mainText: { color: t.TEXT, fontSize: 16, fontWeight: "800", letterSpacing: 1, ...shadow },
    mainSubtext: { color: t.TEXT, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, marginTop: 2 },

    overlay: { ...StyleSheet.absoluteFill, backgroundColor: t.OVERLAY, alignItems: "center", justifyContent: "center" },
    card: { width: "95%", maxWidth: 500, borderRadius: 16, backgroundColor: t.BACKGROUND, padding: 20, alignItems: "center" },
    cardIcon: { width: 48, height: 48 },
    ranks: { width: "100%", marginBottom: 20 },
    rankRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.SURFACE, marginTop: 6 },
    rankPlace: { color: t.TEXT, fontSize: 16, fontWeight: "700" },
    rankScore: { color: t.SCORE_HIGHLIGHT, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
    cardTitle: { color: t.TEXT, fontSize: 28, fontWeight: "bold", letterSpacing: 1, marginTop: 8, marginBottom: 4 },
    cardMessage: { color: t.TEXT_SUBTLE, fontSize: 14, marginBottom: 16 },
    scoreCard: { backgroundColor: t.SURFACE, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: "center", marginBottom: 24 },
    scoreLabel: { color: t.TEXT_SUBTLE, fontSize: 13, fontWeight: "600", letterSpacing: 1, marginBottom: 4 },
    scoreValue: { color: t.SCORE_HIGHLIGHT, fontSize: 44, fontWeight: "bold", fontVariant: ["tabular-nums"] },
    scoreBest: { color: t.TEXT_SUBTLE, fontSize: 12, fontWeight: "600", marginTop: 2 },
    playAgain: { width: "100%", paddingVertical: 16, borderRadius: 28, backgroundColor: t.SOLID, alignItems: "center" },
    playAgainText: { color: t.ON_SOLID, fontSize: 17, fontWeight: "bold", letterSpacing: 0.5 },
    settingRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
    settingLabel: { color: t.TEXT, fontSize: 16, fontWeight: "600" },

    flash: { backgroundColor: "#ff3b3b" },
  });
}
