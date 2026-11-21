import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_TITLE, carRacing, conceptGroups } from "@nayan-example/shared/catalog";
import { COLORS } from "../theme";

function ExampleLink({
  title,
  description,
  href,
  featured,
}: {
  title: string;
  description: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          featured && styles.feature,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Pressable>
    </Link>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.list,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text accessibilityRole="header" style={styles.heading}>
        {APP_TITLE}
      </Text>
      <ExampleLink {...carRacing} href={`/${carRacing.id}`} featured />
      {conceptGroups.map((group) => (
        <View key={group.title} style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {group.title}
          </Text>
          {group.examples.map((example) => (
            <ExampleLink key={example.id} {...example} href={`/concepts/${example.id}`} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 16 },
  heading: { color: COLORS.text, fontSize: 32, fontWeight: "800", marginBottom: 8 },
  section: { gap: 10, marginTop: 6 },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  feature: { borderColor: "#385a82", backgroundColor: "#263d60" },
  pressed: { opacity: 0.78 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
});
