import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  audio,
  GameView,
  haptics,
  World,
  type Camera,
  type Color,
  type DragEvent,
  type Entity,
  type Light,
  type PhysicsOptions,
  type Shape,
  type Vec3,
} from "@nayan-ui/engine";

// Rules follow Playtura's Car Racing: a 2-minute timer, 3 lives, 500 points per car passed. The run
// ends when the timer runs out ("TIME UP!") or the last life is lost ("CRASHED!").
const GAME_DURATION = 120; // seconds
const LIVES = 3;
const POINTS_PER_CAR_PASSED = 500;
const LOW_TIME = 10; // the timer turns red from here

// World (units ~ metres, seconds). The road runs along -z; the player drives forward into it.
const LANE_W = 3.2;
const LANES = [-LANE_W, 0, LANE_W];
const ROAD_HALF = LANE_W * 1.5;
const START_SPEED = 22;
const MAX_SPEED = 46;
const ACCELERATION = 0.25; // units/s per second, so the last half minute is the fastest
const STEER = 9; // how quickly the car closes in on its lane
const CRASH_SLOWDOWN = 0.6;
const INVULNERABLE = 1.5; // seconds after a crash
// One traffic speed: cars keep the gaps they spawned with, so no lane overlaps and no wall forms later.
const TRAFFIC_SPEED = 10;
const SPAWN_AHEAD = 160; // hidden by fog
const DESPAWN_BEHIND = 20;
const SEGMENT = 20;
const SEGMENTS = 10;
const ROAD_TOP = 0.2; // the road segments' colliders are 0.4 thick, centred on y = 0
// Cars are 1.4 tall; their root (and collider) sits at their middle, so wrecks rest on the road.
const CAR_SIZE: Vec3 = [1.8, 1.4, 3.9];
const CAR_Y = ROAD_TOP + CAR_SIZE[1] / 2;
const LEAN = 0.25; // most the car turns into a lane change, in radians

// Collision layers. A pair collides if either side's mask includes the other's layer.
const PLAYER = 1;
const TRAFFIC = 2;
const ROAD = 4;
const DEBRIS = 8;

const SKY = [0.53, 0.78, 0.95] as const;
const ASPHALT: Color = [0.2, 0.2, 0.23];
const GRASS: Color = [0.24, 0.5, 0.16];
const LINE: Color = [0.95, 0.95, 0.9];
const GLASS: Color = [0.12, 0.16, 0.22];
const PLAYER_CAR: Color = [1, 0.27, 0.27];
const TRAFFIC_CARS: Color[] = [
  [0.27, 0.35, 1],
  [0.27, 0.85, 0.35],
  [1, 0.85, 0.27],
  [0.92, 0.92, 0.95],
];

// Demo / QA mode: a bot drives and restarts. Run Metro with EXPO_PUBLIC_AUTOPLAY=1.
const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";

// Decoded once by the Rust mixer, shared by every run.
const sfx = audio.load({
  point: require("../../assets/sfx/point.wav"),
  hit: require("../../assets/sfx/hit.wav"),
  die: require("../../assets/sfx/die.wav"),
  bump: require("../../assets/sfx/bump.wav"),
  flap: require("../../assets/sfx/flap.wav"),
});

type Phase = "ready" | "playing" | "over";
type Part = { entity: Entity; color: Color };
type Car = { root: Entity; parts: Part[]; lane: number; passed: boolean; crashed: boolean };

let best = 0;
// Reused for per-frame position reads, so the game loop doesn't allocate.
const tmp: [number, number, number] = [0, 0, 0];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;
const aboutY = (angle: number) => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)] as const;
const aboutZ = (angle: number) => [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)] as const;
const darker = (c: Color, k: number): Color => [c[0] * k, c[1] * k, c[2] * k];

/**
 * A car: an invisible root that carries the collider, with the body, cabin, wheels and lights
 * attached. It faces -z (headlights at the front, tail lights at the back).
 */
function spawnCar(world: World, color: Color, position: Vec3, physics: PhysicsOptions) {
  const root = world.spawn({ mesh: "none", position, physics: { size: CAR_SIZE, ...physics } });
  const parts: Part[] = [];
  // Parts are laid out from the wheels' bottom (y = 0) up, then shifted so the root is the middle.
  const part = (mesh: Shape, at: Vec3, scale: Vec3, c: Color, rotation?: readonly [number, number, number, number]) => {
    const local: Vec3 = [at[0], at[1] - CAR_SIZE[1] / 2, at[2]];
    parts.push({ entity: world.spawn({ mesh, parent: root, position: local, scale, color: c, rotation }), color: c });
  };
  part("roundedBox", [0, 0.55, 0], [1.9, 0.62, 4.1], color);
  part("roundedBox", [0, 1.08, 0.25], [1.6, 0.55, 2.1], GLASS);
  part("roundedBox", [0, 1.38, 0.25], [1.5, 0.08, 1.9], darker(color, 0.85)); // roof
  for (const x of [-0.92, 0.92]) {
    for (const z of [-1.35, 1.35]) part("cylinder", [x, 0.36, z], [0.72, 0.32, 0.72], [0.08, 0.08, 0.09], aboutZ(Math.PI / 2));
  }
  for (const x of [-0.6, 0.6]) {
    part("cube", [x, 0.62, -2.06], [0.42, 0.16, 0.06], [1, 0.98, 0.85]); // headlights
    part("cube", [x, 0.66, 2.06], [0.42, 0.14, 0.06], [0.9, 0.08, 0.08]); // tail lights
  }
  return { root, parts };
}

function createGame() {
  const world = new World(900);
  const camera: Camera = { eye: [0, 6.2, 8.5], target: [0, 0, -9], fov: 1 };

  // Road segments: an invisible root with the ground collider, and the asphalt, grass, lane markings
  // and trees attached. Segments that fall behind the player jump ahead, carrying it all along.
  const segments: Entity[] = [];
  for (let s = 0; s < SEGMENTS; s++) {
    const root = world.spawn({
      mesh: "none",
      position: [0, 0, -s * SEGMENT],
      physics: { type: "fixed", size: [80, 0.4, SEGMENT], layer: ROAD, mask: 0, friction: 0.7 },
    });
    const add = (mesh: Shape, position: Vec3, scale: Vec3, color: Color) =>
      world.spawn({ mesh, parent: root, position, scale, color, pickable: false });
    add("cube", [0, 0.15, 0], [ROAD_HALF * 2 + 0.6, 0.1, SEGMENT], ASPHALT);
    add("cube", [0, 0.12, 0], [80, 0.1, SEGMENT], s % 2 ? GRASS : darker(GRASS, 0.92));
    for (const x of [-ROAD_HALF, ROAD_HALF]) add("cube", [x, 0.21, 0], [0.18, 0.02, SEGMENT], LINE); // edges
    for (const x of [-LANE_W / 2, LANE_W / 2]) {
      for (const z of [-5, 5]) add("cube", [x, 0.21, z], [0.16, 0.02, 4], LINE); // lane dashes
    }
    for (let t = 0; t < 3; t++) {
      const side = t % 2 ? 1 : -1;
      const x = side * rand(ROAD_HALF + 3, 22);
      const z = rand(-SEGMENT / 2, SEGMENT / 2);
      const h = rand(2.4, 4);
      add("cylinder", [x, 0.2 + h * 0.2, z], [0.35, h * 0.4, 0.35], [0.4, 0.27, 0.15]);
      add("cone", [x, 0.2 + h * 0.4 + h * 0.4, z], [h * 0.55, h * 0.8, h * 0.55], [0.13 + rand(0, 0.06), 0.38 + rand(0, 0.1), 0.15]);
    }
    segments.push(root);
  }

  // Far mountains ride along with the player, so they never get closer.
  const horizon = world.spawn({ mesh: "none", position: [0, 0, 0] });
  for (let i = 0; i < 9; i++) {
    const s = rand(30, 55);
    world.spawn({
      mesh: "cone",
      parent: horizon,
      position: [-160 + i * 40 + rand(-10, 10), s * 0.4, -230 - rand(0, 30)],
      scale: [s * 1.6, s, s * 1.6],
      color: [0.42 + rand(0, 0.06), 0.52 + rand(0, 0.06), 0.62],
      pickable: false,
    });
  }

  const player = spawnCar(world, PLAYER_CAR, [0, CAR_Y, 0], {
    type: "kinematic",
    layer: PLAYER,
    mask: TRAFFIC,
  });
  world.listener = player.root;

  return {
    world,
    camera,
    player,
    horizon,
    segments,
    traffic: [] as Car[],
    byRoot: new Map<Entity, Car>(),
    phase: "ready" as Phase,
    time: 0,
    speed: 8, // cruising behind the start screen
    lane: 1,
    spawnTimer: 0.5,
    invulnerable: 0,
    score: 0,
    lives: LIVES,
    timeLeft: GAME_DURATION,
    secondTimer: 0,
    shake: 0,
    // UI hooks, set by the component.
    onPhase: (_p: Phase) => {},
    onScore: (_s: number) => {},
    onLives: (_l: number) => {},
    onTime: (_t: number) => {},
    onSpeed: (_kmh: number) => {},
    onFlash: () => {},
  };
}
type Game = ReturnType<typeof createGame>;

function start(g: Game) {
  g.phase = "playing";
  g.speed = START_SPEED;
  // Fill the road ahead, so the first cars arrive within seconds rather than after the long drive in.
  const z = g.world.position(g.player.root, tmp)?.[2] ?? 0;
  for (let ahead = 45; ahead < SPAWN_AHEAD; ahead += rand(16, 24)) spawnTraffic(g, z, ahead);
  g.onPhase("playing");
  sfx.play("point", { volume: 0.6, pitch: 0.7 });
  haptics.impact(0.5, 0.4);
}

function steer(g: Game, lane: number) {
  const next = Math.max(0, Math.min(LANES.length - 1, lane));
  if (next === g.lane || g.phase !== "playing") return;
  g.lane = next;
  sfx.play("flap", { volume: 0.35, pitch: rand(1.3, 1.5) });
  haptics.selection();
}

/**
 * Traffic ahead, in a lane that doesn't close the road: cars close together leave a lane open. "Close"
 * grows with speed, so there's always time to switch lanes.
 */
function spawnTraffic(g: Game, playerZ: number, ahead = SPAWN_AHEAD) {
  const z = playerZ - ahead;
  const window = 12 + g.speed * 0.35;
  const blocked = new Set<number>();
  for (const car of g.traffic) {
    const p = g.world.position(car.root, tmp);
    if (p && !car.crashed && Math.abs(p[2] - z) < window) blocked.add(car.lane);
  }
  const open = [0, 1, 2].filter((l) => !blocked.has(l));
  if (open.length <= 1) return; // a third car here would wall off the road
  const lane = pick(open);
  const { root, parts } = spawnCar(g.world, pick(TRAFFIC_CARS), [LANES[lane]!, CAR_Y, z], {
    type: "kinematic",
    sensor: true,
    layer: TRAFFIC,
    mask: PLAYER,
  });
  g.world.set(root, { velocity: [0, 0, -TRAFFIC_SPEED] });
  const car: Car = { root, parts, lane, passed: false, crashed: false };
  g.traffic.push(car);
  g.byRoot.set(root, car);
}

function crash(g: Game, car: Car) {
  car.crashed = true;
  car.passed = true; // no points for a car you hit
  // The other car is knocked off the road: real physics from here, with the core thumping on impacts.
  const side = car.lane === 0 ? -1 : car.lane === 2 ? 1 : Math.sign(rand(-1, 1)) || 1;
  g.world.set(car.root, {
    physics: { type: "dynamic", size: CAR_SIZE, layer: DEBRIS, mask: ROAD | DEBRIS, bounce: 0.25, friction: 0.6, density: 0.4 },
    spin: [rand(-2, 2), rand(-6, 6), side * rand(2, 5)],
    impact: { sound: sfx.get("bump"), minSpeed: 2, maxSpeed: 14, volume: 0.8, haptic: 0.3 },
    lifetime: 2.5,
  });
  g.world.impulse(car.root, [side * 9, 7, -g.speed * 0.4]);
  const p = g.world.position(car.root);
  if (p) g.world.burst({ position: [p[0], 1, p[2]], count: 24, speed: 7, size: 0.22, color: [[1, 0.6, 0.15], [1, 0.9, 0.3], darker(PLAYER_CAR, 0.6)] });

  g.speed = Math.max(START_SPEED * 0.7, g.speed * CRASH_SLOWDOWN);
  g.shake = 0.45;
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
  for (const part of g.player.parts) {
    const [r, gr, b] = part.color;
    g.world.animate(part.entity, [{ color: [r, gr, b, 0.25] }, { color: [r, gr, b, 1] }], { duration: 0.25, repeat: 5 });
  }
}

function end(g: Game) {
  g.phase = "over";
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
  const p = g.world.position(g.player.root, tmp);
  if (!p) return;
  const [px, , pz] = p;

  if (playing) {
    // Playtura counts the timer down in whole seconds.
    g.secondTimer += dt;
    while (g.secondTimer >= 1 && g.phase === "playing") {
      g.secondTimer -= 1;
      g.timeLeft -= 1;
      g.onTime(g.timeLeft);
      if (g.timeLeft <= 0) end(g);
    }
    g.speed = Math.min(MAX_SPEED, g.speed + ACCELERATION * dt);
    g.invulnerable = Math.max(0, g.invulnerable - dt);
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      // Denser traffic as the car gets faster.
      g.spawnTimer = Math.max(0.42, 1.05 - (g.speed - START_SPEED) * 0.025) * rand(0.8, 1.2);
      spawnTraffic(g, pz);
    }
    if (AUTOPLAY) autopilot(g, pz);
  } else if (g.phase === "over") {
    g.speed = Math.max(0, g.speed - 30 * dt); // roll to a stop
  }

  // Close in on the lane, leaning into the turn. Velocity (not position) keeps the motion smooth.
  const dx = LANES[g.lane]! - px;
  const vx = g.phase === "over" ? 0 : dx * STEER;
  const lean = Math.max(-LEAN, Math.min(LEAN, -vx * 0.02));
  g.world.set(g.player.root, { velocity: [vx, 0, -g.speed], rotation: aboutY(lean) });
  g.world.set(g.horizon, { velocity: [0, 0, -g.speed] });

  g.world.update(dt);

  // Road segments behind the player jump to the front.
  for (const segment of g.segments) {
    const s = g.world.position(segment, tmp);
    if (s && s[2] - SEGMENT / 2 > pz + DESPAWN_BEHIND) g.world.set(segment, { position: [0, 0, s[2] - SEGMENTS * SEGMENT] });
  }

  // Score each car once it's behind the player; drop the ones far behind.
  for (let i = g.traffic.length - 1; i >= 0; i--) {
    const car = g.traffic[i]!;
    const c = g.world.position(car.root, tmp);
    if (!c) {
      g.byRoot.delete(car.root);
      g.traffic.splice(i, 1); // a crashed car whose lifetime ended
      continue;
    }
    if (!car.passed && playing && c[2] > pz + 2.2) {
      car.passed = true;
      g.score += POINTS_PER_CAR_PASSED;
      g.onScore(g.score);
      sfx.play("point", { volume: 0.55 });
      haptics.impact(0.25, 0.9);
    }
    if (c[2] > pz + DESPAWN_BEHIND && !car.crashed) {
      g.world.despawn(car.root);
      g.byRoot.delete(car.root);
      g.traffic.splice(i, 1);
    }
  }

  g.world.forEachCollision((a, b, info) => {
    if (!info.started || g.phase !== "playing" || g.invulnerable > 0) return;
    const other = a === g.player.root ? b : b === g.player.root ? a : null;
    const car = other === null ? undefined : g.byRoot.get(other);
    if (car && !car.crashed) crash(g, car);
  });

  // Chase camera: low behind the car, looking down the road; wider at speed, with a fading shake.
  const drawn = g.world.worldPosition(g.player.root, tmp);
  if (drawn) {
    const k = 1 - Math.exp(-dt * 6);
    const cam = g.camera;
    cam.eye[0] += (drawn[0] * 0.7 - cam.eye[0]) * k;
    cam.eye[1] = 6.2 + rand(-1, 1) * g.shake;
    cam.eye[2] = drawn[2] + 8.5;
    cam.target[0] += (drawn[0] * 0.45 - cam.target[0]) * k;
    cam.target[1] = 0;
    cam.target[2] = drawn[2] - 9;
    cam.eye[0] += rand(-1, 1) * g.shake;
    cam.fov = 0.95 + (g.speed / MAX_SPEED) * 0.3;
  }
  g.shake *= Math.exp(-dt * 6);
}

/** Demo bot: move to the lane whose next car is furthest away. */
function autopilot(g: Game, pz: number) {
  const nearest = [Infinity, Infinity, Infinity];
  for (const car of g.traffic) {
    if (car.crashed) continue;
    const c = g.world.position(car.root, tmp);
    if (!c) continue;
    const ahead = pz - c[2];
    if (ahead > -3) nearest[car.lane] = Math.min(nearest[car.lane]!, ahead);
  }
  if (nearest[g.lane]! > 30) return;
  let bestLane = g.lane;
  for (const lane of [g.lane - 1, g.lane + 1]) {
    if (lane >= 0 && lane < 3 && nearest[lane]! > nearest[bestLane]! + 4) bestLane = lane;
  }
  steer(g, bestLane);
}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

function Run({ onRestart }: { onRestart: () => void }) {
  const game = useMemo(createGame, []);
  const light = useMemo<Light>(() => ({ direction: [0.35, 0.85, 0.4], ambient: 0.45, shadowExtent: 24 }), []);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [kmh, setKmh] = useState(0);
  const flash = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

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
    // The speedometer only needs a few updates a second.
    const speedo = setInterval(() => setKmh(Math.round(game.speed * 3.6)), 250);
    return () => {
      clearInterval(speedo);
      game.world.dispose();
    };
  }, [game, flash, pop]);

  // Autoplay: start by itself and restart after a pause.
  useEffect(() => {
    if (!AUTOPLAY || phase === "playing") return;
    const t = setTimeout(phase === "ready" ? () => start(game) : onRestart, phase === "ready" ? 800 : 3000);
    return () => clearTimeout(t);
  }, [phase, game, onRestart]);

  const onUpdate = useMemo(() => (dt: number) => tick(game, dt), [game]);

  // Playtura's control: the car heads for the lane under the finger. screenToWorld finds where the
  // finger is on the road.
  const onDrag = useMemo(
    () =>
      ({ phase: touch, x, y }: DragEvent) => {
        if (touch === "end") return;
        const at = game.world.screenToWorld(x, y);
        if (at) steer(game, Math.round(at[0] / LANE_W) + 1);
      },
    [game],
  );

  return (
    <View style={styles.root}>
      <GameView source={game.world} camera={game.camera} light={light} background={SKY} fog={0.011} onUpdate={onUpdate} onDrag={onDrag} />

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

      {phase === "playing" && (
        <View style={styles.speedo} pointerEvents="none">
          <Text style={styles.speed}>{kmh}</Text>
          <Text style={styles.unit}>km/h</Text>
        </View>
      )}

      {phase === "ready" && (
        <View style={styles.center}>
          <Text style={styles.title}>Racing</Text>
          <Pressable style={styles.button} onPress={() => start(game)}>
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
          <Text style={styles.subtitle}>Dodge traffic to score!</Text>
        </View>
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
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    sfx.ready.then(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);
  const restart = useMemo(() => () => setRun((r) => r + 1), []);
  if (!loaded) return <View style={styles.root} />; // sounds decode in a few ms
  return <Run key={run} onRestart={restart} />;
}

const shadow = { textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgb(135,199,242)" },
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
  speedo: { position: "absolute", bottom: 48, right: 24, alignItems: "flex-end" },
  speed: { color: "#fff", fontSize: 44, fontWeight: "900", fontVariant: ["tabular-nums"], ...shadow },
  unit: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: -4, ...shadow },
  center: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", gap: 16 },
  title: { color: "#fff", fontSize: 56, fontWeight: "900", ...shadow },
  subtitle: { color: "#fff", fontSize: 18, fontWeight: "700", ...shadow },
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
