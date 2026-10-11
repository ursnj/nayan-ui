import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useGameTheme, type Theme } from "../games/ui/theme";

const EXAMPLES: {
  href: Href;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    href: "/car-racing",
    title: "Car Racing",
    description: "A 3D highway racer: glTF cars, physics crashes, fire, nitro and day / night.",
    icon: "car-sport",
  },
  {
    href: "/flappy-bird",
    title: "Flappy Bird",
    description: "Tap to flap through the pipes. Physics tumbles, particles and sound.",
    icon: "egg",
  },
  {
    href: "/benchmark",
    title: "Benchmark",
    description: "Thousands of cubes or rigid bodies, JS against the Rust core, with live fps.",
    icon: "speedometer",
  },
];

export default function Home() {
  const theme = useGameTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {EXAMPLES.map((e) => (
        <Link key={e.title} href={e.href} asChild>
          <Pressable style={styles.card} android_ripple={{ color: theme.FILL }}>
            <View style={styles.iconBox}>
              <Ionicons name={e.icon} size={28} color={theme.ON_SOLID} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{e.title}</Text>
              <Text style={styles.description}>{e.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.TEXT_MUTED} />
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    list: { padding: 16, gap: 12, width: "100%", maxWidth: 560, alignSelf: "center" },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 18,
      backgroundColor: t.SURFACE,
      borderColor: t.BORDER,
      borderWidth: t.BORDER_WIDTH,
    },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: t.SOLID,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1 },
    title: { color: t.TEXT, fontSize: 18, fontWeight: "700" },
    description: { color: t.TEXT_MUTED, fontSize: 13, marginTop: 2 },
  });
}
