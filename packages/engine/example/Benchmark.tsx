import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GameView, isRustAvailable, Mesh, World, type Camera, type GameStats, type RenderSource } from "@nayan-ui/engine";
import { hashColor } from "./hashColor";
import { JsSimulation } from "./JsSimulation";

const COUNT = 10_000;
type Backend = "js" | "rust";

// Same scene as JsSimulation: grid of cubes, each spinning 1 rad/s and bobbing, phase-offset by index.
function createRustWorld(count: number) {
  const world = new World(count);
  const side = Math.ceil(Math.sqrt(count));
  const spacing = 1.6;
  for (let i = 0; i < count; i++) {
    const phase = (i % 97) * 0.1;
    world.spawn({
      mesh: Mesh.Cube,
      position: [((i % side) - side / 2) * spacing, 0, (Math.floor(i / side) - side / 2) * spacing],
      color: hashColor(i),
      rotation: [0, Math.sin(phase / 2), 0, Math.cos(phase / 2)],
      angularVelocity: [0, 1, 0],
      oscillation: { amplitude: [0, 0.8, 0], frequency: 1.5, phase: phase * 1.5 },
    });
  }
  return world;
}

export function Benchmark() {
  const [backend, setBackend] = useState<Backend>(isRustAvailable ? "rust" : "js");
  const [stats, setStats] = useState<GameStats>({ fps: 0, updateMs: 0 });

  const source = useMemo<RenderSource & { update(dt: number): void }>(
    () => (backend === "rust" ? createRustWorld(COUNT) : new JsSimulation(COUNT)),
    [backend],
  );
  useEffect(() => () => (source instanceof World ? source.dispose() : undefined), [source]);

  const camera = useMemo<Camera>(() => ({ eye: [0, 35, 60], target: [0, 0, 0], fov: Math.PI / 3 }), []);
  const onUpdate = useMemo(() => {
    let t = 0;
    return (dt: number) => {
      t += dt;
      source.update(dt);
      camera.eye[0] = Math.sin(t * 0.2) * 60;
      camera.eye[2] = Math.cos(t * 0.2) * 60;
    };
  }, [source, camera]);

  return (
    <View style={styles.root}>
      <GameView key={backend} source={source} camera={camera} onUpdate={onUpdate} onStats={setStats} />
      <View style={styles.hud} pointerEvents="box-none">
        <Text style={styles.text}>
          {COUNT.toLocaleString()} cubes · {stats.fps.toFixed(0)} fps
        </Text>
        <Text style={styles.text}>update() {stats.updateMs.toFixed(2)} ms</Text>
        <View style={styles.row}>
          {(["js", "rust"] as const).map((b) => (
            <Pressable
              key={b}
              disabled={b === "rust" && !isRustAvailable}
              onPress={() => setBackend(b)}
              style={[styles.button, backend === b && styles.active, b === "rust" && !isRustAvailable && styles.off]}
            >
              <Text style={styles.text}>{b === "js" ? "JS" : "Rust"}</Text>
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
