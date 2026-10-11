import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
const TRAFFIC_SPEED = 14; // one speed: cars keep the gaps they spawned with, so no wall forms later
const SPAWN_AHEAD = 170; // hidden by fog
const CRASH_SLOWDOWN = 0.55;
const INVULNERABLE = 1.6; // seconds after a crash
const SEG_LEN = 6;
const SEGMENTS = 42;
const RS = 0.2; // road segment roots sit this far below the surface: their colliders are 0.4 thick

const SKY = [0.62, 0.78, 0.95] as const;
const GRASS: Color = [0.27, 0.5, 0.18];
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

type Kind = "sports" | "sedan" | "suv";
/** Three models in one frame: a glossy white body the entity color paints, the windows, and untinted trim. */
type CarModel = { body: Model; glass: Model; trim: Model; size: Vec3 };
type Assets = { cars: Record<Kind, CarModel>; asphalt: Texture; facade: Texture; tree: Model };

let assets: Promise<Assets> | undefined;
function loadAssets(): Promise<Assets> {
  // Paint and glass are glossy (sun highlights, sky reflections); tyres and bumpers nearly matte.
  const car = (body: number, glass: number, trim: number) =>
    Promise.all([
      loadModel(body, { center: false, shine: 0.85 }),
      loadModel(glass, { center: false, shine: 0.95 }),
      loadModel(trim, { center: false, shine: 0.12 }),
    ]).then(([b, gl, t]) => ({
      body: b,
      glass: gl,
      trim: t,
      size: [Math.max(b.size[0], t.size[0]), Math.max(b.size[1], t.size[1]), Math.max(b.size[2], t.size[2])] as Vec3,
    }));
  assets ??= Promise.all([
    car(require("../../assets/models/sports_body.glb"), require("../../assets/models/sports_glass.glb"), require("../../assets/models/sports_trim.glb")),
    car(require("../../assets/models/sedan_body.glb"), require("../../assets/models/sedan_glass.glb"), require("../../assets/models/sedan_trim.glb")),
    car(require("../../assets/models/suv_body.glb"), require("../../assets/models/suv_glass.glb"), require("../../assets/models/suv_trim.glb")),
    loadTexture(require("../../assets/textures/asphalt.png")),
    loadTexture(require("../../assets/textures/facade.png")),
    loadModel(require("../../assets/models/tree.glb"), { center: false }),
  ]).then(([sports, sedan, suv, asphalt, facade, tree]) => ({ cars: { sports, sedan, suv }, asphalt, facade, tree }));
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
    const t = Math.max(0, s);
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
  kind: Kind;
  s: number;
  d: number;
  passed: boolean;
  crashed: boolean;
  /** Closest it came beside the player, for near misses. */
  closest: number;
};
type Segment = { root: Entity; s: number };

let best = 0;
// Reused per frame, so the game loop doesn't allocate.
const tmp: [number, number, number] = [0, 0, 0];
const at: [number, number, number] = [0, 0, 0];
const sample: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
const look: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A car: an invisible root at its middle (the collider's centre once wrecked) with body, glass and trim attached. */
function spawnCar(world: World, a: Assets, kind: Kind, paint: Color, position: Vec3) {
  const model = a.cars[kind];
  const root = world.spawn({ mesh: "none", position });
  const offset: Vec3 = [0, -model.size[1] / 2, 0];
  const body = world.spawn({ mesh: model.body, parent: root, position: offset, color: paint });
  const glass = world.spawn({ mesh: model.glass, parent: root, position: offset });
  const trim = world.spawn({ mesh: model.trim, parent: root, position: offset });
  return { root, body, glass, trim };
}

function createGame(a: Assets) {
  const world = new World(1800);
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
      add("cube", [side * (ROAD_HALF + 31), RS - 0.09 + lift, 0], [62, 0.1, len], i % 2 ? GRASS : [0.25, 0.47, 0.17]);
      for (const z of [-SEG_LEN / 4, SEG_LEN / 4]) {
        const red = (i * 2 + (z > 0 ? 1 : 0)) % 2 === 0;
        add("cube", [side * (ROAD_HALF + 0.2), RS + 0.01 + lift, z], [0.5, 0.08, SEG_LEN / 2], red ? [0.85, 0.12, 0.1] : [0.95, 0.95, 0.95]);
      }
      add("cube", [side * (ROAD_HALF - 0.12), RS + 0.004 + lift, 0], [0.14, 0.02, len], LINE);
      add("cube", [side * (LANE_W / 2), RS + 0.004 + lift, 0], [0.14, 0.02, 2.6], LINE);
      add("cube", [side * (ROAD_HALF + 1.1), RS + 0.55, 0], [0.1, 0.26, len], RAIL);
      add("cube", [side * (ROAD_HALF + 1.15), RS + 0.3, 0], [0.12, 0.6, 0.12], [0.45, 0.46, 0.5]);
    }
    // Scenery: street lights, trees and buildings, alternating sides.
    const side = i % 2 ? 1 : -1;
    if (i % 4 === 0) {
      add("cylinder", [side * (ROAD_HALF + 1.7), RS + 3.2, 0], [0.16, 6.4, 0.16], [0.35, 0.36, 0.4]);
      add("cube", [side * (ROAD_HALF + 0.8), RS + 6.35, 0], [1.9, 0.1, 0.12], [0.35, 0.36, 0.4]);
      add("cube", [side * (ROAD_HALF - 0.05), RS + 6.25, 0], [0.7, 0.1, 0.32], [1, 0.97, 0.82]);
    }
    if (i % 3 === 1) {
      const h = rand(12, 34);
      const tone = rand(0.75, 1);
      add("cube", [side * (ROAD_HALF + rand(13, 22)), RS + h / 2, rand(-1, 1)], [rand(8, 13), h, rand(7, 11)], [tone, tone * rand(0.92, 1), tone * rand(0.88, 1)], a.facade);
    } else {
      for (let t = 0; t < 2; t++) {
        add(a.tree, [-side * (ROAD_HALF + rand(4, 16)), RS, rand(-SEG_LEN / 2, SEG_LEN / 2)], rand(2.2, 3.6), [1, 1, 1]);
      }
    }
    segments.push({ root, s: (i - 3) * SEG_LEN });
  }

  // Mountains all around, riding along with the player so they never get closer.
  const horizon = world.spawn({ mesh: "none" });
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

  const player = spawnCar(world, a, "sports", PLAYER_PAINT, [0, a.cars.sports.size[1] / 2, 0]);
  world.listener = player.root;

  const g = {
    world,
    track: new Track(),
    assets: a,
    camera,
    player,
    horizon,
    segments,
    traffic: [] as Car[],
    phase: "ready" as Phase,
    time: 0,
    s: 0,
    d: 0,
    target: 0, // where the finger wants the car across the road
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
  for (const seg of segments) placeSegment(g, seg);
  return g;
}
type Game = ReturnType<typeof createGame>;

function placeSegment(g: Game, seg: Segment) {
  const t = g.track.sample(seg.s, sample);
  g.world.set(seg.root, { position: [t.x, t.y - RS, t.z], rotation: orient(t.heading, t.pitch) });
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
  for (const car of g.traffic) if (!car.crashed && Math.abs(car.s - s) < window) blocked.add(LANES.indexOf(car.d));
  const open = [0, 1, 2].filter((l) => !blocked.has(l));
  if (open.length <= 1) return;
  const d = LANES[pick(open)]!;
  const kind = pick<Kind>(["sedan", "sedan", "suv", "sports"]);
  const t = g.track.sample(s, sample);
  placeAt(t, d, g.assets.cars[kind].size[1] / 2, at);
  const { root } = spawnCar(g.world, g.assets, kind, pick(PAINTS), [at[0], at[1], at[2]]);
  g.world.set(root, { rotation: orient(t.heading, t.pitch) });
  g.traffic.push({ root, kind, s, d, passed: false, crashed: false, closest: Infinity });
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
  const size = g.assets.cars[car.kind].size;
  g.world.set(car.root, {
    physics: { type: "dynamic", size: [size[0] * 0.95, size[1], size[2] * 0.95], layer: 8, mask: 4 | 8, bounce: 0.25, friction: 0.6, density: 0.4 },
    spin: [rand(-2, 2), rand(-5, 5), -side * rand(2, 5)],
    impact: { sound: sfx.get("bump"), minSpeed: 2, maxSpeed: 14, volume: 0.8, haptic: 0.3 },
    lifetime: 2.6,
  });
  g.world.impulse(car.root, [right[0] * side * 10 + fwd[0] * g.speed * 0.5, 8, right[2] * side * 10 + fwd[2] * g.speed * 0.5]);
  const p = g.world.position(car.root);
  if (p) g.world.burst({ position: p, count: 30, speed: 8, size: 0.2, lifetime: 0.7, color: [[1, 0.6, 0.15], [1, 0.9, 0.3], [0.3, 0.3, 0.32]] });

  g.speed = Math.max(START_SPEED * 0.6, g.speed * CRASH_SLOWDOWN);
  g.boosting = false;
  g.shake = 0.5;
  g.lives -= 1;
  g.onLives(g.lives);
  g.onFlash();
  sfx.play("hit", { volume: 1 });
  haptics.impact(1, 0.8);
  if (g.lives <= 0) {
    end(g);
    return;
  }
  // A blink while the player can't be hit again.
  g.invulnerable = INVULNERABLE;
  const [r, gr, b] = PLAYER_PAINT;
  const blink = { duration: 0.2, repeat: 7 };
  g.world.animate(g.player.body, [{ color: [r, gr, b, 0.25] }, { color: [r, gr, b, 1] }], blink);
  for (const part of [g.player.glass, g.player.trim]) g.world.animate(part, [{ color: [1, 1, 1, 0.25] }, { color: [1, 1, 1, 1] }], blink);
}

function end(g: Game) {
  g.phase = "over";
  g.boosting = false;
  audio.stop(g.engine);
  g.engine = null;
  best = Math.max(best, g.score);
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
  g.lateral = playing ? clamp((goal - g.d) * 7, -LATERAL_SPEED, LATERAL_SPEED) : g.lateral * Math.exp(-dt * 6);
  g.d += g.lateral * dt;
  g.scrape -= dt;
  if (Math.abs(g.d) > EDGE) {
    g.d = Math.sign(g.d) * EDGE;
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
  const size = g.assets.cars.sports.size;
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
    const carSize = g.assets.cars[car.kind].size;
    car.s += TRAFFIC_SPEED * dt;
    drive(g, car.root, car.s, car.d, carSize[1] / 2, dt);
    const ds = car.s - g.s;
    const reach = (carSize[2] + size[2]) / 2 - 0.2;
    const gap = Math.abs(car.d - g.d);
    if (Math.abs(ds) < reach) {
      car.closest = Math.min(car.closest, gap);
      if (playing && g.invulnerable <= 0 && gap < (carSize[0] + size[0]) / 2 - 0.1) {
        crash(g, car);
        continue;
      }
    }
    if (!car.passed && playing && ds < -reach) {
      car.passed = true;
      g.score += POINTS_PER_CAR_PASSED;
      g.onScore(g.score);
      g.nitro = Math.min(1, g.nitro + 0.12);
      sfx.play("point", { volume: 0.5 });
      haptics.impact(0.25, 0.9);
      if (car.closest < 2.9) {
        g.nitro = Math.min(1, g.nitro + 0.12);
        g.onNearMiss();
      }
    }
    if (ds < -30) {
      g.world.despawn(car.root);
      g.traffic.splice(i, 1);
    }
  }

  g.world.update(dt);

  // Segments left behind jump to the front.
  for (const seg of g.segments) {
    if (seg.s >= g.s - SEG_LEN * 3) continue;
    seg.s += SEGMENTS * SEG_LEN;
    placeSegment(g, seg);
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
      ex = drawn[0] - fwd[0] * 8.6;
      ey = drawn[1] + 3.1 + Math.max(0, -t.pitch) * 3;
      ez = drawn[2] - fwd[2] * 8.6;
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
    const lane = LANES.indexOf(car.d);
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
  if (g.nitro > 0.7) boost(g);
}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

function Run({ assets: a, onRestart }: { assets: Assets; onRestart: () => void }) {
  const game = useMemo(() => createGame(a), [a]);
  const light = useMemo<Light>(() => ({ direction: [0.45, 0.85, 0.3], ambient: 0.5, shadowExtent: 26 }), []);
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [kmh, setKmh] = useState(0);
  const [nitro, setNitro] = useState(0.5);
  const [boosting, setBoosting] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const near = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    game.onPhase = setPhase;
    game.onLives = setLives;
    game.onTime = setTimeLeft;
    game.onScore = (s) => {
      setScore(s);
      pop.setValue(1.3);
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    };
    game.onFlash = () => {
      flash.setValue(0.6);
      Animated.timing(flash, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    };
    game.onNearMiss = () => {
      near.setValue(1);
      Animated.timing(near, { toValue: 0, duration: 900, useNativeDriver: true }).start();
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

  // Autoplay: start by itself and restart after a pause.
  useEffect(() => {
    if (!AUTOPLAY || phase === "playing") return;
    const t = setTimeout(phase === "ready" ? () => start(game) : onRestart, phase === "ready" ? 1500 : 3000);
    return () => clearTimeout(t);
  }, [phase, game, onRestart]);

  const onUpdate = useMemo(() => (dt: number) => tick(game, dt), [game]);

  // Steer like Asphalt: the car slides toward the finger's spot across the screen.
  const onDrag = useMemo(
    () =>
      ({ phase: touch, x }: DragEvent) => {
        if (touch !== "end") game.target = ((x / width) * 2 - 1) * (EDGE + 0.8);
      },
    [game, width],
  );

  return (
    <View style={styles.root}>
      <GameView source={game.world} camera={game.camera} light={light} background={SKY} fog={0.0075} onUpdate={onUpdate} onDrag={onDrag} />

      {phase !== "ready" && (
        <View style={styles.board} pointerEvents="none">
          <View style={styles.column}>
            <Text style={styles.label}>SCORE</Text>
            <Animated.Text style={[styles.value, { transform: [{ scale: pop }] }]}>{score}</Animated.Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>LIVES</Text>
            <Text style={styles.hearts}>{Array.from({ length: LIVES }, (_, i) => (i < lives ? "❤️" : "🖤")).join("")}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>TIMER</Text>
            <Text style={[styles.value, timeLeft <= LOW_TIME && styles.timeLow]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>
      )}

      <Animated.Text pointerEvents="none" style={[styles.nearMiss, { opacity: near }]}>
        NEAR MISS!
      </Animated.Text>

      {phase === "playing" && (
        <>
          <Pressable style={[styles.nitro, boosting && styles.nitroOn, nitro < 0.15 && styles.nitroEmpty]} onPressIn={() => boost(game)}>
            <View style={[styles.nitroFill, { height: `${Math.round(nitro * 100)}%` }]} />
            <Text style={styles.nitroText}>NITRO</Text>
          </Pressable>
          <View style={styles.speedo} pointerEvents="none">
            <Text style={styles.speed}>{kmh}</Text>
            <Text style={styles.unit}>km/h</Text>
          </View>
        </>
      )}

      {phase === "ready" && (
        <>
          <Text style={[styles.title, styles.readyTitle]} pointerEvents="none">
            Racing
          </Text>
          <View style={styles.readyBottom}>
            <Pressable style={styles.button} onPress={() => start(game)}>
              <Text style={styles.buttonText}>Start</Text>
            </Pressable>
            <Text style={styles.subtitle}>Dodge traffic to score!</Text>
            <Text style={styles.hint}>Drag to steer · tap NITRO to boost</Text>
          </View>
        </>
      )}

      {phase === "over" && (
        <View style={styles.center}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{lives > 0 ? "TIME UP!" : "CRASHED!"}</Text>
            <Text style={styles.message}>{lives > 0 ? "Great driving!" : "You ran out of lives!"}</Text>
            <View style={styles.row}>
              <View style={styles.cell}>
                <Text style={styles.panelLabel}>Score</Text>
                <Text style={styles.panelValue}>{score}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.panelLabel}>Best</Text>
                <Text style={styles.panelValue}>{best}</Text>
              </View>
            </View>
            <Pressable
              style={styles.button}
              onPress={() => {
                haptics.selection();
                onRestart();
              }}
            >
              <Text style={styles.buttonText}>Play Again!</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
    </View>
  );
}

export function Racing() {
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
  if (!loaded) {
    return (
      <View style={[styles.root, styles.loading]}>
        <Text style={styles.subtitle}>{error ?? "Loading…"}</Text>
      </View>
    );
  }
  return <Run key={run} assets={loaded} onRestart={restart} />;
}

const shadow = { textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgb(158,199,242)" },
  loading: { alignItems: "center", justifyContent: "center" },
  // Playtura's scoreboard: SCORE, LIVES and TIMER columns on a translucent bar.
  board: {
    position: "absolute",
    top: 104,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(58,58,94,0.82)",
  },
  column: { alignItems: "center", minWidth: 80 },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  value: { color: "#fff", fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"], marginTop: 2 },
  hearts: { fontSize: 18, marginTop: 4, letterSpacing: 2 },
  timeLow: { color: "#ff5a5a" },
  nearMiss: { position: "absolute", top: 210, alignSelf: "center", color: "#ffd23f", fontSize: 30, fontWeight: "900", fontStyle: "italic", ...shadow },
  nitro: {
    position: "absolute",
    bottom: 44,
    left: 24,
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(20,24,40,0.6)",
    borderWidth: 3,
    borderColor: "#3fb6ff",
  },
  nitroOn: { borderColor: "#ffb020" },
  nitroEmpty: { opacity: 0.5 },
  nitroFill: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(63,182,255,0.55)" },
  nitroText: { color: "#fff", fontSize: 14, fontWeight: "900", fontStyle: "italic", ...shadow },
  speedo: { position: "absolute", bottom: 48, right: 24, alignItems: "flex-end" },
  speed: { color: "#fff", fontSize: 48, fontWeight: "900", fontStyle: "italic", fontVariant: ["tabular-nums"], ...shadow },
  unit: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: -4, ...shadow },
  center: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", gap: 16 },
  title: { color: "#fff", fontSize: 60, fontWeight: "900", fontStyle: "italic", ...shadow },
  // The start screen leaves the middle to the car the camera orbits.
  readyTitle: { position: "absolute", top: 150, alignSelf: "center" },
  readyBottom: { position: "absolute", bottom: 90, left: 0, right: 0, alignItems: "center", gap: 14 },
  subtitle: { color: "#fff", fontSize: 18, fontWeight: "700", ...shadow },
  hint: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600", ...shadow },
  button: { backgroundColor: "#ff4444", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36, marginTop: 4 },
  buttonText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  panel: {
    backgroundColor: "rgba(58,58,94,0.95)",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 30,
    alignItems: "center",
    gap: 12,
  },
  panelTitle: { color: "#fff", fontSize: 34, fontWeight: "900" },
  message: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", gap: 40, marginVertical: 4 },
  cell: { alignItems: "center" },
  panelLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  panelValue: { color: "#fff", fontSize: 30, fontWeight: "900", fontVariant: ["tabular-nums"] },
  flash: { backgroundColor: "#ff3b3b" },
});
