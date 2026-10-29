// Car Racing's rules, with no React: build a run with `createGame`, then `start` it and `tick` it every
// frame. Traffic, crashes, sideswipes, scoring, the autoplay bot and the camera. The screen listens
// through the `on…` hooks.
import {
  audio,
  haptics,
  World,
  type Camera,
  type Entity,
  type Vec3,
  type Voice,
} from "@nayan-ui/engine";
import {
  AUTOPLAY,
  CAMERA_FOV,
  CRASH_SLOWDOWN,
  EDGE,
  FINISH_CLEAR,
  INVULNERABLE,
  LANES,
  LATERAL_SPEED,
  LIVES,
  PAINTS,
  PLAYER_PAINT,
  POINTS_PER_CAR_PASSED,
  ROAD_HALF,
  SPAWN_AHEAD,
  START_SPEED,
  STEER_RESPONSE,
  TRACK_LENGTH,
  TRAFFIC_SPEED,
  sfx,
  type Assets,
} from "./config";
import {
  buildHorizon,
  buildRoad,
  setCarNight,
  setHorizonNight,
  burn,
  burning,
  clamp,
  explode,
  forwardOf,
  newSample,
  orient,
  pick,
  placeAt,
  placeSegment,
  rand,
  recycleRoad,
  rightOf,
  spawnCar,
  spawnProps,
  spawnRaceMarkers,
  Track,
  type Fire,
} from "./scene";
import { sparks } from "./effects";
import { frontHit, overlapAcross } from "./footprint";
import { CAR_FOOTPRINT } from "./meshes";

import { createChase, updateChase } from "./chase";
import { stepSteering, sideImpactSpeed, smoothSteeringPose } from "./handling";

export const session = { best: 0 };

export type Phase = "ready" | "playing" | "over";

// Reused per frame, so the game loop doesn't allocate.
const tmp: [number, number, number] = [0, 0, 0];
const driveRotation: [number, number, number, number] = [0, 0, 0, 1];
const at: [number, number, number] = [0, 0, 0];
const sample = newSample();
const look = newSample();

export function createGame(a: Assets, night: boolean) {
  const world = new World(2600);
  const camera: Camera = { eye: [6, 3, 6], target: [0, 0.6, 0], fov: CAMERA_FOV };
  const segments = buildRoad(world, a);
  const horizon = buildHorizon(world, night);
  const player = spawnCar(world, a, PLAYER_PAINT, [0, a.car.size[1] / 2, 0], night);
  world.listener = player.root;

  const g = {
    world,
    night,
    track: new Track(),
    chase: createChase(),
    assets: a,
    camera,
    player,
    horizon,
    segments,
    traffic: [] as Car[],
    /** Wrecks on fire. */
    burning: [] as Fire[],
    phase: "ready" as Phase,
    time: 0,
    s: 0,
    d: 0,
    target: 0, // where the finger wants the car across the road
    dragX: 0, // the finger's last dx, so each move steers by its own distance
    speed: 0,
    lateral: 0,
    steeringPose: { yaw: 0, roll: 0 },
    spawnTimer: 0.5,
    invulnerable: 0,
    scrape: 0,
    orbit: 0,
    /** Score, lives and the countdown live in the engine (Rust), advanced by world.update. */
    get score() {
      return world.scoreboard.score;
    },
    get lives() {
      return world.scoreboard.lives;
    },
    /** Metres left to the finish gate. */
    left: TRACK_LENGTH,
    disposed: false,
    shake: 0,
    engine: null as Voice | null,
    audible: true,
    // UI hooks, set by the screen.
    onPhase: (_p: Phase) => {},
    onScore: (_s: number) => {},
    onLives: (_l: number) => {},
    onDistance: (_metres: number) => {},
    onFlash: () => {},
    onNearMiss: () => {},
  };
  for (const seg of segments) {
    placeSegment(g, seg);
    spawnProps(g, seg);
  }
  world.scoreboard.reset(LIVES);
  spawnRaceMarkers(world, g.track, 0, TRACK_LENGTH, a.font);
  return g;
}
export type Game = ReturnType<typeof createGame>;

export function start(g: Game) {
  if (g.disposed || g.phase !== "ready") return;
  g.phase = "playing";
  g.speed = START_SPEED;
  // Fill the road ahead, so the first cars arrive within seconds.
  for (
    let ahead = 50;
    ahead < Math.min(SPAWN_AHEAD, TRACK_LENGTH - FINISH_CLEAR);
    ahead += rand(18, 26)
  )
    spawnTraffic(g, ahead);
  g.engine = g.audible ? sfx.play("engine", { volume: 0.32, loop: true }) : null;
  // Sounds load alongside the scene; if they're still decoding, the engine starts once they're in.
  if (!g.engine) {
    sfx.ready.then(() => {
      if (!g.disposed && g.audible && g.phase === "playing" && !g.engine)
        g.engine = sfx.play("engine", { volume: 0.32, loop: true });
    });
  }
  g.onPhase("playing");
  sfx.play("nitro", { volume: 0.6 });
  haptics.impact(0.6, 0.4);
}

/** Mirrors the shared screen's audible state without letting an engine loop leak to another screen. */
export function setAudible(g: Game, enabled: boolean) {
  g.audible = enabled;
  if (!enabled) {
    audio.stop(g.engine);
    g.engine = null;
    return;
  }
  if (g.phase !== "playing" || g.engine || g.disposed) return;
  const resume = () => {
    if (!g.disposed && g.audible && g.phase === "playing" && !g.engine)
      g.engine = sfx.play("engine", { volume: 0.32, loop: true });
  };
  resume();
  if (!g.engine) void sfx.ready.then(resume);
}

/** Change only lighting and celestial details; preserve the current race and scenery layout. */
export function setNight(g: Game, night: boolean) {
  if (g.disposed || g.night === night) return;
  g.night = night;
  setHorizonNight(g.world, g.horizon, night);
  setCarNight(g.world, g.player, night, g.assets.car.size[1]);
  for (const car of g.traffic) setCarNight(g.world, car, night, g.assets.car.size[1]);
  for (const segment of g.segments)
    for (const lamp of segment.lights)
      g.world.set(lamp.entity, { color: night ? lamp.night : lamp.day });
}

/** Steers toward the finger: `dx` is the drag's distance so far, `metresPerPoint` how far that moves the car. */
export function steer(
  g: Game,
  phase: "start" | "move" | "end",
  dx: number,
  metresPerPoint: number,
) {
  if (phase === "start") g.dragX = 0;
  if (phase === "end") return;
  g.target = clamp(g.target + (dx - g.dragX) * metresPerPoint, -EDGE - 0.6, EDGE + 0.6);
  g.dragX = dx;
}

/** Stops the run's sounds and frees its world (the screen unmounting). */
export function dispose(g: Game) {
  g.disposed = true;
  audio.stop(g.engine);
  g.world.dispose();
}

/** Present the integrated pose exactly once; the engine only simulates independent wrecks. */
function drive(
  g: Game,
  root: Entity,
  s: number,
  d: number,
  h: number,
  dt: number,
  yaw = 0,
  roll = 0,
) {
  const t = g.track.sample(s, sample);
  placeAt(t, d, h, at);
  g.world.set(root, {
    position: at,
    velocity: [0, 0, 0],
    rotation: orient(t.heading, t.pitch, yaw, roll, driveRotation),
  });
}

function crash(g: Game, car: Car, damagePlayer = true) {
  car.crashed = true;
  car.passed = true; // no points for a car you hit
  // The other car is knocked off the road: real physics from here, with the core thumping on impacts.
  const t = g.track.sample(car.s, sample);
  const right = rightOf(t.heading);
  const side = Math.sign(car.d - g.d) || (Math.random() < 0.5 ? -1 : 1);
  const size = g.assets.car.size;
  g.world.set(car.root, {
    physics: {
      type: "dynamic",
      size: [size[0] * 0.95, size[1], size[2] * 0.95],
      layer: 8,
      mask: 4 | 8,
      bounce: 0.25,
      friction: 0.6,
      density: 0.4,
    },
    spin: [rand(-2, 2), rand(-5, 5), -side * rand(2, 5)],
    impact: { sound: sfx.get("bump"), minSpeed: 2, maxSpeed: 14, volume: 0.8, haptic: 0.3 },
    lifetime: 3.6,
  });
  // Thrown on ahead at about the player's new speed, so it tumbles and slides along in view, burning,
  // before friction lets the player pass it.
  g.speed = damagePlayer ? Math.max(START_SPEED * 0.6, g.speed * CRASH_SLOWDOWN) : g.speed * 0.9;
  const ahead = g.speed * 1.1;
  // The way the road runs here (toward larger s), measured from the track itself.
  const a = g.track.sample(car.s, sample);
  const ax = a.x;
  const az = a.z;
  const b = g.track.sample(car.s + 1, sample);
  const len = Math.hypot(b.x - ax, b.z - az) || 1;
  const along: Vec3 = [(b.x - ax) / len, 0, (b.z - az) / len];
  const sideways = damagePlayer ? 3 : 6;
  g.world.set(car.root, {
    velocity: [
      along[0] * ahead + right[0] * side * sideways,
      damagePlayer ? 4 : 3,
      along[2] * ahead + right[2] * side * sideways,
    ],
  });
  const p = g.world.position(car.root);
  if (p) explode(g.world, p);
  g.burning.push(burning(car.root, g.time + 3.2));

  g.shake = 0.5;
  if (damagePlayer) g.onLives(g.world.scoreboard.addLives(-1));
  g.onFlash();
  sfx.play("hit", { volume: 1 });
  haptics.impact(1, 0.8);
  if (g.lives <= 0) {
    // The player's car catches fire too, and keeps burning behind the results.
    g.burning.push(burning(g.player.root, Infinity));
    end(g);
    return;
  }
  g.invulnerable = INVULNERABLE; // a moment's grace, so one pile-up doesn't cost two lives
}

/**
 * A light sideswipe shoves both cars apart; a solid lateral impact sends the other car rolling
 * and burning through the same native wreck animation as a front hit, without a player life loss.
 */
function sideswipe(g: Game, car: Car, overlap: number) {
  const closing = sideImpactSpeed(g.lateral, car.vd, car.d - g.d);
  if (closing >= 2.5) {
    car.bumped = true;
    g.lateral *= 0.55;
    crash(g, car, false);
    return;
  }
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
  sparks(g.world, {
    position: [at[0], at[1], at[2]],
    count: 14,
    speed: 7,
    size: 0.07,
    lifetime: 0.4,
    gravity: -9.81,
    colors: [
      [1, 0.9, 0.4],
      [1, 0.65, 0.2],
    ],
  });
  sfx.play("bump", { volume: 0.9 });
  haptics.impact(0.6, 0.7);
}

function end(g: Game) {
  if (g.phase !== "playing") return;
  session.best = Math.max(session.best, g.score);
  g.world.scoreboard.stop();
  g.phase = "over";
  audio.stop(g.engine);
  g.engine = null;
  if (g.lives > 0) {
    sfx.play("win", { volume: 0.8 });
    haptics.notify("success");
  } else {
    sfx.play("die", { volume: 0.8 });
    haptics.notify("error");
  }
  g.onPhase("over");
}

export function tick(g: Game, dt: number) {
  if (g.disposed) return;
  dt = Math.max(0, Math.min(dt, 0.05));
  g.time += dt;
  const playing = g.phase === "playing";

  if (playing) {
    // One cruising speed for the whole race: the launch and crash recoveries ease back up to it
    g.speed += (START_SPEED - g.speed) * (1 - Math.exp(-dt * 1.2));
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
  stepSteering(g, playing ? goal : g.d, dt, LATERAL_SPEED, STEER_RESPONSE, playing);
  g.scrape -= dt;
  if (Math.abs(g.d) > EDGE) {
    g.d = Math.sign(g.d) * EDGE;
    if (Math.sign(g.lateral) === Math.sign(g.d)) g.lateral = 0; // the rail stops it; steering away responds at once
    if (playing && Math.abs(goal) > EDGE + 0.2 && g.scrape <= 0) {
      g.scrape = 0.06;
      g.speed *= 0.985;
      const t = g.track.sample(g.s + 1.5, sample);
      placeAt(t, Math.sign(g.d) * (ROAD_HALF + 0.9), 0.6, at);
      sparks(g.world, {
        position: [at[0], at[1], at[2]],
        count: 6,
        speed: 6,
        size: 0.08,
        lifetime: 0.35,
        gravity: -9.81,
        colors: [
          [1, 0.85, 0.3],
          [1, 0.55, 0.1],
        ],
        flash: false,
      });
      haptics.impact(0.25, 1);
    }
  }

  g.s += g.speed * dt;
  // The distance left to the finish gate; crossing it wins
  if (g.phase === "playing") {
    const left = Math.max(0, Math.ceil(TRACK_LENGTH - g.s));
    if (left !== g.left) {
      g.left = left;
      g.onDistance(left);
    }
    if (g.s >= TRACK_LENGTH) end(g);
  }
  const size = g.assets.car.size;
  smoothSteeringPose(g.steeringPose, g.lateral, g.speed, dt);
  drive(g, g.player.root, g.s, g.d, size[1] / 2, dt, g.steeringPose.yaw, g.steeringPose.roll);

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
    const reach = CAR_FOOTPRINT.length;
    const gap = Math.abs(car.d - g.d);
    if (Math.abs(ds) < reach) car.closest = Math.min(car.closest, gap);
    // Touching is the bodies' outlines overlapping, not their lanes. How they met says what happens:
    // nose into tail (still apart lengthways a moment ago) is a crash; already alongside, a sideswipe.
    const depth = overlapAcross(CAR_FOOTPRINT, CAR_FOOTPRINT, ds, gap);
    if (g.phase === "playing" && depth > 0) {
      if (!car.touching && frontHit(CAR_FOOTPRINT, CAR_FOOTPRINT, car.wasAhead, ds))
        car.headOn = true;
      car.touching = true;
      if (!car.headOn) {
        sideswipe(g, car, depth);
      } else if (g.invulnerable <= 0) {
        crash(g, car);
        continue;
      }
    } else {
      car.touching = false;
      car.headOn = false;
    }
    car.wasAhead = ds;
    if (!car.passed && g.phase === "playing" && ds < -reach) {
      car.passed = true;
      g.onScore(g.world.scoreboard.add(POINTS_PER_CAR_PASSED));
      sfx.play("point", { volume: 0.5 });
      haptics.impact(0.25, 0.9);
      if (car.closest < 2.9 && !car.bumped) g.onNearMiss();
    }
    if (ds < -30) {
      g.world.despawn(car.root);
      g.traffic.splice(i, 1);
    }
  }

  burn(g.world, g.camera, g.burning, g.time, dt);
  g.world.update(dt);
  recycleRoad(g, g.segments, g.s);
  followCamera(g, dt);
}

/** Camera: orbiting the car on the start screen, then low behind it, looking down the road. */
function followCamera(g: Game, dt: number) {
  const drawn = g.world.worldPosition(g.player.root, tmp);
  if (!drawn) return;
  const t = g.track.sample(g.s, look);
  const fwd = forwardOf(t.heading);
  if (g.phase === "ready") {
    g.orbit += dt * 0.35;
    const angle = g.orbit + 0.9;
    updateChase(
      g.chase,
      g.camera,
      drawn,
      [Math.sin(angle) * 9, 3, Math.cos(angle) * 9],
      [0, 0.2, 0],
      dt,
    );
  } else {
    updateChase(
      g.chase,
      g.camera,
      drawn,
      [-fwd[0] * 9, 3.2 + Math.max(0, -t.pitch) * 2, -fwd[2] * 9],
      [fwd[0] * 12, 0.5 + Math.tan(t.pitch) * 12, fwd[2] * 12],
      dt,
    );
  }
  g.camera.fov = CAMERA_FOV;
  g.shake *= Math.exp(-dt * 6);
  g.world.set(g.horizon, { position: [drawn[0], 0, drawn[2]] });
}

// ── Traffic ───────────────────────────────────────────────────────────

export type Car = {
  root: Entity;
  lights: Entity[];
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
  /** How far ahead of the player it was last frame, and whether it's touching (and met nose to tail). */
  wasAhead: number;
  touching: boolean;
  headOn: boolean;
};

const spawnSample = newSample();
const spawnAt: [number, number, number] = [0, 0, 0];

/** Traffic ahead, in a lane that doesn't close the road: cars close together always leave a lane open. */
export function spawnTraffic(g: Game, ahead = SPAWN_AHEAD) {
  const s = g.s + ahead;
  if (s > TRACK_LENGTH - FINISH_CLEAR) return; // the run-in to the finish stays clear
  const window = 14 + g.speed * 0.35;
  const blocked = new Set<number>();
  for (const car of g.traffic)
    if (!car.crashed && Math.abs(car.s - s) < window) blocked.add(car.lane);
  const open = [0, 1, 2].filter((l) => !blocked.has(l));
  if (open.length <= 1) return;
  const d = LANES[pick(open)]!;
  const t = g.track.sample(s, spawnSample);
  placeAt(t, d, g.assets.car.size[1] / 2, spawnAt);
  const { root, lights } = spawnCar(
    g.world,
    g.assets,
    pick(PAINTS),
    [spawnAt[0], spawnAt[1], spawnAt[2]],
    g.night,
  );
  g.world.set(root, { rotation: orient(t.heading, t.pitch) });
  g.traffic.push({
    root,
    lights,
    s,
    d,
    lane: LANES.indexOf(d),
    vd: 0,
    passed: false,
    crashed: false,
    bumped: false,
    bumpCooldown: 0,
    closest: Infinity,
    wasAhead: ahead,
    touching: false,
    headOn: false,
  });
}

/** Demo bot: head for the lane whose next car is furthest away. */
export function autopilot(g: Game) {
  const nearest = [Infinity, Infinity, Infinity];
  for (const car of g.traffic) {
    if (car.crashed) continue;
    const ahead = car.s - g.s;
    const lane = car.lane;
    if (ahead > -4 && lane >= 0) nearest[lane] = Math.min(nearest[lane]!, ahead);
  }
  let current = 0;
  for (let l = 1; l < 3; l++)
    if (Math.abs(LANES[l]! - g.d) < Math.abs(LANES[current]! - g.d)) current = l;
  let lane = current;
  if (nearest[current]! < 40) {
    for (const l of [current - 1, current + 1]) {
      if (l >= 0 && l < 3 && nearest[l]! > nearest[lane]! + 6) lane = l;
    }
  }
  g.target = LANES[lane]!;
}
