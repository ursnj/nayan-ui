import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  createJoystickState,
  GameView,
  impactStrength,
  Joystick,
  Mesh,
  World,
  type Camera,
  type Color,
  type Entity,
  type GameAudio,
  type GameHaptics,
  type GameStats,
  type JoystickState,
  type Light,
  type Vec3,
} from "@nayan-ui/engine";
import { createExpoAudio, createExpoHaptics } from "@nayan-ui/engine/expo";

// Collision layers. A pair collides if either side's mask includes the other's layer.
const WORLD = 1; // floor, walls, crates
const PLAYER = 2;
const ORB = 4;
const ENEMY = 8;
const SPARK = 16;

const ARENA = 18; // half-size of the square arena
const PLAYER_SPEED = 8;
const DASH_SPEED = 22;
const DASH_TIME = 0.25;
const DASH_COOLDOWN = 1.2;
const MAX_ORBS = 6;
const MAX_ENEMIES = 24;
const CRATES = 10;

const GOLD: Color = [1, 0.8, 0.2];
const RED: Color = [0.95, 0.25, 0.25];
const BLUE: Color = [0.25, 0.55, 1];

// Demo / QA mode: a bot plays and restarts automatically. Run Metro with EXPO_PUBLIC_AUTOPLAY=1.
const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";

const SOUNDS = {
  pickup: require("./assets/sfx/pickup.wav"),
  dash: require("./assets/sfx/dash.wav"),
  bump: require("./assets/sfx/bump.wav"),
  gameover: require("./assets/sfx/gameover.wav"),
  music: require("./assets/sfx/music.wav"),
};
type Sound = keyof typeof SOUNDS;

let best = 0; // best score this session

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Everything a round needs. Mutable on purpose: it is touched every frame, outside React. */
function createGame(audio: GameAudio<Sound>, haptics: GameHaptics) {
  const world = new World(400);

  // Floor and walls (fixed bodies).
  world.spawn({
    mesh: Mesh.Plane,
    scale: [ARENA * 2 + 12, 1, ARENA * 2 + 12],
    color: [0.11, 0.17, 0.21],
    body: "fixed",
    collider: { layer: WORLD, mask: 0, friction: 0.9 },
  });
  const wall: Color = [0.27, 0.32, 0.4];
  const len = ARENA * 2 + 2;
  const walls: [Vec3, Vec3][] = [
    [[0, 0.75, -ARENA - 1], [len, 1.5, 1]],
    [[0, 0.75, ARENA + 1], [len, 1.5, 1]],
    [[-ARENA - 1, 0.75, 0], [1, 1.5, len]],
    [[ARENA + 1, 0.75, 0], [1, 1.5, len]],
  ];
  for (const [position, scale] of walls) {
    world.spawn({ position, scale, color: wall, body: "fixed", collider: { layer: WORLD, mask: 0, restitution: 0.3 } });
  }

  // Pushable crates (dynamic, collide with everything solid).
  const crates = new Set<Entity>();
  for (let i = 0; i < CRATES; i++) {
    const a = (i / CRATES) * Math.PI * 2 + rand(-0.2, 0.2);
    const r = rand(6, ARENA - 3);
    crates.add(
      world.spawn({
        position: [Math.cos(a) * r, 0.7, Math.sin(a) * r],
        rotation: [0, Math.sin(a / 2), 0, Math.cos(a / 2)],
        scale: 1.3,
        color: [0.62, 0.45, 0.28],
        body: { type: "dynamic", angularDamping: 0.5 },
        collider: { layer: WORLD, mask: WORLD, friction: 0.7, density: 0.5 },
      }),
    );
  }

  const player = world.spawn({
    mesh: Mesh.Sphere,
    position: [0, 0.7, 0],
    scale: 1.2,
    color: BLUE,
    body: { type: "dynamic", angularDamping: 0.3 },
    collider: { layer: PLAYER, mask: WORLD | ORB | ENEMY, friction: 0.9, restitution: 0.1, density: 2 },
  });

  const camera: Camera = { eye: [0, 22, 15], target: [0, 0, 0], fov: Math.PI / 3 };
  const game = {
    world,
    audio,
    haptics,
    player,
    camera,
    crates,
    orbs: new Set<Entity>(),
    enemies: new Set<Entity>(),
    elapsed: 0,
    spawnTimer: 2,
    score: 0,
    over: false,
    overAt: 0,
    dashTime: 0,
    dashCooldown: 0,
    dashDir: [0, -1] as [number, number],
    onScore: (_score: number) => {},
    onOver: () => {},
    onDash: (_ready: boolean) => {},
  };
  for (let i = 0; i < MAX_ORBS; i++) spawnOrb(game);
  return game;
}
type Game = ReturnType<typeof createGame>;

function playerPosition(g: Game): [number, number, number] {
  return g.world.position(g.player) ?? [0, 0, 0];
}

function spawnOrb(g: Game) {
  const p = playerPosition(g);
  let x = 0;
  let z = 0;
  for (let tries = 0; tries < 12; tries++) {
    x = rand(-ARENA + 2, ARENA - 2);
    z = rand(-ARENA + 2, ARENA - 2);
    if (Math.hypot(x - p[0], z - p[2]) > 5) break; // not on top of the player
  }
  g.orbs.add(
    g.world.spawn({
      mesh: Mesh.Sphere,
      position: [x, 0.9, z],
      scale: 0.7,
      color: GOLD,
      oscillation: { amplitude: [0, 0.25, 0], frequency: 3, phase: rand(0, 6) },
      body: "kinematic",
      collider: { radius: 0.5, layer: ORB, mask: 0, sensor: true },
    }),
  );
}

function spawnEnemy(g: Game) {
  const p = playerPosition(g);
  let x = 0;
  let z = 0;
  for (let tries = 0; tries < 8; tries++) {
    const t = rand(-ARENA + 1, ARENA - 1);
    const edge = Math.floor(Math.random() * 4);
    const e = ARENA - 1.5;
    [x, z] = edge === 0 ? [t, -e] : edge === 1 ? [t, e] : edge === 2 ? [-e, t] : [e, t];
    if (Math.hypot(x - p[0], z - p[2]) > 12) break; // never pop in next to the player
  }
  g.enemies.add(
    g.world.spawn({
      position: [x, 3, z], // drops in
      scale: 1.1,
      color: RED,
      body: { type: "dynamic", lockRotations: true },
      collider: { layer: ENEMY, mask: WORLD | ENEMY | PLAYER, friction: 0.2, density: 1 },
      follow: { target: g.player, speed: Math.min(2.4 + g.elapsed * 0.05, 6) },
    }),
  );
}

/** A burst of small bouncing cubes that shrink away. */
function sparks(g: Game, at: Vec3, color: Color, count = 12) {
  for (let i = 0; i < count; i++) {
    if (g.world.count >= g.world.capacity - 8) return;
    const a = rand(0, Math.PI * 2);
    const s = rand(2, 5);
    g.world.spawn({
      position: [at[0], at[1] + 0.3, at[2]],
      scale: rand(0.14, 0.24),
      color,
      velocity: [Math.cos(a) * s, rand(4, 8), Math.sin(a) * s],
      angularVelocity: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
      body: "dynamic",
      collider: { layer: SPARK, mask: WORLD, restitution: 0.5, density: 0.3 },
      lifetime: rand(0.6, 1.0),
    });
  }
}

function dash(g: Game, stick: JoystickState) {
  if (g.over || g.dashCooldown > 0) return;
  const len = Math.hypot(stick.x, stick.y);
  if (len > 0.2) g.dashDir = [stick.x / len, -stick.y / len];
  g.dashTime = DASH_TIME;
  g.dashCooldown = DASH_COOLDOWN;
  g.audio.play("dash", { volume: 0.8 });
  g.haptics.impact("medium");
  g.onDash(false);
}

function gameOver(g: Game) {
  const p = playerPosition(g);
  g.over = true;
  g.overAt = g.elapsed;
  best = Math.max(best, g.score);
  sparks(g, p, BLUE, 24);
  g.world.despawn(g.player);
  g.audio.play("gameover");
  g.haptics.notify("error");
  g.onOver();
}

/** One frame of game logic. */
function tick(g: Game, stick: JoystickState, dt: number) {
  g.elapsed += dt;

  if (!g.over) {
    if (AUTOPLAY) autopilot(g, stick);

    // Movement: dashing overrides the stick.
    if (g.dashTime > 0) {
      g.dashTime -= dt;
      g.world.setPlanarVelocity(g.player, g.dashDir[0] * DASH_SPEED, g.dashDir[1] * DASH_SPEED);
    } else {
      g.world.setPlanarVelocity(g.player, stick.x * PLAYER_SPEED, -stick.y * PLAYER_SPEED);
      const len = Math.hypot(stick.x, stick.y);
      if (len > 0.2) g.dashDir = [stick.x / len, -stick.y / len];
    }
    if (g.dashCooldown > 0) {
      g.dashCooldown -= dt;
      if (g.dashCooldown <= 0) g.onDash(true);
    }

    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0 && g.enemies.size < MAX_ENEMIES) {
      g.spawnTimer = Math.max(0.9, 3.2 - g.elapsed * 0.04); // ramps up
      spawnEnemy(g);
    }
  } else if (AUTOPLAY && g.elapsed - g.overAt > 2) {
    g.onOver(); // overlay already up; the Round restarts itself in autoplay
  }

  g.world.update(dt);

  g.world.forEachCollision((a, b, info) => {
    if (!info.started) return;
    if (a === g.player || b === g.player) {
      if (g.over) return;
      const other = a === g.player ? b : a;
      if (g.orbs.delete(other)) {
        const p = g.world.position(other) ?? playerPosition(g);
        g.world.despawn(other);
        sparks(g, p, GOLD, 10);
        g.score += 10;
        g.onScore(g.score);
        g.audio.play("pickup", { volume: 0.9 });
        g.haptics.impact("light");
        spawnOrb(g);
      } else if (g.enemies.has(other)) {
        if (g.dashTime > 0) {
          const p = g.world.position(other) ?? playerPosition(g);
          g.enemies.delete(other);
          g.world.despawn(other);
          sparks(g, p, RED, 16);
          g.score += 25;
          g.onScore(g.score);
          g.audio.play("bump", { volume: 1, rate: 0.8 });
          g.haptics.impact("heavy");
        } else {
          gameOver(g);
        }
      } else {
        const strength = impactStrength(info.speed, 1.5, 10);
        if (strength > 0) {
          g.audio.play("bump", { volume: strength });
          g.haptics.impact(strength > 0.6 ? "medium" : "light");
        }
      }
    } else if ((g.crates.has(a) || g.crates.has(b)) && info.speed > 3) {
      g.audio.play("bump", { volume: impactStrength(info.speed, 3, 12) * 0.5 }); // crates knocking about
    }
  });

  // Camera: smooth follow from behind and above.
  const p = g.world.position(g.player);
  if (p) {
    const k = 1 - Math.exp(-dt * 5);
    const { eye, target } = g.camera;
    eye[0] += (p[0] - eye[0]) * k;
    eye[2] += (p[2] + 15 - eye[2]) * k;
    target[0] += (p[0] - target[0]) * k;
    target[2] += (p[2] - target[2]) * k;
  }
}

/** Demo bot: seek the nearest orb, steer away from close chasers, dash when cornered. */
function autopilot(g: Game, stick: JoystickState) {
  const p = g.world.position(g.player);
  if (!p) return;
  let nearest = Infinity;
  let gx = 0;
  let gz = 0;
  for (const orb of g.orbs) {
    const o = g.world.position(orb);
    if (!o) continue;
    const d = Math.hypot(o[0] - p[0], o[2] - p[2]);
    if (d < nearest) {
      nearest = d;
      gx = (o[0] - p[0]) / (d || 1);
      gz = (o[2] - p[2]) / (d || 1);
    }
  }
  let fx = 0;
  let fz = 0;
  let closest = Infinity;
  for (const enemy of g.enemies) {
    const e = g.world.position(enemy);
    if (!e) continue;
    const d = Math.hypot(p[0] - e[0], p[2] - e[2]);
    closest = Math.min(closest, d);
    if (d < 7) {
      fx += (p[0] - e[0]) / (d * d || 1);
      fz += (p[2] - e[2]) / (d * d || 1);
    }
  }
  const x = gx + fx * 14;
  const z = gz + fz * 14;
  const len = Math.hypot(x, z) || 1;
  stick.x = x / len;
  stick.y = -z / len; // stick.y is up = -z in the world
  if (closest < 2.2) dash(g, stick);
}

function Round({
  audio,
  haptics,
  muted,
  onToggleMute,
  onRestart,
}: {
  audio: GameAudio<Sound>;
  haptics: GameHaptics;
  muted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
}) {
  const game = useMemo(() => createGame(audio, haptics), [audio, haptics]);
  const stick = useMemo(createJoystickState, []);
  const light = useMemo<Light>(() => ({ direction: [0.45, 0.85, 0.35], ambient: 0.32, shadowExtent: 26 }), []);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [dashReady, setDashReady] = useState(true);
  const [stats, setStats] = useState<GameStats>({ fps: 0, updateMs: 0 });
  const restarting = useRef(false);

  useEffect(() => {
    game.onScore = setScore;
    game.onDash = setDashReady;
    game.onOver = () => {
      setOver(true);
      if (AUTOPLAY && game.elapsed - game.overAt > 2 && !restarting.current) {
        restarting.current = true;
        onRestart();
      }
    };
    return () => game.world.dispose();
  }, [game, onRestart]);

  const onUpdate = useMemo(() => (dt: number) => tick(game, stick, dt), [game, stick]);

  return (
    <View style={styles.root}>
      <GameView source={game.world} camera={game.camera} light={light} onUpdate={onUpdate} onStats={setStats} />

      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.score}>{score}</Text>
        {score === 0 && !over && (
          <Text style={styles.hint}>
            Drag the pad to roll. Grab gold orbs. Dash through red cubes to smash them — touching them otherwise ends the run.
          </Text>
        )}
        <Text style={styles.fps}>
          {stats.fps.toFixed(0)} fps · update {stats.updateMs.toFixed(2)} ms · {game.world.count} entities
        </Text>
      </View>

      <Pressable onPress={onToggleMute} style={styles.mute} hitSlop={8}>
        <Text style={styles.muteText}>{muted ? "Sound off" : "Sound on"}</Text>
      </Pressable>

      <Joystick state={stick} style={styles.stick} />
      <Pressable
        onPressIn={() => dash(game, stick)}
        style={[styles.dash, !dashReady && styles.dashCooling]}
        disabled={over}
      >
        <Text style={styles.dashText}>DASH</Text>
      </Pressable>

      {over && (
        <View style={styles.gameOver}>
          <Text style={styles.title}>Game over</Text>
          <Text style={styles.final}>Score {score}</Text>
          <Text style={styles.best}>Best {best}</Text>
          <Pressable
            onPress={() => {
              haptics.selection();
              onRestart();
            }}
            style={styles.again}
          >
            <Text style={styles.againText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function OrbRush() {
  const [round, setRound] = useState(0);
  const [muted, setMuted] = useState(false);
  const audio = useMemo(() => createExpoAudio(SOUNDS), []);
  const haptics = useMemo(() => createExpoHaptics(), []);

  useEffect(() => {
    audio.playMusic("music", { volume: 0.35 });
    return () => audio.dispose();
  }, [audio]);
  useEffect(() => {
    audio.muted = muted;
  }, [audio, muted]);

  const restart = useMemo(() => () => setRound((r) => r + 1), []);
  return (
    <Round
      key={round}
      audio={audio}
      haptics={haptics}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      onRestart={restart}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0c17" },
  overlay: { position: "absolute", top: 70, left: 0, right: 0, alignItems: "center", gap: 6 },
  score: { color: "#fff", fontSize: 44, fontWeight: "800", fontVariant: ["tabular-nums"] },
  hint: { color: "#ffffffcc", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  fps: { color: "#ffffff80", fontSize: 11, fontVariant: ["tabular-nums"] },
  mute: {
    position: "absolute",
    top: 60,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff5",
    backgroundColor: "#0008",
  },
  muteText: { color: "#fff", fontSize: 12 },
  stick: { position: "absolute", left: 28, bottom: 56 },
  dash: {
    position: "absolute",
    right: 32,
    bottom: 76,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(239,68,68,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  dashCooling: { opacity: 0.35 },
  dashText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 1 },
  gameOver: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5,6,12,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: { color: "#fff", fontSize: 40, fontWeight: "800" },
  final: { color: "#fff", fontSize: 24 },
  best: { color: "#ffffffaa", fontSize: 16, marginBottom: 16 },
  again: { backgroundColor: "#3b82f6", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  againText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
