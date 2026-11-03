import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameView } from '@nayan-ui/engine';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExampleProps } from '../../types';
import { FOG, LIGHT, LIVES, SKY } from './CarRacingConstants';
import { useCarRacing } from './useCarRacing';

const WEB = Platform.OS === 'web';
const KEYS: Record<string, number> = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 };
// Plain values that suit both a React Native style and the web GameView's CSS.
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

/**
 * The whole game as one component, for React Native and (through react-native-web) the browser. It
 * fills its parent; the HUD starts at `offset`, below the host's header.
 */
export function CarRacing(props: ExampleProps) {
  return (
    <SafeAreaProvider>
      <Screen {...props} />
    </SafeAreaProvider>
  );
}

function Screen({ offset, onPlayingChange }: ExampleProps) {
  const racing = useCarRacing();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const over = racing.phase === 'won' || racing.phase === 'lost';

  const playing = racing.phase === 'playing';
  useEffect(() => onPlayingChange?.(playing), [playing, onPlayingChange]);

  // In the browser, arrow keys or A/D steer while held.
  const { steer } = racing;
  useEffect(() => {
    if (!WEB) return;
    const held = new Set<number>();
    const key = (event: KeyboardEvent) => {
      const direction = KEYS[event.key];
      if (direction === undefined) return;
      event.preventDefault();
      if (event.type === 'keydown') held.add(direction);
      else held.delete(direction);
      steer((held.has(1) ? 1 : 0) - (held.has(-1) ? 1 : 0));
    };
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
    };
  }, [steer]);

  return (
    <View style={styles.screen}>
      {racing.world && racing.game && (
        <GameView
          source={racing.world}
          camera={racing.game.camera}
          light={LIGHT}
          background={SKY}
          fog={FOG}
          paused={racing.paused}
          onUpdate={racing.update}
          onDrag={(event) => racing.drag(event, width)}
          onError={(error) => console.error(error)}
          style={FILL}
        />
      )}

      <View style={[styles.hud, { paddingTop: offset ?? insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.stats} pointerEvents="none">
          <Stat label="SCORE" value={racing.score.toLocaleString()} />
          <Stat label="LIVES" value={'♥'.repeat(racing.lives) + '♡'.repeat(Math.max(0, LIVES - racing.lives))} />
          <Stat label="TO FINISH" value={`${racing.left} m`} />
        </View>
        <View style={styles.actions}>
          <Button title={racing.muted ? 'Sound off' : 'Sound on'} onPress={racing.toggleMute} />
          {racing.phase === 'playing' && <Button title={racing.paused ? 'Resume' : 'Pause'} onPress={() => racing.setPaused(!racing.paused)} />}
        </View>
      </View>

      {racing.phase !== 'playing' && (
        <View style={[FILL, styles.overlay]}>
          {racing.error ? (
            <Text style={styles.text}>{racing.error}</Text>
          ) : (
            <>
              <Text style={styles.title}>{racing.phase === 'won' ? 'Finished!' : racing.phase === 'lost' ? 'Crashed out' : 'Car Racing'}</Text>
              {over && <Text style={styles.text}>Score {racing.score.toLocaleString()}</Text>}
              <Button title={!racing.game ? 'Loading…' : over ? 'Race again' : 'Start race'} onPress={racing.start} disabled={!racing.game} />
              <Text style={styles.hint}>{WEB ? '← → or A D to steer · or drag the road' : 'Drag the road to steer'}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const Button = ({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && { opacity: 0.6 }]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: '#0f172a' },
  hud: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, gap: 12 },
  stats: { flexDirection: 'row', gap: 20 },
  actions: { flexDirection: 'row', gap: 8 },
  label: { color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, opacity: 0.85, userSelect: 'none' },
  value: { color: 'white', fontSize: 22, fontWeight: '800', userSelect: 'none' },
  overlay: { alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: 'rgba(0,0,0,0.3)' },
  title: { color: 'white', fontSize: 34, fontWeight: '800', userSelect: 'none' },
  text: { color: 'white', fontSize: 17, userSelect: 'none' },
  hint: { color: 'white', fontSize: 13, opacity: 0.85, userSelect: 'none' },
  button: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  buttonText: { color: '#0f172a', fontSize: 15, fontWeight: '700', userSelect: 'none' }
});
