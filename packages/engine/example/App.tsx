import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { isRustAvailable } from "@nayan-ui/engine";
import { Benchmark } from "./Benchmark";
import { OrbRush } from "./OrbRush";

type Screen = "game" | "benchmark";

export default function App() {
  const [screen, setScreen] = useState<Screen>("game");

  if (!isRustAvailable) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>
          The native Rust core isn't linked into this build (Expo Go, or a platform without it yet).
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {screen === "game" ? <OrbRush /> : <Benchmark />}
      <Pressable
        style={styles.switch}
        onPress={() => setScreen(screen === "game" ? "benchmark" : "game")}
      >
        <Text style={styles.switchText}>{screen === "game" ? "Benchmark" : "Game"}</Text>
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
