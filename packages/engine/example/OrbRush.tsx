import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  createJoystickState,
  GameView,
  Joystick,
  Mesh,
  World,
  type Camera,
  type Entity,
  type GameStats,
} from "@nayan-ui/engine";

// Collision layers.
const PLAYER = 1;
const ORB = 2;
const ENEMY = 4;

const ARENA = 20; // half-size of the square arena
const PLAYER_SPEED = 9;
const MAX_ORBS = 6;
const MAX_ENEMIES = 40;

let best = 0; // best score this session

// Demo / QA mode: a bot drives the joystick. Run Metro with EXPO_PUBLIC_AUTOPLAY=1.
const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Everything a round needs. Mutable on purpose: it is touched every frame, outside React. */
function createGame() {
  const world = new World(256);
  world.setBounds(-ARENA, -ARENA, ARENA, ARENA);

  // Floor and walls.
  world.spawn({ mesh: Mesh.Plane, scale: [ARENA * 2 + 10, 1, ARENA * 2 + 10], color: [0.1, 0.16, 0.2] });
  const wall = [0.25, 0.3, 0.38] as const;
  const len = ARENA * 2 + 2;
  world.spawn({ position: [0, 0.6, -ARENA - 1], scale: [len, 1.2, 1], color: wall });
  world.spawn({ position: [0, 0.6, ARENA + 1], scale: [len, 1.2, 1], color: wall });
  world.spawn({ position: [-ARENA - 1, 0.6, 0], scale: [1, 1.2, len], color: wall });
  world.spawn({ position: [ARENA + 1, 0.6, 0], scale: [1, 1.2, len], color: wall });

  const player = world.spawn({
    mesh: Mesh.Sphere,
    position: [0, 0.6, 0],
    scale: 1.2,
    color: [0.25, 0.55, 1],
    collider: { radius: 0.6, layer: PLAYER, mask: ORB | ENEMY },
  });

  const camera: Camera = { eye: [0, 24, 17], target: [0, 0, 0], fov: Math.PI / 3 };
  const game = {
    world,
    player,
    camera,
    orbs: new Set<Entity>(),
    enemies: new Set<Entity>(),
    elapsed: 0,
    spawnTimer: 1.5,
    score: 0,
    over: false,
  };
  for (let i = 0; i < MAX_ORBS; i++) spawnOrb(game);
  return game;
}
type Game = ReturnType<typeof createGame>;

function spawnOrb(g: Game) {
  const p = g.world.position(g.player) ?? [0, 0, 0];
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
      position: [x, 0.7, z],
      scale: 0.7,
      color: [1, 0.8, 0.2],
      oscillation: { amplitude: [0, 0.25, 0], frequency: 3, phase: rand(0, 6) },
      collider: { radius: 0.4, layer: ORB, mask: 0 },
    }),
  );
}

function spawnEnemy(g: Game) {
  const p = g.world.position(g.player) ?? [0, 0, 0];
  let x = 0;
  let z = 0;
  for (let tries = 0; tries < 8; tries++) {
    const t = rand(-ARENA, ARENA);
    const edge = Math.floor(Math.random() * 4);
    [x, z] = edge === 0 ? [t, -ARENA] : edge === 1 ? [t, ARENA] : edge === 2 ? [-ARENA, t] : [ARENA, t];
    if (Math.hypot(x - p[0], z - p[2]) > 12) break; // never pop in next to the player
  }
  g.enemies.add(
    g.world.spawn({
      position: [x, 0.55, z],
      scale: 1.1,
      color: [0.95, 0.25, 0.25],
      angularVelocity: [0, 2, 0],
      follow: { target: g.player, speed: Math.min(2.2 + g.elapsed * 0.06, 6) },
      collider: { radius: 0.55, layer: ENEMY, mask: 0 },
    }),
  );
}

/** Steers toward the nearest orb and away from close chasers by writing into the joystick state. */
function autopilot(g: Game, stick: { x: number; y: number }) {
  const p = g.world.position(g.player);
  if (!p) return;
  let best = Infinity;
  let gx = 0;
  let gz = 0;
  for (const orb of g.orbs) {
    const o = g.world.position(orb);
    if (!o) continue;
    const d = Math.hypot(o[0] - p[0], o[2] - p[2]);
    if (d < best) {
      best = d;
      gx = (o[0] - p[0]) / (d || 1);
      gz = (o[2] - p[2]) / (d || 1);
    }
  }
  let fx = 0;
  let fz = 0;
  for (const enemy of g.enemies) {
    const e = g.world.position(enemy);
    if (!e) continue;
    const d = Math.hypot(p[0] - e[0], p[2] - e[2]);
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
}

function Round({ onRestart }: { onRestart: () => void }) {
  const game = useMemo(createGame, []);
  const stick = useMemo(createJoystickState, []);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [stats, setStats] = useState<GameStats>({ fps: 0, updateMs: 0 });
  useEffect(() => () => game.world.dispose(), [game]);

  const onUpdate = useMemo(
    () => (dt: number) => {
      const g = game;
      if (g.over) return;
      g.elapsed += dt;

      if (AUTOPLAY) autopilot(g, stick);
      g.world.setVelocity(g.player, [stick.x * PLAYER_SPEED, 0, -stick.y * PLAYER_SPEED]);

      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0 && g.enemies.size < MAX_ENEMIES) {
        g.spawnTimer = Math.max(1, 3.5 - g.elapsed * 0.04); // ramps up
        spawnEnemy(g);
      }

      g.world.update(dt);

      g.world.forEachCollision((a, b) => {
        if (g.over) return;
        const other = a === g.player ? b : b === g.player ? a : null;
        if (other === null) return;
        if (g.orbs.delete(other)) {
          g.world.despawn(other);
          g.score += 10;
          setScore(g.score);
          spawnOrb(g);
        } else if (g.enemies.has(other)) {
          g.over = true;
          best = Math.max(best, g.score);
          setOver(true);
        }
      });

      // Camera: smooth follow from behind and above.
      const p = g.world.position(g.player);
      if (p) {
        const k = 1 - Math.exp(-dt * 6);
        const { eye, target } = g.camera;
        eye[0] += (p[0] - eye[0]) * k;
        eye[1] = 24;
        eye[2] += (p[2] + 17 - eye[2]) * k;
        target[0] += (p[0] - target[0]) * k;
        target[2] += (p[2] - target[2]) * k;
      }
    },
    [game, stick],
  );

  return (
    <View style={styles.root}>
      <GameView source={game.world} camera={game.camera} onUpdate={onUpdate} onStats={setStats} />

      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.score}>{score}</Text>
        {score === 0 && !over && (
          <Text style={styles.hint}>Drag the pad to move. Collect gold orbs. Avoid the red cubes.</Text>
        )}
        <Text style={styles.fps}>
          {stats.fps.toFixed(0)} fps · update {stats.updateMs.toFixed(2)} ms · {game.world.count} entities
        </Text>
      </View>

      <Joystick state={stick} style={styles.stick} />

      {over && (
        <View style={styles.gameOver}>
          <Text style={styles.title}>Game over</Text>
          <Text style={styles.final}>Score {score}</Text>
          <Text style={styles.best}>Best {best}</Text>
          <Pressable onPress={onRestart} style={styles.again}>
            <Text style={styles.againText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function OrbRush() {
  const [round, setRound] = useState(0);
  return <Round key={round} onRestart={() => setRound((r) => r + 1)} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0c17" },
  overlay: { position: "absolute", top: 70, left: 0, right: 0, alignItems: "center", gap: 6 },
  score: { color: "#fff", fontSize: 44, fontWeight: "800", fontVariant: ["tabular-nums"] },
  hint: { color: "#ffffffcc", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  fps: { color: "#ffffff80", fontSize: 11, fontVariant: ["tabular-nums"] },
  stick: { position: "absolute", left: 28, bottom: 56 },
  gameOver: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5,6,12,0.7)",
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
