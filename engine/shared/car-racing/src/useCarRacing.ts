import { useCallback, useEffect, useRef, useState } from 'react';
import { audio, useWorld, type DragEvent } from '@nayan-ui/engine';
import { CAPACITY, LIVES, TRACK_LENGTH, loadAssets, type AssetSources, type Assets } from './CarRacingConstants';
import { createGame, type Game, type Phase } from './CarRacingGame';

/** The race for one screen: assets, the world (via useWorld), HUD state and input. Both hosts share it. */
export function useCarRacing(sources: AssetSources) {
  const [assets, setAssets] = useState<Assets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [left, setLeft] = useState(TRACK_LENGTH);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let active = true;
    loadAssets(sources).then(
      (loaded) => active && setAssets(loaded),
      (e: unknown) => active && setError(e instanceof Error ? e.message : String(e))
    );
    return () => {
      active = false;
    };
  }, [sources]);

  // useWorld warms the engine up, creates the world, runs this setup and disposes it on unmount.
  const world = useWorld(
    CAPACITY,
    (w) => {
      if (!assets) return;
      const g = createGame(w, assets, setPhase, setLeft);
      const unlisten = w.scoreboard.listen({ onScore: setScore, onLives: setLives });
      setGame(g);
      return () => {
        unlisten();
        g.dispose();
        setGame(null);
      };
    },
    [assets],
    (e) => setError(e.message)
  );

  // Once the game exists the engine is warm (the browser's core rejects audio calls before that).
  useEffect(() => {
    if (game) audio.enabled = !muted;
  }, [game, muted]);

  // Leaving a race mid-way (pause) stops the steering keys.
  useEffect(() => {
    if (paused && game) game.keys = 0;
  }, [paused, game]);

  const dragFrom = useRef(0);
  const drag = useCallback(
    (event: DragEvent, viewWidth: number) => {
      if (!game || game.phase !== 'playing') return;
      if (event.phase === 'start') dragFrom.current = game.target;
      game.drag(dragFrom.current, event.dx / Math.max(1, viewWidth));
    },
    [game]
  );

  return {
    world: game ? world : null,
    game,
    error,
    phase,
    score,
    lives,
    left,
    paused,
    muted,
    update: useCallback((dt: number) => game?.tick(dt), [game]),
    drag,
    steer: (direction: number) => {
      if (game) game.keys = direction;
    },
    start: () => {
      setPaused(false);
      game?.start();
    },
    setPaused,
    toggleMute: () => setMuted((value) => !value)
  };
}
