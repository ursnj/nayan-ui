import { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameView } from '@nayan-ui/engine';
import { DAY_LIGHT, NIGHT_LIGHT, SKY, NIGHT_SKY, TRACK_LENGTH, useCarRacing } from '@nayan-engine-example/shared/car-racing';
import { sources } from './CarRacingAssets';

export default function CarRacing() {
  const systemMode = useColorScheme();
  const racing = useCarRacing(sources, systemMode === 'dark');
  const styles = useMemo(() => makeStyles(racing.dark), [racing.dark]);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hudTop = insets.top + 16;
  const [hudHeight, setHudHeight] = useState(252);
  const { game, phase, paused, setPaused } = racing;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && phase === 'playing') setPaused(true);
    });
    return () => subscription.remove();
  }, [phase, setPaused]);
  return (
    <View style={styles.screen}>
      <StatusBar hidden />
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
            onDrag={(event) => racing.drag(event, width)}
          />
        )}
        {racing.nearMiss && (
          <Text pointerEvents="none" style={[styles.nearMiss, { top: hudTop + hudHeight + 12 }]}>
            NEAR MISS!
          </Text>
        )}
        {racing.flash && <View pointerEvents="none" style={[styles.overlay, styles.flash]} />}
        {(racing.error || !game || phase !== 'playing' || paused) && (
          <View
            style={[
              styles.overlay,
              {
                paddingTop: hudTop + hudHeight + 16,
                paddingBottom: insets.bottom + 56,
                paddingLeft: insets.left + 20,
                paddingRight: insets.right + 20
              }
            ]}
          >
            <ScrollView style={styles.cardScroll} contentContainerStyle={styles.cardContent} bounces={false}>
              <View style={styles.card}>
                <Text style={styles.eyebrow}>{racing.error ? 'ENGINE ERROR' : phase === 'over' ? 'RACE COMPLETE' : 'CAR RACING'}</Text>
                <Text accessibilityRole="header" style={styles.heading}>
                  {racing.error
                    ? 'Unable to load'
                    : !game
                      ? 'Starting engine…'
                      : paused
                        ? 'Race paused'
                        : phase === 'over'
                          ? racing.lives > 0
                            ? 'Finished!'
                            : 'Crashed!'
                          : 'Ready to drive?'}
                </Text>
                <Text style={styles.copy}>
                  {racing.error ??
                    (phase === 'over'
                      ? `Score ${racing.score} · Best ${racing.best} · ${TRACK_LENGTH - racing.left} m driven`
                      : '2,000 metres. Three lives.\n500 points for every car passed.')}
                </Text>
                {racing.error ? (
                  <Button dark={racing.dark} label="Retry" onPress={racing.restart} />
                ) : (
                  game && (
                    <Button
                      dark={racing.dark}
                      label={paused ? 'Resume race' : phase === 'ready' ? 'Start race' : 'Race again'}
                      onPress={paused ? () => setPaused(false) : phase === 'ready' ? racing.start : racing.restart}
                    />
                  )
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
      <View
        pointerEvents="box-none"
        onLayout={(event) => setHudHeight(event.nativeEvent.layout.height)}
        style={[
          styles.hud,
          {
            top: hudTop,
            left: insets.left + 16,
            right: insets.right + 16
          }
        ]}
      >
        <View pointerEvents="none" style={styles.stats}>
          <View>
            <Text style={styles.label}>SCORE</Text>
            <Text style={styles.value}>{racing.score.toLocaleString()}</Text>
          </View>
          <View accessible accessibilityLabel={`${racing.lives} of 3 lives`}>
            <Text style={styles.label}>LIVES</Text>
            <View style={styles.hearts}>
              {[0, 1, 2].map((life) => (
                <Text key={life} style={[styles.heart, life >= racing.lives && styles.lostHeart]}>
                  {life < racing.lives ? '♥' : '♡'}
                </Text>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.label}>TRACK LEFT</Text>
            <Text style={styles.value}>
              {racing.left.toLocaleString()} <Text style={styles.unit}>m</Text>
            </Text>
          </View>
        </View>
        <View pointerEvents="box-none" style={styles.controls}>
          <Action
            icon={racing.dark ? '☀' : '☾'}
            label={racing.dark ? 'Light mode' : 'Dark mode'}
            accessibilityLabel={racing.dark ? 'Switch to light mode' : 'Switch to dark mode'}
            selected={racing.dark}
            onPress={racing.toggleMode}
          />
          <Action
            icon={racing.muted ? '♪ ×' : '♫'}
            label={racing.muted ? 'Sound off' : 'Sound on'}
            accessibilityLabel={racing.muted ? 'Turn sound on' : 'Turn sound off'}
            selected={!racing.muted}
            onPress={racing.toggleMute}
          />
          {phase === 'playing' && <Action icon={paused ? '▶' : 'Ⅱ'} label={paused ? 'Resume' : 'Pause'} onPress={() => setPaused(!paused)} />}
        </View>
      </View>
      <Text
        pointerEvents="none"
        style={[styles.hint, { bottom: insets.bottom + 16, left: insets.left + 20, right: insets.right + 20 }, height < 450 && styles.compactHint]}
      >
        Swipe the road to steer
      </Text>
    </View>
  );
}

function Action({
  icon,
  label,
  accessibilityLabel = label,
  selected,
  onPress
}: {
  icon: string;
  label: string;
  accessibilityLabel?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => [hudStyles.action, pressed && hudStyles.pressed]}
    >
      <Text accessible={false} style={hudStyles.icon}>
        {icon}
      </Text>
      <Text accessible={false} style={hudStyles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function Button({ label, onPress, dark }: { label: string; onPress: () => void; dark: boolean }) {
  const styles = useMemo(() => makeStyles(dark), [dark]);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && hudStyles.pressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const textShadow = {
  textShadowColor: '#000000cc',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 5
};

const hudStyles = StyleSheet.create({
  action: {
    minWidth: 60,
    minHeight: 56,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  pressed: { opacity: 0.65 },
  icon: { color: '#ffffff', fontSize: 24, lineHeight: 28, ...textShadow },
  actionLabel: { color: '#ffffff', fontSize: 10, fontWeight: '600', ...textShadow }
});

const makeStyles = (dark: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: dark ? '#111b19' : '#bdd8eb' },
    scene: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
    hud: {
      position: 'absolute',
      zIndex: 30,
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12
    },
    stats: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16
    },
    label: { color: '#ffffff', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, ...textShadow },
    value: {
      color: '#ffffff',
      fontSize: 32,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      marginTop: 3,
      ...textShadow
    },
    unit: { fontSize: 18 },
    hearts: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, minHeight: 38 },
    heart: { color: '#ff737b', fontSize: 25, ...textShadow },
    lostHeart: { color: '#ffffff80' },
    controls: { flexDirection: 'column', gap: 8 },
    nearMiss: {
      position: 'absolute',
      alignSelf: 'center',
      color: '#dcff8c',
      fontSize: 28,
      fontWeight: '900',
      ...textShadow
    },
    flash: { backgroundColor: '#ff3b3b60' },
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#08130b40'
    },
    cardScroll: { flexGrow: 0, maxHeight: '100%', width: '100%', maxWidth: 440 },
    cardContent: { flexGrow: 1, justifyContent: 'center' },
    card: {
      backgroundColor: dark ? '#15251eee' : '#f7faf2f5',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: dark ? '#5a6a51' : '#bfcdb9'
    },
    eyebrow: {
      color: dark ? '#c1cfc6' : '#526957',
      fontSize: 11,
      letterSpacing: 2,
      marginBottom: 10
    },
    heading: {
      color: dark ? '#edf2ef' : '#253c30',
      fontSize: 28,
      fontWeight: '900',
      textAlign: 'center'
    },
    copy: {
      color: dark ? '#c1cfc6' : '#526957',
      textAlign: 'center',
      lineHeight: 22,
      marginVertical: 18
    },
    button: {
      backgroundColor: dark ? '#dcff8c' : '#365a30',
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 8,
      minHeight: 44
    },
    buttonText: { color: dark ? '#1a2c15' : '#ffffff', fontWeight: '800', textAlign: 'center' },
    hint: {
      position: 'absolute',
      color: '#ffffff',
      fontSize: 11,
      textAlign: 'center',
      ...textShadow
    },
    compactHint: { fontSize: 10 }
  });
