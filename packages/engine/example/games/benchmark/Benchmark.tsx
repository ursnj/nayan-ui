import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GameView, isEngineAvailable, World, type Camera, type GameStats, type RenderSource } from "@nayan-ui/engine";
import { hashColor } from "./hashColor";
import { JsSimulation } from "./JsSimulation";

const COUNT = 10_000;
const BODIES = 1500;
type Backend = "js" | "rust" | "physics";

// Same scene as JsSimulation: grid of cubes, each spinning 1 rad/s and bobbing, phase-offset by index.
function createRustWorld(count: number) {
  const world = new World(count);
  const side = Math.ceil(Math.sqrt(count));
  const spacing = 1.6;
  for (let i = 0; i < count; i++) {
    const phase = (i % 97) * 0.1;
    world.spawn({
      mesh: "cube",
      position: [((i % side) - side / 2) * spacing, 0, (Math.floor(i / side) - side / 2) * spacing],
      color: hashColor(i),
      rotation: [0, Math.sin(phase / 2), 0, Math.cos(phase / 2)],
      spin: [0, 1, 0],
      bob: { amplitude: [0, 0.8, 0], speed: 1.5, phase: phase * 1.5 },
    });
  }
  return world;
}

/** 1,500 dynamic boxes and balls in a walled pit; every few seconds they're blasted back up. */
function createPhysicsWorld() {
  const world = new World(BODIES + 8);
  const fixed = { physics: { type: "fixed" as const, layer: 1, mask: 0 } };
  world.spawn({ mesh: "plane", scale: [40, 1, 40], color: [0.12, 0.15, 0.2], ...fixed });
  for (const [x, z, sx, sz] of [[0, -12, 25, 1], [0, 12, 25, 1], [-12, 0, 1, 25], [12, 0, 1, 25]] as const) {
    world.spawn({ position: [x, 2, z], scale: [sx, 4, sz], color: [0.25, 0.3, 0.38], ...fixed });
  }
  const bodies = [] as ReturnType<World["spawn"]>[];
  for (let i = 0; i < BODIES; i++) {
    bodies.push(
      world.spawn({
        mesh: i % 2 ? "sphere" : "cube",
        position: [(i % 15) * 1.2 - 8.4, 2 + Math.floor(i / 225) * 1.3, (Math.floor(i / 15) % 15) * 1.2 - 8.4],
        scale: 0.9,
        color: hashColor(i),
        physics: { type: "dynamic", layer: 1, mask: 1, bounce: 0.2 },
      }),
    );
  }
  let t = 0;
  return {
    world,
    update(dt: number) {
      t += dt;
      if (t > 6) {
        t = 0;
        for (const b of bodies) world.impulse(b, [Math.random() * 4 - 2, 6 + Math.random() * 6, Math.random() * 4 - 2]);
      }
      world.update(dt);
    },
  };
}

export function Benchmark() {
  const [backend, setBackend] = useState<Backend>(isEngineAvailable ? "rust" : "js");
  const [stats, setStats] = useState<GameStats>({ fps: 0, updateMs: 0 });

  const { source, step, dispose } = useMemo(() => {
    if (backend === "physics") {
      const p = createPhysicsWorld();
      return { source: p.world as RenderSource, step: p.update, dispose: () => p.world.dispose() };
    }
    const s = backend === "rust" ? createRustWorld(COUNT) : new JsSimulation(COUNT);
    return {
      source: s as RenderSource,
      step: (dt: number) => s.update(dt),
      dispose: () => (s instanceof World ? s.dispose() : undefined),
    };
  }, [backend]);
  useEffect(() => dispose, [dispose]);

  const camera = useMemo<Camera>(() => ({ eye: [0, 35, 60], target: [0, 0, 0], fov: Math.PI / 3 }), []);
  const onUpdate = useMemo(() => {
    let t = 0;
    return (dt: number) => {
      t += dt;
      step(dt);
      const r = backend === "physics" ? 30 : 60;
      camera.eye[0] = Math.sin(t * 0.2) * r;
      camera.eye[1] = backend === "physics" ? 22 : 35;
      camera.eye[2] = Math.cos(t * 0.2) * r;
    };
  }, [step, camera, backend]);

  return (
    <View style={styles.root}>
      <GameView key={backend} source={source} camera={camera} onUpdate={onUpdate} onStats={setStats} />
      <View style={styles.hud} pointerEvents="box-none">
        <Text style={styles.text}>
          {backend === "physics" ? `${BODIES.toLocaleString()} rigid bodies` : `${COUNT.toLocaleString()} cubes`} ·{" "}
          {stats.fps.toFixed(0)} fps
        </Text>
        <Text style={styles.text}>update() {stats.updateMs.toFixed(2)} ms</Text>
        <View style={styles.row}>
          {(["js", "rust", "physics"] as const).map((b) => (
            <Pressable
              key={b}
              disabled={b !== "js" && !isEngineAvailable}
              onPress={() => setBackend(b)}
              style={[styles.button, backend === b && styles.active, b !== "js" && !isEngineAvailable && styles.off]}
            >
              <Text style={styles.text}>{b === "js" ? "JS" : b === "rust" ? "Rust" : "Physics"}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0c17" },
  hud: { position: "absolute", top: 100, left: 16, gap: 4 },
  text: { color: "#fff", fontVariant: ["tabular-nums"] },
  row: { flexDirection: "row", gap: 8, marginTop: 6 },
  button: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#fff5" },
  active: { backgroundColor: "#3b82f6" },
  off: { opacity: 0.35 },
});
