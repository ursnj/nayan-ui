// The Playtura game screen for Nayan Game Engine games: the game's scene in a GameView, with Playtura's
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
import type { CSSProperties } from 'react';
import { isGameActive, subscribeGameActivity } from './GameLifecycle';
import { useElementSize } from './useElementSize';
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
const logStats = (
  s: { fps: number; updateMs: number; publishMs: number; renderMs: number; quality: string; backend: string },
  gameId: string,
  inPlay: boolean
) =>
  console.log(
    `[engine] ${s.fps.toFixed(0)} fps, update ${s.updateMs.toFixed(2)} ms, publish ${s.publishMs.toFixed(2)} ms, render ${s.renderMs.toFixed(2)} ms, ${s.quality}, ${s.backend}, ${inPlay ? 'playing' : 'idle'}, ${gameId}`
  );

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
    /** The game-over card, or null while there is none. */
    gameOver: GameOverCard | null;
    /** DOM elements over the scene (under the settings modal). */
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
  const [active, setActive] = useState(isGameActive);
  useEffect(() => subscribeGameActivity(() => setActive(isGameActive())), []);
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
  const [root, size] = useElementSize();
  const [bannerElement, bannerSize] = useElementSize();
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
  // Update HUD hit targets and labels in the same commit as the run's phase.
  useLayoutEffect(() => hud.setPlaying(playing, subtext), [hud, playing, subtext]);

  // The game-over card: redrawn when what it shows changes (its callbacks are read when pressed). Only
  // its banner ad is a DOM element, placed in the room the card leaves for it.
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
  useEffect(() => {
    if (!bannerSize) return;
    hud.setGameOverReserve(bannerSize.height);
    setBanner(hud.gameOverBanner);
  }, [hud, bannerSize]);
  const isOver = gameOver !== null;

  return (
    <div ref={root} style={{ ...styles.root, backgroundColor: theme.BACKGROUND, pointerEvents: settings.paused ? 'none' : 'auto' }}>
      {source ? (
        <GameView
          {...scene}
          // Settings keep drawing a frozen world so its theme can update while the panel stays open.
          paused={scene.paused || !!errorMessage || (settings.paused && playing) || !active}
          source={source}
          qualityKey={gameId}
          // Quality adapts to the game in play, not to the ready screen or results card over it
          adaptQuality={playing && !isOver}
          background={backgroundProp ?? theme.BACKGROUND}
          onUpdate={update}
          overlay={hud.world}
          onOverlayTouch={hud.touch}
          onPrimaryAction={() => hud.activatePrimary()}
          onStats={__DEV__ ? (stats) => logStats(stats, gameId, playing && !isOver) : undefined}
        />
      ) : null}
      {isOver ? null : children}
      {errorMessage && (
        <div style={{ ...styles.error, pointerEvents: 'none' }}>
          <p role="alert" style={{ color: theme.TEXT }}>
            {errorMessage}
          </p>
        </div>
      )}
      {isOver && bannerAd && banner ? (
        <div
          style={{ ...styles.banner, top: banner.top, width: banner.width, left: ((size?.width ?? 0) - banner.width) / 2 }}>
          <div ref={bannerElement}>{bannerAd}</div>
        </div>
      ) : null}
      <GameSettingsModal gameId={gameId} settings={settings} onSettingsChange={onSettingsChange} />
    </div>
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
        <div style={styles.root}>
          <GameLoadingTransition
            ready={isEngineAvailable && ready}
            loader={
              <GameLoading
                gameId={id}
                theme={settings.theme}
                offset={settings.offset}
                visible={!settings.isVisible}
                error={!!failure || !isEngineAvailable}
                message={failure ?? (!isEngineAvailable ? 'This game needs the Nayan Game Engine, which is not available in this build.' : undefined)}
              />
            }>
            <GamePlayingContext.Provider value={props.onPlayingChange}>
              <Game {...props} settings={settings} />
            </GamePlayingContext.Provider>
          </GameLoadingTransition>
        </div>
      </GameThemeProvider>
    );
  });
  Component.displayName = GAMES_METADATA[id].title;
  return Component;
}

const styles = {
  root: { position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 },
  error: { position: 'absolute', top: '45%', alignSelf: 'center', padding: 24 },
  banner: { position: 'absolute', display: 'flex', alignItems: 'center', overflow: 'hidden', borderRadius: 10 }
} satisfies Record<string, CSSProperties>;
