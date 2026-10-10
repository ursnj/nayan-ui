import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  GameView,
  impactStrength,
  Mesh,
  World,
  type Camera,
  type Color,
  type Entity,
  type GameAudio,
  type GameHaptics,
  type Light,
  type Vec3,
} from "@nayan-ui/engine";
import { createExpoAudio, createExpoHaptics } from "@nayan-ui/engine/expo";

// Collision layers. A pair collides if either side's mask includes the other's layer.
const BIRD = 1;
const SOLID = 2; // pipes, ground, ceiling
const FX = 4; // feathers and dust: land on solids, ignore the bird

// World (units ~ metres, seconds). Side view: x scrolls, y is up, the camera looks down -z.
const GRAVITY = -26;
const FLAP_SPEED = 8.2;
const SCROLL = 4.2;
const GAP = 4.0;
const PIPE_W = 1.8;
const PIPE_EVERY = 1.55; // seconds
const GROUND_Y = -5.5; // top surface of the ground
const CEILING_Y = 11;
const BIRD_X = -1.8;
const SPAWN_X = 9;
const DESPAWN_X = -10;

const SKY = [0.47, 0.73, 0.93] as const;
const PIPE: Color = [0.36, 0.76, 0.26];
const PIPE_CAP: Color = [0.27, 0.62, 0.19];
const YELLOW: Color = [1, 0.82, 0.2];
const FEATHER: Color = [1, 0.95, 0.75];
const SAND: Color = [0.86, 0.77, 0.5];

// Demo / QA mode: a bot flaps and restarts. Run Metro with EXPO_PUBLIC_AUTOPLAY=1.
const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";

const SOUNDS = {
  flap: require("./assets/sfx/flap.wav"),
  point: require("./assets/sfx/point.wav"),
  hit: require("./assets/sfx/hit.wav"),
  die: require("./assets/sfx/die.wav"),
  bump: require("./assets/sfx/bump.wav"),
};
type Sound = keyof typeof SOUNDS;
type Phase = "ready" | "playing" | "dead" | "over";

let best = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const aboutZ = (angle: number) => [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)] as const;
const aboutX = (angle: number) => [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)] as const;

type Pipe = { parts: Entity[]; probe: Entity; gapY: number; scored: boolean };
type Scroller = { entity: Entity; wrap: number };

function createGame(audio: GameAudio<Sound>, haptics: GameHaptics) {
  const world = new World(320);
  world.setGravity([0, GRAVITY, 0]);
  const solid = { body: "fixed" as const, collider: { layer: SOLID, mask: 0 } };

  // Ground (solid) with scrolling grass tiles on top, and an invisible-ish ceiling above the view.
  const ground = world.spawn({
    position: [0, GROUND_Y - 2, 0],
    scale: [80, 4, 16],
    color: SAND,
    body: "fixed",
    collider: { layer: SOLID, mask: 0, friction: 0.8, restitution: 0.25 },
  });
  const ceiling = world.spawn({ position: [0, CEILING_Y + 0.5, 0], scale: [80, 1, 4], color: SKY, ...solid });

  const scrollers: Scroller[] = [];
  const scroll = (entity: Entity, speed: number, wrap: number) => {
    world.setVelocity(entity, [-speed, 0, 0]);
    scrollers.push({ entity, wrap });
  };
  for (let i = 0; i < 14; i++) {
    const tile = world.spawn({
      position: [-21 + i * 3, GROUND_Y + 0.12, 0],
      scale: [3, 0.25, 16],
      color: i % 2 ? [0.42, 0.74, 0.27] : [0.36, 0.67, 0.23],
    });
    scroll(tile, SCROLL, 42);
  }

  // Parallax scenery: far hills (slow) and mid-distance clouds built from attached puffs.
  for (let i = 0; i < 7; i++) {
    const s = rand(10, 16);
    const hill = world.spawn({
      mesh: Mesh.Sphere,
      position: [-30 + i * 10 + rand(-2, 2), GROUND_Y - s * 0.2, -30 - rand(0, 6)],
      scale: s,
      color: [0.3 + rand(0, 0.08), 0.58 + rand(0, 0.1), 0.3],
    });
    scroll(hill, SCROLL * 0.18, 70);
  }
  for (let i = 0; i < 6; i++) {
    const cloud = world.spawn({
      mesh: Mesh.Sphere,
      position: [-24 + i * 9 + rand(-2, 2), rand(4, 9), -14 - rand(0, 4)],
      scale: rand(2.2, 3),
      color: [1, 1, 1],
    });
    for (let k = 0; k < 3; k++) {
      world.spawn({
        mesh: Mesh.Sphere,
        parent: cloud,
        position: [rand(-1.4, 1.4), rand(-0.4, 0.2), rand(-0.5, 0.5)],
        scale: rand(1.5, 2.1), // child scale is absolute (not multiplied by the parent's)
        color: [0.97, 0.98, 1],
      });
    }
    scroll(cloud, SCROLL * 0.4, 54);
  }

  // The bird: a ball body plus attached eye, pupil, beak, wing and tail.
  const bird = world.spawn({
    mesh: Mesh.Sphere,
    position: [BIRD_X, 1, 0],
    scale: 1,
    color: YELLOW,
    oscillation: { amplitude: [0, 0.35, 0], frequency: 4 },
    body: "kinematic",
    collider: { radius: 0.42, layer: BIRD, mask: SOLID },
  });
  const part = (mesh: (typeof Mesh)[keyof typeof Mesh], position: Vec3, scale: Vec3 | number, color: Color) =>
    world.spawn({ mesh, parent: bird, position, scale, color });
  part(Mesh.Sphere, [0.22, 0.17, 0.33], 0.34, [1, 1, 1]);
  part(Mesh.Sphere, [0.31, 0.18, 0.47], 0.15, [0.05, 0.05, 0.08]);
  part(Mesh.Cube, [0.5, -0.06, 0], [0.36, 0.16, 0.28], [1, 0.5, 0.15]);
  part(Mesh.Cube, [-0.52, 0.1, 0], [0.26, 0.14, 0.22], [0.95, 0.68, 0.12]);
  const wing = part(Mesh.Cube, [-0.1, -0.02, 0.48], [0.46, 0.1, 0.32], [0.98, 0.7, 0.14]);

  const camera: Camera = { eye: [0, 1.5, 18], target: [0, 1, 0], fov: Math.PI / 3 };
  return {
    world,
    audio,
    haptics,
    bird,
    wing,
    ground,
    ceiling,
    camera,
    scrollers,
    pipes: [] as Pipe[],
    phase: "ready" as Phase,
    time: 0,
    pipeTimer: 0.6,
    flapTime: -1,
    deadAt: 0,
    diedSoundPlayed: false,
    shake: 0,
    score: 0,
    // UI hooks, set by the component.
    onPhase: (_p: Phase) => {},
    onScore: (_s: number) => {},
    onFlash: () => {},
  };
}
type Game = ReturnType<typeof createGame>;

function spawnPipe(g: Game) {
  const gapY = rand(GROUND_Y + 2.2 + GAP / 2, 8 - GAP / 2);
  const bottomTop = gapY - GAP / 2;
  const topBottom = gapY + GAP / 2;
  const kinematic = { body: "kinematic" as const, collider: { layer: SOLID, mask: 0 } };
  const v: Vec3 = [-SCROLL, 0, 0];
  const bottomH = bottomTop - GROUND_Y + 1;
  const topH = CEILING_Y + 2 - topBottom;
  const bottom = g.world.spawn({ position: [SPAWN_X, bottomTop - bottomH / 2, 0], scale: [PIPE_W, bottomH, PIPE_W], color: PIPE, velocity: v, ...kinematic });
  const top = g.world.spawn({ position: [SPAWN_X, topBottom + topH / 2, 0], scale: [PIPE_W, topH, PIPE_W], color: PIPE, velocity: v, ...kinematic });
  const capB = g.world.spawn({ position: [SPAWN_X, bottomTop - 0.3, 0], scale: [PIPE_W + 0.4, 0.6, PIPE_W + 0.4], color: PIPE_CAP, velocity: v, ...kinematic });
  const capT = g.world.spawn({ position: [SPAWN_X, topBottom + 0.3, 0], scale: [PIPE_W + 0.4, 0.6, PIPE_W + 0.4], color: PIPE_CAP, velocity: v, ...kinematic });
  g.pipes.push({ parts: [bottom, top, capB, capT], probe: bottom, gapY, scored: false });
}

/** Feathers: light, draggy little flakes that flutter down and settle on whatever is below. */
function feathers(g: Game, at: Vec3, count: number, spread: number) {
  for (let i = 0; i < count; i++) {
    if (g.world.count >= g.world.capacity - 4) return;
    g.world.spawn({
      position: [at[0] + rand(-0.2, 0.2), at[1] + rand(-0.2, 0.2), at[2] + rand(-0.2, 0.2)],
      scale: [0.16, 0.035, 0.26],
      rotation: aboutZ(rand(0, 6)),
      color: FEATHER,
      velocity: [rand(-spread, spread * 0.4) - 1, rand(-spread, spread), rand(-spread, spread)],
      angularVelocity: [rand(-8, 8), rand(-8, 8), rand(-8, 8)],
      body: { type: "dynamic", gravityScale: 0.12, linearDamping: 2.5, angularDamping: 1.5 },
      collider: { layer: FX, mask: SOLID, density: 0.1, friction: 0.9 },
      lifetime: rand(1.2, 2.2),
    });
  }
}

/** Sand kicked up where the bird lands. */
function dust(g: Game, at: Vec3, strength: number) {
  const n = Math.round(6 + strength * 10);
  for (let i = 0; i < n; i++) {
    if (g.world.count >= g.world.capacity - 4) return;
    const a = rand(0, Math.PI);
    const s = rand(1, 3 + strength * 3);
    g.world.spawn({
      position: [at[0], GROUND_Y + 0.2, at[2] + rand(-0.3, 0.3)],
      scale: rand(0.08, 0.16),
      color: [SAND[0] * rand(0.9, 1.05), SAND[1] * rand(0.9, 1.05), SAND[2] * rand(0.9, 1.05)],
      velocity: [Math.cos(a) * s, rand(1.5, 4), rand(-1.5, 1.5)],
      body: { type: "dynamic", linearDamping: 1.2 },
      collider: { layer: FX, mask: SOLID, restitution: 0.2, density: 0.4 },
      lifetime: rand(0.5, 0.9),
    });
  }
}

function start(g: Game) {
  g.phase = "playing";
  g.world.setOscillation(g.bird, { amplitude: [0, 0, 0], frequency: 0 });
  g.world.setPhysics(g.bird, {
    mesh: Mesh.Sphere,
    body: { type: "dynamic", lockRotations: true, ccd: true },
    collider: { radius: 0.42, layer: BIRD, mask: SOLID, restitution: 0.3, friction: 0.6 },
  });
  g.onPhase("playing");
}

function flap(g: Game) {
  if (g.phase === "ready") start(g);
  if (g.phase !== "playing") return;
  g.world.setVelocity(g.bird, [0, FLAP_SPEED, 0]);
  g.flapTime = g.time;
  const p = g.world.position(g.bird);
  if (p) feathers(g, [p[0] - 0.4, p[1] - 0.1, p[2]], 2, 1.2);
  g.audio.play("flap", { volume: 0.7, rate: rand(0.92, 1.08) });
  g.haptics.impact("soft");
}

function die(g: Game, speed: number) {
  g.phase = "dead";
  g.deadAt = g.time;
  g.shake = 0.5;
  // Everything stops scrolling; the bird loses control and tumbles under real physics.
  for (const pipe of g.pipes) for (const e of pipe.parts) g.world.setVelocity(e, [0, 0, 0]);
  for (const s of g.scrollers) g.world.setVelocity(s.entity, [0, 0, 0]);
  g.world.setAngularVelocity(g.bird, [0, 0, 9]);
  g.world.setPhysics(g.bird, {
    mesh: Mesh.Sphere,
    body: { type: "dynamic", ccd: true, angularDamping: 0.3 },
    collider: { radius: 0.42, layer: BIRD, mask: SOLID, restitution: 0.45, friction: 0.5 },
  });
  g.world.applyImpulse(g.bird, [-1.2, 1.8, 0]);
  const p = g.world.position(g.bird);
  if (p) feathers(g, p, 14, 3.5);
  g.audio.play("hit", { volume: 0.6 + impactStrength(speed, 2, 10) * 0.4 });
  g.haptics.impact("heavy");
  g.onFlash();
  g.onPhase("dead");
}

function tick(g: Game, dt: number) {
  g.time += dt;
  const alive = g.phase === "ready" || g.phase === "playing";

  // Scrolling scenery wraps around.
  if (alive) {
    for (const s of g.scrollers) {
      const p = g.world.position(s.entity);
      if (p && p[0] < -s.wrap / 2) g.world.setPosition(s.entity, [p[0] + s.wrap, p[1], p[2]]);
    }
  }

  if (g.phase === "playing") {
    g.pipeTimer -= dt;
    if (g.pipeTimer <= 0) {
      g.pipeTimer = PIPE_EVERY;
      spawnPipe(g);
    }
    // Nose follows velocity; the wing beats right after a flap, then glides.
    const v = g.world.velocity(g.bird);
    if (v) g.world.setRotation(g.bird, aboutZ(Math.max(-1.3, Math.min(0.45, v[1] * 0.09))));
    if (AUTOPLAY) autopilot(g);
  }
  const sinceFlap = g.time - g.flapTime;
  const wingAngle = alive && sinceFlap < 0.3 ? Math.sin(sinceFlap * 40) * 0.9 : alive ? Math.sin(g.time * 6) * 0.15 : 0.6;
  g.world.setRotation(g.wing, aboutX(wingAngle));

  g.world.update(dt);

  // Score when a pipe passes the bird; drop pipes that left the screen.
  for (let i = g.pipes.length - 1; i >= 0; i--) {
    const pipe = g.pipes[i]!;
    const x = g.world.position(pipe.probe)?.[0] ?? DESPAWN_X - 1;
    if (!pipe.scored && g.phase === "playing" && x < BIRD_X - PIPE_W / 2) {
      pipe.scored = true;
      g.score += 1;
      g.onScore(g.score);
      g.audio.play("point", { volume: 0.8 });
      g.haptics.impact("light");
    }
    if (x < DESPAWN_X) {
      for (const e of pipe.parts) g.world.despawn(e);
      g.pipes.splice(i, 1);
    }
  }

  g.world.forEachCollision((a, b, info) => {
    if (!info.started || (a !== g.bird && b !== g.bird)) return;
    const other = a === g.bird ? b : a;
    if (g.phase === "playing" && other !== g.ceiling) {
      die(g, info.speed);
    } else if (g.phase === "dead" && other === g.ground && info.speed > 1) {
      const p = g.world.position(g.bird);
      const strength = impactStrength(info.speed, 1, 12);
      if (p) dust(g, p, strength);
      g.audio.play("bump", { volume: 0.3 + strength * 0.7 });
      g.haptics.impact(strength > 0.5 ? "medium" : "light");
    }
  });

  if (g.phase === "dead") {
    if (!g.diedSoundPlayed && g.time - g.deadAt > 0.3) {
      g.diedSoundPlayed = true;
      g.audio.play("die", { volume: 0.7 });
      g.haptics.notify("error");
    }
    if (g.time - g.deadAt > 1.4) {
      g.phase = "over";
      best = Math.max(best, g.score);
      g.onPhase("over");
    }
  }

  // Camera: fixed side view with a decaying shake after impact.
  g.shake *= Math.exp(-dt * 6);
  g.camera.eye[0] = rand(-1, 1) * g.shake;
  g.camera.eye[1] = 1.5 + rand(-1, 1) * g.shake;
}

/** Demo bot: flap whenever it drops below the next gap. */
function autopilot(g: Game) {
  const p = g.world.position(g.bird);
  const v = g.world.velocity(g.bird);
  if (!p || !v) return;
  const next = g.pipes.find((pipe) => (g.world.position(pipe.probe)?.[0] ?? -99) > BIRD_X - PIPE_W);
  const target = next ? next.gapY - 0.9 : 1;
  if (p[1] < target && v[1] < 1.5) flap(g);
}

function Round({ audio, haptics, onRestart }: { audio: GameAudio<Sound>; haptics: GameHaptics; onRestart: () => void }) {
  const game = useMemo(() => createGame(audio, haptics), [audio, haptics]);
  const light = useMemo<Light>(() => ({ direction: [0.3, 0.85, 0.55], ambient: 0.45, shadowExtent: 16 }), []);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const flash = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const overAt = useRef(0);

  useEffect(() => {
    game.onPhase = (p) => {
      if (p === "over") overAt.current = Date.now();
      setPhase(p);
    };
    game.onScore = (s) => {
      setScore(s);
      pop.setValue(1.35);
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    };
    game.onFlash = () => {
      flash.setValue(0.85);
      Animated.timing(flash, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    };
    return () => game.world.dispose();
  }, [game, flash, pop]);

  // Autoplay: start by itself and restart after a pause.
  useEffect(() => {
    if (!AUTOPLAY) return;
    const t = setTimeout(phase === "ready" ? () => flap(game) : phase === "over" ? onRestart : () => {}, phase === "over" ? 2500 : 800);
    return () => clearTimeout(t);
  }, [phase, game, onRestart]);

  const onUpdate = useMemo(() => (dt: number) => tick(game, dt), [game]);

  const onTap = () => {
    if (game.phase === "over") {
      if (Date.now() - overAt.current > 500) {
        haptics.selection();
        onRestart();
      }
      return;
    }
    flap(game);
  };

  const medal = score >= 40 ? "Gold" : score >= 20 ? "Silver" : score >= 10 ? "Bronze" : null;

  return (
    <View style={styles.root}>
      <GameView source={game.world} camera={game.camera} light={light} background={SKY} fog={0.016} onUpdate={onUpdate} />
      <Pressable style={StyleSheet.absoluteFill} onPressIn={onTap} />

      <View style={styles.hud} pointerEvents="none">
        {phase !== "ready" && (
          <Animated.Text style={[styles.score, { transform: [{ scale: pop }] }]}>{score}</Animated.Text>
        )}
        {phase === "ready" && (
          <>
            <Text style={styles.title}>Flappy</Text>
            <Text style={styles.subtitle}>Tap to flap</Text>
          </>
        )}
      </View>

      {phase === "over" && (
        <View style={styles.panelWrap} pointerEvents="none">
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Game over</Text>
            <View style={styles.row}>
              <View style={styles.cell}>
                <Text style={styles.label}>Score</Text>
                <Text style={styles.value}>{score}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.label}>Best</Text>
                <Text style={styles.value}>{best}</Text>
              </View>
            </View>
            {medal && <Text style={styles.medal}>{medal} medal</Text>}
            <Text style={styles.again}>Tap to play again</Text>
          </View>
        </View>
      )}

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
    </View>
  );
}

export function Flappy() {
  const [round, setRound] = useState(0);
  const audio = useMemo(() => createExpoAudio(SOUNDS, { voices: 4 }), []);
  const haptics = useMemo(() => createExpoHaptics(), []);
  useEffect(() => () => audio.dispose(), [audio]);
  const restart = useMemo(() => () => setRound((r) => r + 1), []);
  return <Round key={round} audio={audio} haptics={haptics} onRestart={restart} />;
}

const shadow = { textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgb(120,186,237)" },
  hud: { position: "absolute", top: 110, left: 0, right: 0, alignItems: "center" },
  score: { color: "#fff", fontSize: 64, fontWeight: "900", fontVariant: ["tabular-nums"], ...shadow },
  title: { color: "#fff", fontSize: 56, fontWeight: "900", ...shadow },
  subtitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 8, ...shadow },
  panelWrap: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" },
  panel: {
    backgroundColor: "#fdf3d0",
    borderRadius: 18,
    borderWidth: 4,
    borderColor: "#5b3b16",
    paddingVertical: 22,
    paddingHorizontal: 30,
    alignItems: "center",
    gap: 12,
  },
  panelTitle: { color: "#e8692a", fontSize: 34, fontWeight: "900" },
  row: { flexDirection: "row", gap: 36 },
  cell: { alignItems: "center" },
  label: { color: "#8a5a22", fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  value: { color: "#3a2410", fontSize: 32, fontWeight: "900", fontVariant: ["tabular-nums"] },
  medal: { color: "#b7791f", fontSize: 18, fontWeight: "800" },
  again: { color: "#5b3b16", fontSize: 16, fontWeight: "700", marginTop: 4 },
  flash: { backgroundColor: "#fff" },
});
