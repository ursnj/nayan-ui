// Everything an engine game's screen does besides its own HUD, in one hook: makes the game once and
// disposes it on leave, follows the theme, keeps the phase and result, mirrors the world's scoreboard
// (score, seconds, lives) into React, plays each game event's sound and haptic with the current
// settings, reports each game exactly once (win / lose when it ends, cancel on Stop or on leaving
// mid-game), and hands back the props EngineGameScreen needs.
//
//   const { board, theme, status, screen, gameOver } = useEngineGame(props, {
//     gameId: GAME_IDS.MY_GAME, create: createGame, start, reset, setTheme,
//     events: { hit: { sound: SOUNDS.HIT, haptic: HapticType.LIGHT } } // g.onEvent('hit')
//   });
//   return <EngineGameScreen {...screen} columns={[scoreColumn(board.score)]} gameOver={gameOver({ title: ... })} />;
//
// The world is stepped every frame and disposed on leave without the game saying so: `tick` is only
// for the game's own per-frame work (it isn't called once the world is disposed).
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Camera, DragEvent, World } from '@nayan-ui/engine';
import { type HapticType, playHaptic } from '../../services/HapticsService';
import { playSound, preloadGameSounds, preloadSounds, type SoundConfig, stopAllSounds } from '../../services/SoundsService';
import { type GameTheme, resolveGameTheme } from '../../services/ThemeService';
import type { GameProps } from '../../services/UtilsService';
import type { EngineGameScreenProps } from './EngineGameScreen';
import type { EngineHud, GameOverCard, HudFeedback } from './EngineHud';
import { useGameResource } from './useGameResource';
import { useLiveState } from './useLiveState';

/** Where a run is: before Start, running, or ended (the game-over card is up). */
export type GamePhase = 'ready' | 'playing' | 'over';
type Phase = GamePhase;
/** How an ended game came out; a draw is reported as a cancel. */
type GameResult = 'win' | 'lose' | 'draw';

/** What every engine game's state exposes to its screen. */
type EngineGameModel = {
  world: World | null;
  camera: Camera;
  score?: number;
  phase: Phase;
  won?: boolean;
  onPhase: (phase: Phase) => void;
  hudFeedback?: HudFeedback;
};

/** Plays a sound and/or a haptic, each only if the player has it switched on. */
export type Feedback = (sound?: SoundConfig | null, haptic?: HapticType | null) => void;

/** What a game event plays. */
type EventFeedback = { sound?: SoundConfig | null; haptic?: HapticType | null };

/** The events a game reports through `g.onEvent(event)`. */
type EventOf<G> = G extends { onEvent: (event: infer E) => void } ? E : never;

/** The world's scoreboard (kept in Rust), as the screen shows it. */
type BoardState = {
  score: number;
  /** Whole seconds shown: left on a countdown, elapsed otherwise. */
  seconds: number;
  lives: number;
};

type EngineGameSpec<G extends EngineGameModel> = {
  gameId: string;
  create: (theme: GameTheme) => G;
  start: (g: G) => void;
  reset: (g: G) => void;
  /** What Play Again does; `reset` by default. */
  replay?: (g: G) => void;
  /** Releases what the game holds besides its world (which is disposed after this). */
  dispose?: (g: G) => void;
  /** The game's own per-frame work. The world steps by itself right after (unless this stepped it). */
  tick?: (g: G, dt: number) => void;
  hud?: (g: G, hud: EngineHud) => void;
  setTheme?: (g: G, theme: GameTheme) => void;
  setActive?: (g: G, active: boolean) => void;
  resize?: (g: G, width: number, height: number, offset: number) => number | void;
  drag?: (g: G, e: DragEvent) => void;
  tap?: (g: G, x: number, y: number) => void;
  /** How an ended game came out (reported, and returned as `status`); from `g.won` by default. */
  outcome?: (g: G) => GameResult;
  /** The score reported with a result; `g.score` by default. */
  reportScore?: (g: G, status: 'win' | 'lose' | 'cancel') => number;
  /** Optional game-specific completion metrics, sampled at the same time as the final score. */
  reportData?: (g: G, status: 'win' | 'lose' | 'cancel') => Record<string, unknown>;
  /** Each `g.onEvent(event)`'s sound and haptic (wired before `wire`). */
  events?: { readonly [E in EventOf<G> & PropertyKey]?: EventFeedback };
  /** Hooks the game's events up to React state and feedback; called once. May return a cleanup, run on leaving. */
  wire?: (g: G, fx: Feedback) => void | (() => void);
  /** Cached ahead of the first sound. */
  sounds?: Record<string, SoundConfig>;
  /** Feedback on Start / Stop. */
  onStart?: (fx: Feedback) => void;
  onStop?: (fx: Feedback) => void;
  onPlayAgain?: (fx: Feedback) => void;
  /** Feedback as the game ends, beyond what its own events play. */
  onOver?: (fx: Feedback, status: GameResult, game: G) => void;
  /** Lets an ending play out (ms) before the game-over card covers it. */
  resultsDelay?: (status: GameResult) => number;
};

type ScreenProps = Pick<
  EngineGameScreenProps,
  | 'onActiveChange'
  | 'feedback'
  | 'gameId'
  | 'settings'
  | 'onSettingsChange'
  | 'onShare'
  | 'onShowLeaderboard'
  | 'bannerAd'
  | 'source'
  | 'camera'
  | 'onUpdate'
  | 'onResize'
  | 'onDrag'
  | 'onTap'
  | 'playing'
  | 'onStart'
  | 'onStop'
>;

export function useEngineGame<G extends EngineGameModel>(
  props: GameProps & { settings: NonNullable<GameProps['settings']> },
  spec: EngineGameSpec<G>
) {
  const { settings } = props;
  const theme = resolveGameTheme(settings.theme);
  // Live state: the result and the game-over card show the moment the game ends, however busy the frame loop is
  const [phase, setPhase] = useLiveState<Phase>('ready', 0);
  const [status, setStatus] = useLiveState<GameResult>('lose', 0);
  const [showResults, setShowResults] = useLiveState(false, 0);
  const [board, setBoard] = useLiveState<BoardState>(EMPTY_BOARD);

  // The latest props and spec, for the handlers made once below
  const latest = useRef({ props, spec });
  latest.current = { props, spec };

  const session = useGameResource(
    () => {
      const game = spec.create(theme);
      let reported = false;
      let disposed = false;
      const fx: Feedback = (sound, haptic) => {
        if (disposed || latest.current.props.settings.isVisible) return;
        const { enableSounds, enableHaptics } = latest.current.props.settings;
        if (sound) playSound(sound, enableSounds);
        if (haptic != null) playHaptic(haptic, enableHaptics);
      };
      const report = (status: 'win' | 'lose' | 'cancel') => {
        if (reported) return;
        reported = true;
        const score = latest.current.spec.reportScore?.(game, status) ?? game.score ?? 0;
        const additionalData = latest.current.spec.reportData?.(game, status);
        latest.current.props.onEndGame?.({ status, score: score.toString(), ...(additionalData ? { additionalData } : {}) });
      };
      // The result is set with the phase, so the card never shows the previous game's
      game.onPhase = (next) => {
        if (next === 'over') {
          const result = latest.current.spec.outcome?.(game) ?? (game.won ? 'win' : 'lose');
          setStatus(result);
          report(result === 'draw' ? 'cancel' : result);
          latest.current.spec.onOver?.(fx, result, game);
        }
        setPhase(next);
      };
      const s = () => latest.current.spec;
      const handlers = {
        onActiveChange: (active: boolean) => s().setActive?.(game, active),
        onUpdate: (dt: number, hud?: EngineHud) => {
          if (game.world?.isDisposed) return;
          s().tick?.(game, dt);
          if (hud) s().hud?.(game, hud);
        },
        onResize: (w: number, h: number, offset: number) => s().resize?.(game, w, h, offset),
        onDrag: (e: DragEvent) => s().drag?.(game, e),
        onTap: (x: number, y: number) => s().tap?.(game, x, y),
        onStart: () => {
          stopAllSounds();
          reported = false;
          s().start(game);
          s().onStart?.(fx);
        },
        onStop: () => {
          stopAllSounds();
          report('cancel');
          s().onStop?.(fx);
          s().reset(game);
        },
        playAgain: () => {
          stopAllSounds();
          reported = false;
          latest.current.props.onReplayGame?.();
          (s().replay ?? s().reset)(game);
          s().onPlayAgain?.(fx);
        }
      };
      return {
        game,
        fx,
        report,
        handlers,
        closeFeedback: () => {
          disposed = true;
          stopAllSounds();
        }
      };
    },
    (session) => {
      const { game, fx } = session;
      // Wire once; a real unmount reports cancellation and releases the native world.
      // Direct component consumers don't go through GameLoaders; warm their effects too.
      preloadGameSounds(spec.gameId);
      if (spec.sounds) preloadSounds(spec.sounds);
      const unlisten = followScoreboard(game.world, setBoard);
      const events = spec.events as Record<PropertyKey, EventFeedback | undefined> | undefined;
      if (events && 'onEvent' in game) {
        (game as { onEvent: (event: PropertyKey) => void }).onEvent = (event) => {
          const feedback = events[event];
          if (feedback) fx(feedback.sound, feedback.haptic);
        };
      }
      const cleanup = spec.wire?.(game, fx);
      return () => {
        session.closeFeedback();
        unlisten();
        cleanup?.();
        if (game.phase === 'playing') session.report('cancel');
        latest.current.spec.dispose?.(game);
        game.world?.dispose();
      };
    }
  );
  const { game, fx, handlers } = session;

  // create(theme) already applied the initial theme. Rebuilding it on mount used to
  // create and immediately destroy a second board in games without their own guard.
  const appliedTheme = useRef(theme);
  useLayoutEffect(() => {
    if (appliedTheme.current === theme) return;
    appliedTheme.current = theme;
    latest.current.spec.setTheme?.(game, theme);
  }, [game, theme]);

  // The card shows at once, or after the ending has played out
  useEffect(() => {
    if (phase !== 'over') return setShowResults(false);
    const delay = latest.current.spec.resultsDelay?.(status) ?? 0;
    if (!delay) return setShowResults(true);
    const t = setTimeout(() => setShowResults(true), delay);
    return () => clearTimeout(t);
  }, [phase, status, setShowResults]);

  const screen: ScreenProps = {
    gameId: spec.gameId,
    feedback: game.hudFeedback,
    onActiveChange: handlers.onActiveChange,
    settings,
    onSettingsChange: props.onSettingsChange,
    onShare: props.onShareScreenshot ?? props.onShare,
    onShowLeaderboard: props.onShowLeaderboard,
    bannerAd: props.bannerAd,
    source: game.world,
    camera: game.camera,
    onUpdate: handlers.onUpdate,
    onResize: spec.resize ? handlers.onResize : undefined,
    onDrag: spec.drag ? handlers.onDrag : undefined,
    onTap: spec.tap ? handlers.onTap : undefined,
    playing: phase === 'playing',
    onStart: handlers.onStart,
    onStop: handlers.onStop
  };

  /** The game-over card once it's due (Play Again and Share are filled in), else null. */
  const gameOver = (card: Omit<GameOverCard, 'onPlayAgain' | 'onShare'>): GameOverCard | null =>
    showResults ? { ...card, onPlayAgain: handlers.playAgain, onShare: props.onShareScreenshot } : null;

  return { game, theme, phase, status, board, fx, screen, gameOver };
}

const EMPTY_BOARD: BoardState = { score: 0, seconds: 0, lives: 0 };

/** Mirrors the world's scoreboard into `set` (at once, then on every change) until the returned call. */
function followScoreboard(world: World | null, set: (board: BoardState) => void): () => void {
  if (!world || world.isDisposed) return () => {};
  let scoreboard: World['scoreboard'];
  try {
    scoreboard = world.scoreboard;
  } catch {
    return () => {}; // a native core built before the scoreboard
  }
  const publish = () => set({ score: scoreboard.score, seconds: scoreboard.shownSeconds, lives: scoreboard.lives });
  publish();
  return scoreboard.listen({ onScore: publish, onSecond: publish, onLives: publish });
}
