import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { isRustAvailable } from "@nayan-ui/engine";
import { Benchmark } from "./games/benchmark/Benchmark";
import { Flappy } from "./games/flappy/Flappy";
import { OrbRush } from "./games/orb-rush/OrbRush";

const SCREENS = [
  { key: "flappy", label: "Flappy", Component: Flappy },
  { key: "orbrush", label: "Orb Rush", Component: OrbRush },
  { key: "benchmark", label: "Benchmark", Component: Benchmark },
] as const;

export default function App() {
  const [index, setIndex] = useState(0);

  if (!isRustAvailable) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>
          The native Rust core isn't linked into this build (Expo Go, or a platform without it yet).
        </Text>
      </View>
    );
  }

  const { Component } = SCREENS[index]!;
  const next = SCREENS[(index + 1) % SCREENS.length]!;
  return (
    <View style={styles.root}>
      <Component />
      <Pressable style={styles.switch} onPress={() => setIndex((i) => (i + 1) % SCREENS.length)} hitSlop={8}>
        <Text style={styles.switchText}>{next.label} ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0c17" },
  switch: {
    position: "absolute",
    top: 60,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff5",
    backgroundColor: "#0008",
  },
  switchText: { color: "#fff", fontSize: 12 },
  missing: { flex: 1, backgroundColor: "#0a0c17", alignItems: "center", justifyContent: "center", padding: 32 },
  missingText: { color: "#fff", textAlign: "center" },
});
