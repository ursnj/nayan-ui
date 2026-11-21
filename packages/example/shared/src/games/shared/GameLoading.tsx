import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { type Font, GameView, isEngineAvailable, warmUpEngine } from '@nayan-ui/engine';
import { GAMES_METADATA } from '../../services/GamesMetadata';
import { resolveGameTheme } from '../../services/ThemeService';
import type { GAME_IDS, GameThemeMode } from '../../services/UtilsService';
import { loadHudFonts } from './EngineHud';
import { EngineLoading, LOADING_LIGHT, loadingLook, loadingPlacement } from './EngineLoading';
import { useGameResource } from './useGameResource';

interface GameLoadingProps {
  gameId: GAME_IDS;
  theme?: GameThemeMode;
  label?: string;
  error?: boolean;
  message?: string;
  onRetry?: () => void;
  offset?: number;
  visible?: boolean;
}
interface LoadingViewProps extends GameLoadingProps {
  font: Font;
  width: number;
  height: number;
  reducedMotion: boolean;
  onFailure: () => void;
}
const LoadingView = memo(function LoadingView({
  gameId,
  theme,
  font,
  width,
  height,
  offset = 0,
  label = 'Getting ready',
  error = false,
  message,
  onRetry,
  visible = true,
  reducedMotion,
  onFailure
}: LoadingViewProps) {
  const scene = useGameResource(
    () => new EngineLoading(gameId, theme, font),
    (value) => () => value.dispose()
  );
  useEffect(() => scene.layout(width, height, offset), [scene, width, height, offset]);
  useEffect(
    () => scene.setStatus({ label, error, message, retry: !!onRetry, reducedMotion }),
    [scene, label, error, message, onRetry, reducedMotion]
  );
  const update = useCallback((dt: number) => scene.update(dt), [scene]);
  const retry = useRef(onRetry);
  retry.current = onRetry;
  const tap = useCallback(
    (x: number, y: number) => {
      const box = scene.retryBounds;
      if (error && x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height) retry.current?.();
    },
    [scene, error]
  );
  // This transparent control supplies keyboard/screen-reader access; all visible pixels are engine-drawn.
  const { retryBounds } = loadingPlacement(width, height, offset);
  return (
    <>
      <GameView
        source={scene.world}
        camera={scene.camera}
        light={LOADING_LIGHT}
        background={scene.clearColor}
        onUpdate={update}
        paused={!visible}
        onTap={tap}
        onError={onFailure}
        style={StyleSheet.absoluteFill}
      />
      {visible && error && onRetry && (
        <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={onRetry} style={{ position: 'absolute', ...retryBounds }} />
      )}
    </>
  );
});

/** Shared engine loading world; only engine-unavailable/bootstrap failures use the text fallback. */
export const GameLoading = memo(function GameLoading({
  gameId,
  theme,
  label = 'Getting ready',
  error = false,
  message,
  onRetry,
  offset = 0,
  visible = true
}: GameLoadingProps) {
  const colors = resolveGameTheme(theme);
  const look = loadingLook(gameId, theme);
  const title = GAMES_METADATA[gameId].title;
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [font, setFont] = useState<Font | null>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (alive) setReducedMotion(value);
      },
      () => {}
    );
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (font || !visible || !isEngineAvailable || failed) return;
    let alive = true;
    void warmUpEngine()
      .then(loadHudFonts)
      .then(
        (fonts) => {
          if (alive) setFont(fonts.semi);
        },
        () => {
          if (alive) setFailed(true);
        }
      );
    return () => {
      alive = false;
    };
  }, [font, visible, failed]);
  const layout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((old) => (old?.width === width && old.height === height ? old : { width, height }));
  }, []);
  const failure = useCallback(() => setFailed(true), []);
  const ready = !!font && !!size && size.width > 0 && size.height > 0 && !failed;
  return (
    <View
      testID="game-loading"
      style={[styles.root, { backgroundColor: look.colours.sky }]}
      onLayout={layout}
      accessible={!error}
      accessibilityLiveRegion="polite"
      accessibilityRole={error ? 'alert' : 'progressbar'}
      accessibilityState={{ busy: !error }}
      accessibilityLabel={`${title}. ${error ? (message ?? 'Unable to prepare this game') : label}`}>
      {ready ? (
        <LoadingView
          key={`${gameId}:${theme}`}
          gameId={gameId}
          theme={theme}
          font={font}
          width={size.width}
          height={size.height}
          label={label}
          error={error}
          message={message}
          onRetry={onRetry}
          offset={offset}
          visible={visible}
          reducedMotion={reducedMotion}
          onFailure={failure}
        />
      ) : (
        visible && (
          <View style={[styles.fallback, { paddingTop: offset }]}>
            <View testID="game-loading-art" accessible={false} style={styles.art}>
              <View style={[styles.tile, { backgroundColor: look.colours.second, left: 8, top: 26, transform: [{ rotate: '-16deg' }] }]} />
              <View style={[styles.tile, { backgroundColor: look.colours.horizon, right: 8, top: 26, transform: [{ rotate: '16deg' }] }]} />
              <View style={[styles.tile, { backgroundColor: look.colours.accent, left: 45, top: 8 }]} />
            </View>
            <Text style={[styles.title, { color: colors.TEXT }]}>{title}</Text>
            {!error && <ActivityIndicator animating={!reducedMotion} hidesWhenStopped={false} color={look.colours.accent} style={styles.spinner} />}
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole={error ? 'alert' : 'progressbar'}
              style={[styles.label, { color: colors.TEXT_SUBTLE }]}>
              {error ? (message ?? 'Unable to prepare this game.') : `${label}…`}
            </Text>
            {error && onRetry && (
              <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.retry, { backgroundColor: colors.SOLID }]}>
                <Text style={{ color: colors.ON_SOLID }}>Try again</Text>
              </Pressable>
            )}
          </View>
        )
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  root: { flex: 1 },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  art: { width: 144, height: 104, marginBottom: 24 },
  tile: { position: 'absolute', width: 54, height: 54, borderRadius: 14, borderWidth: 2, borderColor: '#ffffff55' },
  spinner: { marginTop: 20 },
  title: { fontSize: 24, fontWeight: '600', textAlign: 'center' },
  label: { fontSize: 16, marginTop: 12, textAlign: 'center' },
  retry: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }
});
