import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXAMPLES } from '../examples';
import { COLORS } from '../theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[styles.list, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.heading}>Games</Text>
      {EXAMPLES.map((example) => (
        <Link key={example.id} href={`/${example.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.title}>{example.title}</Text>
            <Text style={styles.description}>{example.description}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 12 },
  heading: { color: COLORS.text, fontSize: 32, fontWeight: '800', marginBottom: 8 },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 20 }
});
