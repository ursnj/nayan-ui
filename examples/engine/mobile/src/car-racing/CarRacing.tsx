import { useEffect } from "react";
import {
  AppState,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameView } from "@nayan-ui/engine";
import { DAY_LIGHT, SKY, useRacing } from "@nayan-engine-example/shared/car-racing";
import { sources } from "./assets";

export default function CarRacing() {
  const racing = useRacing(sources);
  const { width } = useWindowDimensions();
  const { game, phase, paused, setPaused } = racing;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && phase === "playing") setPaused(true);
    });
    return () => subscription.remove();
  }, [phase, setPaused]);
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>NAYAN / ENGINE</Text>
        <Text style={styles.subtitle}>MOBILE + SHARED TYPESCRIPT</Text>
      </View>
      <Text style={styles.title}>CAR RACING</Text>
      <View style={styles.hud}>
        <View>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{racing.score}</Text>
        </View>
        <View>
          <Text style={styles.label}>LIVES</Text>
          <Text style={styles.value}>{racing.lives} / 3</Text>
        </View>
        <View>
          <Text style={styles.label}>TIME LEFT</Text>
          <Text style={[styles.value, racing.time <= 10 && styles.danger]}>
            {Math.floor(racing.time / 60)}:{String(racing.time % 60).padStart(2, "0")}
          </Text>
        </View>
      </View>
      <View style={styles.scene}>
        {game && (
          <GameView
            source={game.world}
            camera={game.camera}
            light={DAY_LIGHT}
            background={SKY}
            fog={0.0075}
            paused={paused}
            onError={racing.reportError}
            onUpdate={racing.update}
            onDrag={(event) => racing.drag(event, width - 32)}
          />
        )}
        {(racing.error || !game || phase !== "playing" || paused) && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.heading}>
                {racing.error
                  ? "Unable to load"
                  : !game
                    ? "Starting engine…"
                    : paused
                      ? "Race paused"
                      : phase === "over"
                        ? racing.lives > 0
                          ? "Time’s up!"
                          : "Crashed!"
                        : "Ready to drive?"}
              </Text>
              <Text style={styles.copy}>
                {racing.error ??
                  (phase === "over"
                    ? `Score ${racing.score} · Best ${racing.best}`
                    : "120 seconds. Three lives.\n500 points for every car passed.")}
              </Text>
              {racing.error ? (
                <Button label="Retry" onPress={racing.restart} />
              ) : (
                game && (
                  <Button
                    label={paused ? "Resume race" : phase === "ready" ? "Start race" : "Race again"}
                    onPress={
                      paused
                        ? () => setPaused(false)
                        : phase === "ready"
                          ? racing.start
                          : racing.restart
                    }
                  />
                )
              )}
            </View>
          </View>
        )}
      </View>
      <View style={styles.controls}>
        <Button label={racing.muted ? "Sound off" : "Sound on"} onPress={racing.toggleMute} />
        {phase === "playing" && (
          <Button label={paused ? "Resume" : "Pause"} onPress={() => setPaused(!paused)} />
        )}
      </View>
      <Text style={styles.hint}>Swipe the road to steer · Inspired by Playtura</Text>
    </SafeAreaView>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#111b19", paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", paddingTop: 14 },
  brand: { color: "#dcff8c", fontWeight: "800", fontSize: 12 },
  subtitle: { color: "#a7b8ae", fontSize: 9 },
  title: { color: "#edf2ef", fontSize: 36, fontWeight: "900", marginVertical: 18 },
  hud: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#1c2a23",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  label: { color: "#acbfb1", fontSize: 10, letterSpacing: 2 },
  value: { color: "#edf2ef", fontSize: 25, fontWeight: "800", marginTop: 3 },
  danger: { color: "#ff8576" },
  scene: { flex: 1, overflow: "hidden", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#08130b40",
  },
  card: {
    backgroundColor: "#15251eee",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5a6a51",
  },
  heading: { color: "#edf2ef", fontSize: 28, fontWeight: "900", textAlign: "center" },
  copy: { color: "#c1cfc6", textAlign: "center", lineHeight: 22, marginVertical: 18 },
  button: {
    backgroundColor: "#dcff8c",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 8,
    minHeight: 44,
  },
  buttonText: { color: "#1a2c15", fontWeight: "800", textAlign: "center" },
  controls: { flexDirection: "row", gap: 12, paddingTop: 16 },
  hint: { color: "#a7b8ae", fontSize: 11, textAlign: "center", paddingVertical: 16 },
});
