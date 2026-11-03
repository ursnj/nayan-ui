import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Example, EXAMPLES } from './examples';

/** The app: a list of examples, and the open one full screen with a back button. */
export function Gallery() {
  const [open, setOpen] = useState<Example | null>(null);

  // Android's back button returns to the list.
  useEffect(() => {
    if (!open) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(null);
      return true;
    });
    return () => back.remove();
  }, [open]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {open ? <Opened example={open} onBack={() => setOpen(null)} /> : <Home onOpen={setOpen} />}
    </SafeAreaProvider>
  );
}

function Opened({ example, onBack }: { example: Example; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <example.Screen />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="All examples"
        onPress={onBack}
        style={[styles.back, { top: insets.top + 12, right: insets.right + 16 }]}>
        <Text style={styles.backText}>‹ Examples</Text>
      </Pressable>
    </View>
  );
}

const GAP = 16;
const MAX_WIDTH = 1120;

function Home({ onOpen }: { onOpen: (example: Example) => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 1040 ? 3 : width >= 680 ? 2 : 1; // tablets get more than one
  const cardWidth = (Math.min(width - 32, MAX_WIDTH) - GAP * (columns - 1)) / columns;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.home, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>@nayan-ui/engine</Text>
        <Text style={styles.heading}>Examples</Text>
        <Text style={styles.lead}>Games and demos built on the Nayan engine.</Text>
        <View style={styles.grid}>
          {EXAMPLES.map((example) => (
            <Pressable
              key={example.id}
              accessibilityRole="button"
              onPress={() => onOpen(example)}
              style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}>
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
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  home: { flexGrow: 1, paddingHorizontal: 16, alignItems: 'center' },
  page: { width: '100%', maxWidth: MAX_WIDTH },
  eyebrow: { color: '#93c5fd', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  heading: { color: 'white', fontSize: 34, fontWeight: '800', marginTop: 6 },
  lead: { color: '#cbd5e1', fontSize: 16, lineHeight: 23, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 28 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  pressed: { opacity: 0.85 },
  cover: { height: 140, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 64 },
  body: { padding: 16, gap: 8 },
  title: { color: 'white', fontSize: 20, fontWeight: '700' },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden'
  },
  back: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  backText: { color: '#0f172a', fontSize: 14, fontWeight: '700' }
});
