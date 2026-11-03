import { Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameView } from '@nayan-ui/engine';
import { FOG, LIGHT, LIVES, SKY, useCarRacing } from '@nayan-engine-example/shared/car-racing';
import { sources } from './CarRacingAssets';

export default function CarRacing() {
  const racing = useCarRacing(sources);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const over = racing.phase === 'won' || racing.phase === 'lost';

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
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
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={[styles.hud, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.stats} pointerEvents="none">
          <Stat label="SCORE" value={racing.score.toLocaleString()} />
          <Stat label="LIVES" value={'♥'.repeat(racing.lives) + '♡'.repeat(Math.max(0, LIVES - racing.lives))} />
          <Stat label="TO FINISH" value={`${racing.left} m`} />
        </View>
        <View style={styles.actions}>
          <Button title={racing.muted ? 'Sound off' : 'Sound on'} onPress={racing.toggleMute} />
          {racing.phase === 'playing' && (
            <Button title={racing.paused ? 'Resume' : 'Pause'} onPress={() => racing.setPaused(!racing.paused)} />
          )}
        </View>
      </View>

      {racing.phase !== 'playing' && (
        <View style={styles.overlay}>
          {racing.error ? (
            <Text style={styles.text}>{racing.error}</Text>
          ) : (
            <>
              <Text style={styles.title}>
                {racing.phase === 'won' ? 'Finished!' : racing.phase === 'lost' ? 'Crashed out' : 'Car Racing'}
              </Text>
              {over && <Text style={styles.text}>Score {racing.score.toLocaleString()}</Text>}
              <Button
                title={!racing.game ? 'Loading…' : over ? 'Race again' : 'Start race'}
                onPress={racing.start}
                disabled={!racing.game}
              />
              <Text style={styles.hint}>Drag the road to steer</Text>
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
  screen: { flex: 1, backgroundColor: '#0f172a' },
  hud: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, gap: 12 },
  stats: { flexDirection: 'row', gap: 20 },
  actions: { flexDirection: 'row', gap: 8 },
  label: { color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, opacity: 0.85 },
  value: { color: 'white', fontSize: 22, fontWeight: '800' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: 'rgba(0,0,0,0.3)' },
  title: { color: 'white', fontSize: 34, fontWeight: '800' },
  text: { color: 'white', fontSize: 17 },
  hint: { color: 'white', fontSize: 13, opacity: 0.85 },
  button: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  buttonText: { color: '#0f172a', fontSize: 15, fontWeight: '700' }
});
