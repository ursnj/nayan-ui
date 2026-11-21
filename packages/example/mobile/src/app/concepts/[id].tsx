import { Redirect, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { findConcept } from "@nayan-example/shared/catalog";
import { ConceptPreview } from "@nayan-example/shared/concepts";
import { COLORS } from "../../theme";

export default function ConceptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const example = findConcept(id);
  if (!example) return <Redirect href="/" />;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.description}>{example.description}</Text>
      <ConceptPreview id={example.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  description: { color: COLORS.muted, fontSize: 15, lineHeight: 22 },
});
