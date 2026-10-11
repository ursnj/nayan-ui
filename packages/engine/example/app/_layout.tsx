import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { isEngineAvailable } from "@nayan-ui/engine";
import { useGameTheme } from "../games/ui/theme";

export default function RootLayout() {
  const theme = useGameTheme();

  if (!isEngineAvailable) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>
          The native Rust core isn't linked into this build (Expo Go, or a platform without it yet).
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.BACKGROUND },
        headerTintColor: theme.HEADER_TINT,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal", // just the arrow, no "Nayan Engine" beside it (iOS)
        contentStyle: { backgroundColor: theme.BACKGROUND },
        statusBarStyle: theme.dark ? "light" : "dark",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Nayan Engine" }} />
      {/* Games draw their scene under a see-through header (GameLayout themes it). */}
      <Stack.Screen name="car-racing" options={{ title: "Car Racing", headerTransparent: true, headerStyle: { backgroundColor: "transparent" } }} />
      <Stack.Screen name="flappy-bird" options={{ title: "Flappy Bird", headerTransparent: true, headerStyle: { backgroundColor: "transparent" } }} />
      {/* The benchmark's scene is dark whatever the theme. */}
      <Stack.Screen
        name="benchmark"
        options={{
          title: "Benchmark",
          headerStyle: { backgroundColor: "#0a0c17" },
          headerTintColor: "#fff",
          statusBarStyle: "light",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    backgroundColor: "#0a0c17",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  missingText: { color: "#fff", textAlign: "center" },
});
