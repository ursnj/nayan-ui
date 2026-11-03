// The Playtura game screen for Nayan engine games: the game's scene in a GameView, with Playtura's
// scoreboard, start/stop controls and game-over card drawn by the engine (EngineHud) as its overlay,
// the game-over banner ad and the settings modal. A game supplies its scene and what the HUD shows:
//
//   export const MyGame = engineGame(GAME_IDS.MY_GAME, (props) => {
//     ...
//     return <EngineGameScreen gameId={...} settings={props.settings} source={game.world} camera={game.camera}
//       columns={[{ label: 'SCORE', value: '120' }]} playing={isPlaying} onStart={...} onStop={...}
//       gameOver={isOver ? { title: 'YOU WON!', ... } : null} />;
//   });
import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, BackHandler, type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { audio, GameView, isEngineAvailable, warmUpEngine, World } from '@nayan-ui/engine';
import { GameSettingsModal, GameThemeProvider } from '../../helpers';
import { GAMES_METADATA } from '../../services/GamesMetadata';
import { GAME_SOUNDS, playSound, preloadSounds, stopAllSounds } from '../../services/SoundsService';
import { resolveGameTheme } from '../../services/ThemeService';
import { DEFAULT_GAME_SETTINGS, type GAME_IDS, type GameProps } from '../../services/UtilsService';
import { EngineHud, type GameOverCard, type HudChoice, type HudColumn, type HudFeedback } from './EngineHud';
import { EngineReadyContext } from './EngineReadyContext';
import { GamePlayingContext, useGamePlaying } from './GameActivity';
import { GameLoading } from './GameLoading';
import { GameLoadingTransition } from './GameLoadingTransition';
import { useGameResource } from './useGameResource';

let soundOwner: object | undefined;

/** Dev builds: once a second, where the frame time goes (JS update vs native render). */
const logStats = (s: { fps: number; updateMs: number; renderMs: number; quality: string; backend: string }) =>
  console.log(`[engine] ${s.fps.toFixed(0)} fps, update ${s.updateMs.toFixed(2)} ms, render ${s.renderMs.toFixed(2)} ms, ${s.quality}, ${s.backend}`);

/** Everything GameView takes, but the HUD's overlay and the frame hooks this screen owns. */
type SceneProps = Omit<React.ComponentProps<typeof GameView>, 'overlay' | 'onOverlayTouch' | 'onUpdate' | 'onStats' | 'background' | 'source'> & {
  /** What to draw; null until the game has made its world (the view waits for it). */
  source: React.ComponentProps<typeof GameView>['source'] | null;
  /** The clear color; the theme's background by default. */
  background?: React.ComponentProps<typeof GameView>['background'];
};

export type EngineGameScreenProps = SceneProps &
  Pick<GameProps, 'settings' | 'onSettingsChange' | 'onShare' | 'onShowLeaderboard' | 'bannerAd'> & {
    gameId: string;
    /** Reserve overlay entities for dense engine-drawn interfaces. */
    hudCapacity?: number;
    /** Host fallback when the rendering surface reports an error. */
    errorMessage?: string;
    /** Transient game feedback rendered and animated by the engine HUD. */
    feedback?: HudFeedback;
    choices?: HudChoice[];
    /** Suspend/resume a game-owned audio loop with app activity, pause and sound settings. */
    onAudioChange?: (audible: boolean) => void;
    onActiveChange?: (active: boolean) => void;
    /** Called every frame before the HUD animates (the game's tick). */
    onUpdate?: (dt: number, hud: EngineHud) => void;
    /** The view's size and the header offset, whenever they change: lay the scene out for them. */
    onResize?: (width: number, height: number, offset: number) => number | void;
    /** The scoreboard's columns. */
    columns: HudColumn[];
    playing: boolean;
    /** The line under the controls while playing. */
    subtext?: string;
    onStart: () => void;
    onStop: () => void;
    /** The game-over card, or null while there's none. Android back plays again on it. */
    gameOver: GameOverCard | null;
    /** React Native views over the scene (under the settings modal). */
    children?: React.ReactNode;
  };

export const EngineGameScreen: React.FC<EngineGameScreenProps> = ({
  gameId,
  hudCapacity,
  errorMessage,
  feedback,
  choices,
  onAudioChange,
  onActiveChange,
  settings = DEFAULT_GAME_SETTINGS,
  onSettingsChange,
  onShare,
  onShowLeaderboard,
  bannerAd,
  background: backgroundProp,
  onUpdate,
  onResize,
  columns,
  playing,
  subtext,
  onStart,
  onStop,
  gameOver,
  children,
  source,
  ...scene
}) => {
  useGamePlaying(playing);
  const theme = resolveGameTheme(settings.theme);
  const offset = settings.offset ?? 0;
  useEffect(() => preloadSounds([GAME_SOUNDS.STOP, GAME_SOUNDS.RESET]), []);
  const soundKey = useRef({}).current;
  const [active, setActive] = useState(() => AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  const running = active && !settings.isVisible && !settings.paused && !scene.paused && !errorMessage;
  useEffect(() => {
    onActiveChange?.(running);
  }, [running, onActiveChange]);
  const audible = running && settings.enableSounds;
  useEffect(() => {
    soundOwner = soundKey;
    audio.muted = !audible;
    if (!audible) stopAllSounds();
    onAudioChange?.(audible);
    return () => {
      onAudioChange?.(false);
      if (soundOwner === soundKey) {
        stopAllSounds();
        audio.muted = false;
        soundOwner = undefined;
      }
    };
  }, [audible, onAudioChange, soundKey]);
  const hud = useGameResource(
    () => new EngineHud(theme, hudCapacity),
    (value) => () => value.dispose()
  );
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  useEffect(() => {
    if (!size) return;
    onResizeRef.current?.(size.width, size.height, offset);
    hud.layout(size.width, size.height, offset);
  }, [hud, size, offset]);

  useLayoutEffect(() => hud.setTheme(theme), [hud, theme]);
  useEffect(() => hud.setChoices(choices ?? []), [hud, choices]);

  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const update = useCallback(
    (dt: number) => {
      if (settings.isVisible) {
        // Settings repaint immediately, including theme changes, without advancing gameplay or the HUD clock.
        if (source instanceof World) source.update(0);
        hud.update(0);
        return;
      }
      onUpdateRef.current?.(dt, hud);
      hud.update(dt, feedbackRef.current);
    },
    [hud, source, settings.isVisible]
  );

  // The scoreboard and controls; only changed values are redrawn.
  hud.setActions({
    onStart: () => {
      stopAllSounds();
      onStart();
    },
    onStop: () => {
      stopAllSounds();
      onStop();
      playSound(GAME_SOUNDS.STOP, settings.enableSounds);
    },
    onShare,
    onShowLeaderboard
  });
  const columnsKey = columns.map((c) => [c.label, c.value, c.color, c.valueColor, c.lives?.count, c.lives?.max].join('\u0000')).join('\u0001');
  useEffect(() => hud.setColumns(columns), [hud, columnsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // Update native hit targets and labels in the same commit as the run's phase.
  useLayoutEffect(() => hud.setPlaying(playing, subtext), [hud, playing, subtext]);

  // The game-over card: redrawn when what it shows changes (its callbacks are read when pressed). Only
  // its banner ad is a React Native view, placed in the room the card leaves for it.
  const soundEnabled = useRef(settings.enableSounds);
  soundEnabled.current = settings.enableSounds;
  const cardRef = useRef(gameOver);
  cardRef.current = gameOver;
  const cardKey = gameOver
    ? [gameOver.title, gameOver.message, gameOver.scoreLabel, gameOver.score, gameOver.buttonText, !!gameOver.onShare].join('\u0000')
    : null;
  const [banner, setBanner] = useState<{ top: number; width: number } | null>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      hud.hideGameOver();
      setBanner(null);
      return;
    }
    hud.showGameOver({
      ...card,
      onPlayAgain: () => {
        stopAllSounds();
        cardRef.current?.onPlayAgain();
        playSound(GAME_SOUNDS.RESET, soundEnabled.current);
      },
      onShare: card.onShare ? () => cardRef.current?.onShare?.() : undefined
    });
    setBanner(hud.gameOverBanner);
  }, [hud, cardKey, size, theme]);
  const onBannerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      hud.setGameOverReserve(e.nativeEvent.layout.height);
      setBanner(hud.gameOverBanner);
    },
    [hud]
  );
  // Android back on the card plays again, as the modal's onRequestClose did.
  const isOver = gameOver !== null;
  useEffect(() => {
    if (!isOver) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cardRef.current?.onPlayAgain();
      return true;
    });
    return () => sub.remove();
  }, [isOver]);

  return (
    <View pointerEvents={settings.paused ? 'none' : 'auto'} style={[styles.root, { backgroundColor: theme.BACKGROUND }]} onLayout={onLayout}>
      {source ? (
        <GameView
          {...scene}
          // Settings keep drawing a frozen world so its theme can update while the panel stays open.
          paused={scene.paused || !!errorMessage || (settings.paused && playing) || !active}
          source={source}
          background={backgroundProp ?? theme.BACKGROUND}
          onUpdate={update}
          overlay={hud.world}
          onOverlayTouch={hud.touch}
          onPrimaryAction={() => hud.activatePrimary()}
          onStats={__DEV__ ? logStats : undefined}
        />
      ) : null}
      {isOver ? null : children}
      {errorMessage && (
        <View pointerEvents="none" style={styles.error}>
          <Text accessibilityRole="alert" style={{ color: theme.TEXT }}>
            {errorMessage}
          </Text>
        </View>
      )}
      {isOver && bannerAd && banner ? (
        <View
          pointerEvents="box-none"
          style={[styles.banner, { top: banner.top, width: banner.width, left: ((size?.width ?? 0) - banner.width) / 2 }]}>
          <View onLayout={onBannerLayout}>{bannerAd}</View>
        </View>
      ) : null}
      <GameSettingsModal gameId={gameId} settings={settings} onSettingsChange={onSettingsChange} />
    </View>
  );
};

/**
 * Makes an engine game's component: memoised, with default settings, inside the game theme and a
 * container and the selected game's loader while the engine warms up.
 */
export function engineGame(id: GAME_IDS, Game: React.FC<GameProps & { settings: NonNullable<GameProps['settings']> }>): React.FC<GameProps> {
  const Component: React.FC<GameProps> = React.memo((props) => {
    const assetsReady = useContext(EngineReadyContext);
    const [ready, setReady] = useState(assetsReady);
    const [failure, setFailure] = useState<string | null>(null);
    useEffect(() => {
      if (!isEngineAvailable || assetsReady) return;
      let mounted = true;
      warmUpEngine().then(
        () => {
          if (mounted) setReady(true);
        },
        (error: unknown) => {
          if (mounted) setFailure(error instanceof Error ? error.message : String(error));
        }
      );
      return () => {
        mounted = false;
      };
    }, [assetsReady]);
    const settings = props.settings ?? DEFAULT_GAME_SETTINGS;
    return (
      <GameThemeProvider theme={settings.theme}>
        <View style={styles.root}>
          <GameLoadingTransition
            ready={isEngineAvailable && ready}
            loader={
              <GameLoading
                gameId={id}
                theme={settings.theme}
                offset={settings.offset}
                visible={!settings.isVisible}
                error={!!failure || !isEngineAvailable}
                message={failure ?? (!isEngineAvailable ? 'This game needs the Nayan engine, which is not available in this build.' : undefined)}
              />
            }>
            <GamePlayingContext.Provider value={props.onPlayingChange}>
              <Game {...props} settings={settings} />
            </GamePlayingContext.Provider>
          </GameLoadingTransition>
        </View>
      </GameThemeProvider>
    );
  });
  Component.displayName = GAMES_METADATA[id].title;
  return Component;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { position: 'absolute', top: '45%', alignSelf: 'center', padding: 24 },
  banner: { position: 'absolute', alignItems: 'center', overflow: 'hidden', borderRadius: 10 }
});
