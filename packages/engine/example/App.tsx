import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GameView, isRustAvailable, RustSimulation, type GameStats, type Simulation } from "@nayan-ui/engine";
import { JsSimulation } from "./JsSimulation";

const COUNT = 10_000;
type Backend = "js" | "rust";

function createRustSimulation(count: number) {
  const sim = new RustSimulation(count);
  const side = Math.ceil(Math.sqrt(count));
  const spacing = 1.6;
  for (let i = 0; i < count; i++) {
    sim.spawn([((i % side) - side / 2) * spacing, 0, (Math.floor(i / side) - side / 2) * spacing], {
      angularVelocity: [0, 1 + (i % 7) * 0.4, 0],
    });
  }
  return sim;
}

export default function App() {
  const [backend, setBackend] = useState<Backend>(isRustAvailable ? "rust" : "js");
  const [stats, setStats] = useState<GameStats>({ fps: 0, updateMs: 0 });

  const simulation = useMemo<Simulation>(
    () => (backend === "rust" ? createRustSimulation(COUNT) : new JsSimulation(COUNT)),
    [backend],
  );
  useEffect(() => () => (simulation instanceof RustSimulation ? simulation.dispose() : undefined), [simulation]);

  return (
    <View style={styles.root}>
      <GameView key={backend} simulation={simulation} onStats={setStats} />
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
  root: { flex: 1, backgroundColor: "#0d0f17" },
  hud: { position: "absolute", top: 56, left: 16, gap: 4 },
  text: { color: "#fff", fontVariant: ["tabular-nums"] },
  row: { flexDirection: "row", gap: 8, marginTop: 6 },
  button: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#fff5" },
  active: { backgroundColor: "#3b82f6" },
  off: { opacity: 0.35 },
});
