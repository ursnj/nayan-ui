// Car Racing's rules, with no React: build a run with `createGame`, then `start` it and `tick` it every
// frame. Traffic, crashes, sideswipes, scoring, the autoplay bot and the camera. The screen listens
// through the `on…` hooks.
import { audio, haptics, World, type Camera, type Entity, type Vec3, type Voice } from "@nayan-ui/engine";
import {
  ACCELERATION,
  AUTOPLAY,
  CRASH_SLOWDOWN,
  EDGE,
  GAME_DURATION,
  INVULNERABLE,
  LANES,
  LATERAL_SPEED,
  LIVES,
  MAX_SPEED,
  PAINTS,
  PLAYER_PAINT,
  POINTS_PER_CAR_PASSED,
  ROAD_HALF,
  SPAWN_AHEAD,
  START_SPEED,
  STEER_RESPONSE,
  TRAFFIC_SPEED,
  sfx,
  type Assets,
} from "./config";
import {
  buildHorizon,
  buildRoad,
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
  Track,
  type Fire,
} from "./scene";

export type Phase = "ready" | "playing" | "over";

/** This session's best runs, for the subtitle and the leaderboard (the example has no backend). */
export const session = { best: 0, top: [] as number[] };

// Reused per frame, so the game loop doesn't allocate.
const tmp: [number, number, number] = [0, 0, 0];
const at: [number, number, number] = [0, 0, 0];
const sample = newSample();
const look = newSample();

export function createGame(a: Assets, night: boolean) {
  const world = new World(2600);
  const camera: Camera = { eye: [6, 3, 6], target: [0, 0.6, 0], fov: 1 };
  const segments = buildRoad(world, a);
  const horizon = buildHorizon(world, night);
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
    /** Wrecks on fire. */
    burning: [] as Fire[],
    phase: "ready" as Phase,
    time: 0,
    s: 0,
    d: 0,
    target: 0, // where the finger wants the car across the road
    dragX: 0, // the finger's last dx, so each move steers by its own distance
    speed: 0,
    baseSpeed: START_SPEED,
    lateral: 0,
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
    // UI hooks, set by the screen.
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
export type Game = ReturnType<typeof createGame>;

export function start(g: Game) {
  g.phase = "playing";
  g.speed = START_SPEED * 0.6;
  // Fill the road ahead, so the first cars arrive within seconds.
  for (let ahead = 50; ahead < SPAWN_AHEAD; ahead += rand(18, 26)) spawnTraffic(g, ahead);
  g.engine = sfx.play("engine", { volume: 0.32, loop: true });
  // Sounds load alongside the scene; if they're still decoding, the engine starts once they're in.
  if (!g.engine) {
    sfx.ready.then(() => {
      if (g.phase === "playing" && !g.engine) g.engine = sfx.play("engine", { volume: 0.32, loop: true });
    });
  }
  g.onPhase("playing");
  sfx.play("nitro", { volume: 0.6 });
  haptics.impact(0.6, 0.4);
}

/** Steers toward the finger: `dx` is the drag's distance so far, `metresPerPoint` how far that moves the car. */
export function steer(g: Game, phase: "start" | "move" | "end", dx: number, metresPerPoint: number) {
  if (phase === "start") g.dragX = 0;
  if (phase === "end") return;
  g.target = clamp(g.target + (dx - g.dragX) * metresPerPoint, -EDGE - 0.6, EDGE + 0.6);
  g.dragX = dx;
}

/** Stops the run's sounds and frees its world (the screen unmounting). */
export function dispose(g: Game) {
  audio.stop(g.engine);
  g.world.dispose();
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
  const side = Math.sign(car.d - g.d) || (Math.random() < 0.5 ? -1 : 1);
  const size = g.assets.car.size;
  g.world.set(car.root, {
    physics: { type: "dynamic", size: [size[0] * 0.95, size[1], size[2] * 0.95], layer: 8, mask: 4 | 8, bounce: 0.25, friction: 0.6, density: 0.4 },
    spin: [rand(-2, 2), rand(-5, 5), -side * rand(2, 5)],
    impact: { sound: sfx.get("bump"), minSpeed: 2, maxSpeed: 14, volume: 0.8, haptic: 0.3 },
    lifetime: 3.6,
  });
  // Thrown on ahead at about the player's new speed, so it tumbles and slides along in view, burning,
  // before friction lets the player pass it.
  g.speed = Math.max(START_SPEED * 0.6, g.speed * CRASH_SLOWDOWN);
  const ahead = g.speed * 1.1;
  // The way the road runs here (toward larger s), measured from the track itself.
  const a = g.track.sample(car.s, sample);
  const ax = a.x;
  const az = a.z;
  const b = g.track.sample(car.s + 1, sample);
  const len = Math.hypot(b.x - ax, b.z - az) || 1;
  const along: Vec3 = [(b.x - ax) / len, 0, (b.z - az) / len];
  g.world.set(car.root, { velocity: [along[0] * ahead + right[0] * side * 3, 4, along[2] * ahead + right[2] * side * 3] });
  const p = g.world.position(car.root);
  if (p) explode(g.world, p);
  g.burning.push(burning(car.root, g.time + 3.2));

  g.shake = 0.5;
  g.lives -= 1;
  g.onLives(g.lives);
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

function end(g: Game) {
  g.phase = "over";
  audio.stop(g.engine);
  g.engine = null;
  session.best = Math.max(session.best, g.score);
  if (g.score > 0) {
    session.top.push(g.score);
    session.top.sort((x, y) => y - x);
    session.top.length = Math.min(session.top.length, 5);
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

export function tick(g: Game, dt: number) {
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
    g.speed += (g.baseSpeed - g.speed) * (1 - Math.exp(-dt * 1.2));
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
    const fov = 0.95 + (g.speed / MAX_SPEED) * 0.28;
    cam.fov += (fov - cam.fov) * (1 - Math.exp(-dt * 4));
    g.world.set(g.horizon, { position: [drawn[0], 0, drawn[2]] });
  }
  g.shake *= Math.exp(-dt * 6);
}

// ── Traffic ───────────────────────────────────────────────────────────

export type Car = {
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

const spawnSample = newSample();
const spawnAt: [number, number, number] = [0, 0, 0];

/** Traffic ahead, in a lane that doesn't close the road: cars close together always leave a lane open. */
export function spawnTraffic(g: Game, ahead = SPAWN_AHEAD) {
  const s = g.s + ahead;
  const window = 14 + g.speed * 0.35;
  const blocked = new Set<number>();
  for (const car of g.traffic) if (!car.crashed && Math.abs(car.s - s) < window) blocked.add(car.lane);
  const open = [0, 1, 2].filter((l) => !blocked.has(l));
  if (open.length <= 1) return;
  const d = LANES[pick(open)]!;
  const t = g.track.sample(s, spawnSample);
  placeAt(t, d, g.assets.car.size[1] / 2, spawnAt);
  const { root } = spawnCar(g.world, g.assets, pick(PAINTS), [spawnAt[0], spawnAt[1], spawnAt[2]], g.night);
  g.world.set(root, { rotation: orient(t.heading, t.pitch) });
  g.traffic.push({ root, s, d, lane: LANES.indexOf(d), vd: 0, passed: false, crashed: false, bumped: false, bumpCooldown: 0, closest: Infinity });
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
  for (let l = 1; l < 3; l++) if (Math.abs(LANES[l]! - g.d) < Math.abs(LANES[current]! - g.d)) current = l;
  let lane = current;
  if (nearest[current]! < 40) {
    for (const l of [current - 1, current + 1]) {
      if (l >= 0 && l < 3 && nearest[l]! > nearest[lane]! + 6) lane = l;
    }
  }
  g.target = LANES[lane]!;
}
