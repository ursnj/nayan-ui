// Car Racing's screen, on the Nayan engine (@nayan-ui/engine): loads the assets, builds a run, and draws
// Playtura's scoreboard, controls and modals over the 3D view. The rules are in CarRacingGame.ts, what
// it draws in CarRacingScene.ts, tuning and assets in CarRacingConstants.ts.
//
// The engine runs the simulation (physics, particles, audio, haptics) in its Rust core; GameView's
// `onUpdate` advances the shared engine simulation and HUD once per frame.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type DragEvent, haptics } from '@nayan-ui/engine';
import { resolveGameTheme } from '../../services/ThemeService';
import { GAME_IDS, type GameProps } from '../../services/UtilsService';
import { engineGame, EngineGameScreen } from '../shared/EngineGameScreen';
import { livesColumn, scoreColumn, textColumn } from '../shared/EngineHud';
import { GameLoading } from '../shared/GameLoading';
import { GameLoadingTransition } from '../shared/GameLoadingTransition';
import { useGameResource } from '../shared/useGameResource';
import {
  type Assets,
  AUTOPLAY,
  DAY_LIGHT,
  EDGE,
  getCachedAssets,
  LIVES,
  loadAssets,
  NIGHT_LIGHT,
  NIGHT_SKY,
  SKY,
  STEER_WIDTH,
  TRACK_LENGTH
} from './CarRacingConstants';
import { createGame, dispose, type Phase, setAudible, setNight, start, steer, tick } from './CarRacingGame';

export { preloadRacing as preloadCarRacing } from './CarRacingConstants';

const RESULTS_DELAY = 1200; // ms: the crash (or the finish) is seen before the modal covers it

type RunProps = GameProps & { assets: Assets; night: boolean; onRestart: () => void };

/** One run, from the start screen to the results. Restarting mounts a new one. */
const Run = React.memo(
  ({
    assets,
    night,
    onRestart,
    settings,
    onSettingsChange,
    onEndGame,
    onReplayGame,
    onShare,
    onShareScreenshot,
    onShowLeaderboard,
    bannerAd
  }: RunProps) => {
    const initialNight = useRef(night);
    const game = useGameResource(
      () => createGame(assets, initialNight.current),
      (value) => () => {
        if (value.phase === 'playing') reportGameEnd('cancel');
        dispose(value);
      }
    );
    useEffect(() => {
      setNight(game, night);
    }, [game, night]);
    const width = useRef(1);
    const [phase, setPhase] = useState<Phase>('ready');
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(LIVES);
    const [left, setLeft] = useState(TRACK_LENGTH);
    // Report each run once: win on crossing the finish line, lose on the last crash, cancel on stop.
    const gameReportedRef = useRef(false);
    const onEndGameRef = useRef(onEndGame);
    onEndGameRef.current = onEndGame;
    const reportGameEnd = useCallback(
      (status: 'win' | 'lose' | 'cancel') => {
        if (!onEndGameRef.current || gameReportedRef.current) return;
        gameReportedRef.current = true;
        onEndGameRef.current({ status, score: game.score.toString() });
      },
      [game]
    );

    useEffect(() => {
      haptics.enabled = settings.enableHaptics;
    }, [settings.enableHaptics]);

    useEffect(() => {
      game.onPhase = setPhase;
      game.onLives = setLives;
      game.onDistance = setLeft;
      game.onScore = setScore;
    }, [game]);

    // Game over detection, in its own effect.
    useEffect(() => {
      if (phase !== 'over') return;
      reportGameEnd(game.lives > 0 ? 'win' : 'lose');
      const t = setTimeout(() => setShowResults(true), RESULTS_DELAY);
      return () => clearTimeout(t);
    }, [phase, game, reportGameEnd]);

    // Autoplay (EXPO_PUBLIC_AUTOPLAY=1): start by itself and restart after a pause.
    useEffect(() => {
      if (!AUTOPLAY || phase === 'playing') return;
      const t = setTimeout(phase === 'ready' ? () => start(game) : onRestart, phase === 'ready' ? 1500 : 3000);
      return () => clearTimeout(t);
    }, [phase, game, onRestart]);

    const onAudioChange = useCallback((audible: boolean) => setAudible(game, audible), [game]);
    const onUpdate = useCallback((dt: number) => tick(game, dt), [game]);

    // Relative steering: wherever the swipe starts, the car moves by how far the finger moves.
    const onDrag = useCallback(({ phase: touch, dx }: DragEvent) => steer(game, touch, dx, (2 * EDGE) / (STEER_WIDTH * width.current)), [game]);

    const handleStartGame = useCallback(() => {
      gameReportedRef.current = false;
      start(game);
    }, [game]);

    // Report before resetting, then a fresh run.
    const handleStopGame = useCallback(() => {
      reportGameEnd('cancel');
      onRestart();
    }, [reportGameEnd, onRestart]);

    const handleResetGame = useCallback(() => {
      onReplayGame?.();
      onRestart();
    }, [onReplayGame, onRestart]);

    const won = lives > 0;
    return (
      <EngineGameScreen
        onAudioChange={onAudioChange}
        gameId={GAME_IDS.CAR_RACING}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onShare={onShareScreenshot ?? onShare}
        onShowLeaderboard={onShowLeaderboard}
        bannerAd={bannerAd}
        source={game.world}
        feedback={game.hudFeedback}
        camera={game.camera}
        light={night ? NIGHT_LIGHT : DAY_LIGHT}
        background={night ? NIGHT_SKY : SKY}
        fog={0.0075}
        onUpdate={onUpdate}
        onDrag={onDrag}
        onResize={(value) => {
          width.current = value;
        }}
        columns={[scoreColumn(score), livesColumn(lives, LIVES), textColumn('TRACK', `${left} m`)]}
        playing={phase === 'playing'}
        subtext="Dodge traffic to score!"
        onStart={handleStartGame}
        onStop={handleStopGame}
        gameOver={
          showResults
            ? {
                title: won ? 'FINISHED!' : 'CRASHED!',
                message: won
                  ? `You crossed the finish line! Great driving!`
                  : `Out of lives ${TRACK_LENGTH - left} m into the ${TRACK_LENGTH} m race.`,
                scoreLabel: 'Final Score',
                score,
                buttonText: 'Race Again!',
                onPlayAgain: handleResetGame,
                onShare: onShareScreenshot
              }
            : null
        }
      />
    );
  }
);

Run.displayName = 'CarRacingRun';

export const CarRacing = engineGame(GAME_IDS.CAR_RACING, (props) => {
  const settings = props.settings;
  const theme = resolveGameTheme(settings.theme);
  const [run, setRun] = useState(0);
  const [assets, setAssets] = useState<Assets | null>(getCachedAssets);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assets) return;
    let alive = true;
    // Sounds don't hold up the scene: plays before they're decoded are skipped.
    loadAssets()
      .then((a) => alive && setAssets(a))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [assets]);

  const restart = useCallback(() => setRun((r) => r + 1), []);

  // Host theme changes repaint the existing race without resetting score or positions.
  const night = theme.isDark;
  return (
    <GameLoadingTransition
      ready={!!assets}
      loader={
        <GameLoading gameId={GAME_IDS.CAR_RACING} theme={settings.theme} offset={settings.offset} error={!!error} message={error ?? undefined} />
      }>
      {assets && <Run key={run} {...props} settings={settings} assets={assets} night={night} onRestart={restart} />}
    </GameLoadingTransition>
  );
});
