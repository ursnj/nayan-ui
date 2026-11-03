import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXAMPLES } from '../examples';
import { COLORS } from '../theme';

const GAP = 16;
const MAX_WIDTH = 1120;

/** The list of examples; each card opens `/<id>`. */
export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 1040 ? 3 : width >= 680 ? 2 : 1; // tablets get more than one
  const cardWidth = (Math.min(width - 32, MAX_WIDTH) - GAP * (columns - 1)) / columns;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.home, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={styles.page}>
        <Text style={styles.eyebrow}>@nayan-ui/engine</Text>
        <Text style={styles.heading}>Examples</Text>
        <Text style={styles.lead}>Games and demos built on the Nayan engine.</Text>
        <View style={styles.grid}>
          {EXAMPLES.map((example) => (
            <Link key={example.id} href={`/${example.id}`} asChild>
              <Pressable style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}>
                <View style={[styles.cover, { backgroundColor: example.color }]}>
                  <Text style={styles.icon}>{example.icon}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.title}>{example.title}</Text>
                  <Text style={styles.description}>{example.description}</Text>
                  <View style={styles.tags}>
                    {example.tags.map((tag) => (
                      <Text key={tag} style={styles.tag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  home: { flexGrow: 1, paddingHorizontal: 16, alignItems: 'center' },
  page: { width: '100%', maxWidth: MAX_WIDTH },
  eyebrow: { color: '#93c5fd', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  heading: { color: COLORS.text, fontSize: 34, fontWeight: '800', marginTop: 6 },
  lead: { color: '#cbd5e1', fontSize: 16, lineHeight: 23, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 28 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  pressed: { opacity: 0.85 },
  cover: { height: 140, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 64 },
  body: { padding: 16, gap: 8 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden'
  }
});
