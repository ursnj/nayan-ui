import { useEffect, useMemo } from "react";
import {
  AppState,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameView } from "@nayan-ui/engine";
import {
  DAY_LIGHT,
  NIGHT_LIGHT,
  SKY,
  NIGHT_SKY,
  TRACK_LENGTH,
  useRacing,
} from "@nayan-engine-example/shared/car-racing";
import { sources } from "./assets";

export default function CarRacing() {
  const systemMode = useColorScheme();
  const racing = useRacing(sources, systemMode === "dark");
  const styles = useMemo(() => makeStyles(racing.dark), [racing.dark]);
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
      <StatusBar barStyle={racing.dark ? "light-content" : "dark-content"} />
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
          <Text style={styles.label}>TRACK LEFT</Text>
          <Text style={styles.value}>{racing.left} m</Text>
        </View>
      </View>
      <View style={styles.scene}>
        {game && (
          <GameView
            source={game.world}
            camera={game.camera}
            light={racing.dark ? NIGHT_LIGHT : DAY_LIGHT}
            background={racing.dark ? NIGHT_SKY : SKY}
            fog={0.0075}
            paused={racing.renderPaused}
            onError={racing.reportError}
            onUpdate={racing.update}
            onDrag={(event) => racing.drag(event, width - 32)}
          />
        )}
        {racing.nearMiss && (
          <Text pointerEvents="none" style={styles.nearMiss}>
            NEAR MISS!
          </Text>
        )}
        {racing.flash && <View pointerEvents="none" style={[styles.overlay, styles.flash]} />}
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
                          ? "Finished!"
                          : "Crashed!"
                        : "Ready to drive?"}
              </Text>
              <Text style={styles.copy}>
                {racing.error ??
                  (phase === "over"
                    ? `Score ${racing.score} · Best ${racing.best} · ${TRACK_LENGTH - racing.left} m driven`
                    : "2,000 metres. Three lives.\n500 points for every car passed.")}
              </Text>
              {racing.error ? (
                <Button dark={racing.dark} label="Retry" onPress={racing.restart} />
              ) : (
                game && (
                  <Button
                    dark={racing.dark}
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
        <Button
          dark={racing.dark}
          quiet
          label={racing.dark ? "Light mode" : "Dark mode"}
          onPress={racing.toggleMode}
        />
        <Button
          dark={racing.dark}
          quiet
          label={racing.muted ? "Sound off" : "Sound on"}
          onPress={racing.toggleMute}
        />
        {phase === "playing" && (
          <Button
            dark={racing.dark}
            quiet
            label={paused ? "Resume" : "Pause"}
            onPress={() => setPaused(!paused)}
          />
        )}
      </View>
      <Text style={styles.hint}>Swipe the road to steer · Inspired by Playtura</Text>
    </SafeAreaView>
  );
}

function Button({
  label,
  onPress,
  quiet = false,
  dark,
}: {
  label: string;
  onPress: () => void;
  quiet?: boolean;
  dark: boolean;
}) {
  const styles = useMemo(() => makeStyles(dark), [dark]);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        quiet && styles.quietButton,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.buttonText, quiet && styles.quietButtonText]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (dark: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: dark ? "#111b19" : "#f2f6ef", paddingHorizontal: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", paddingTop: 14 },
    brand: { color: dark ? "#dcff8c" : "#365a30", fontWeight: "800", fontSize: 12 },
    subtitle: { color: dark ? "#a7b8ae" : "#526957", fontSize: 9 },
    title: {
      color: dark ? "#edf2ef" : "#253c30",
      fontSize: 36,
      fontWeight: "900",
      marginVertical: 18,
    },
    hud: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
    },
    label: { color: dark ? "#acbfb1" : "#526957", fontSize: 10, letterSpacing: 2 },
    value: { color: dark ? "#edf2ef" : "#253c30", fontSize: 25, fontWeight: "800", marginTop: 3 },
    nearMiss: {
      position: "absolute",
      top: 24,
      alignSelf: "center",
      color: dark ? "#dcff8c" : "#365a30",
      fontSize: 28,
      fontWeight: "900",
    },
    flash: { backgroundColor: "#ff3b3b60" },
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
      backgroundColor: dark ? "#15251eee" : "#f7faf2f5",
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: dark ? "#5a6a51" : "#bfcdb9",
    },
    heading: {
      color: dark ? "#edf2ef" : "#253c30",
      fontSize: 28,
      fontWeight: "900",
      textAlign: "center",
    },
    copy: {
      color: dark ? "#c1cfc6" : "#526957",
      textAlign: "center",
      lineHeight: 22,
      marginVertical: 18,
    },
    button: {
      backgroundColor: dark ? "#dcff8c" : "#365a30",
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 8,
      minHeight: 44,
    },
    quietButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: dark ? "#ffffff40" : "#253c3040",
    },
    quietButtonText: { color: dark ? "#edf2ef" : "#253c30" },
    buttonText: { color: dark ? "#1a2c15" : "#ffffff", fontWeight: "800", textAlign: "center" },
    controls: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 16 },
    hint: {
      color: dark ? "#a7b8ae" : "#526957",
      fontSize: 11,
      textAlign: "center",
      paddingVertical: 16,
    },
  });
