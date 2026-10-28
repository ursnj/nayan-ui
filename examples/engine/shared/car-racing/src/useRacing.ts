import { useCallback, useEffect, useRef, useState } from "react";
import { audio, warmUpEngine, type DragEvent } from "@nayan-ui/engine";
import {
  EDGE,
  GAME_DURATION,
  LATERAL_SPEED,
  LIVES,
  STEER_WIDTH,
  loadAssets,
  type AssetSources,
} from "./config";
import { createGame, dispose, session, start, steer, tick, type Game, type Phase } from "./game";

/** Both hosts own their UI; loading, runs, input and cleanup stay shared. */
export function useRacing(sources: AssetSources) {
  const [game, setGame] = useState<Game | null>(null);
  const [run, setRun] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [time, setTime] = useState(GAME_DURATION);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const input = useRef(0);

  useEffect(() => {
    let alive = true;
    let current: Game | undefined;
    setGame(null);
    setError(null);
    setPhase("ready");
    setScore(0);
    setLives(LIVES);
    setTime(GAME_DURATION);
    setPaused(false);
    input.current = 0;
    void warmUpEngine()
      .then(() => loadAssets(sources))
      .then((assets) => {
        if (!alive) return;
        current = createGame(assets, false);
        current.onPhase = setPhase;
        current.onScore = setScore;
        current.onLives = setLives;
        current.onTime = setTime;
        setGame(current);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
      if (current) dispose(current);
    };
  }, [sources, run]);

  useEffect(() => {
    if (!game) return;
    audio.muted = muted || paused;
    if (paused) input.current = 0;
    return () => {
      audio.muted = false;
    };
  }, [game, muted, paused]);

  const update = useCallback(
    (dt: number) => {
      if (!game || paused) return;
      const step = Math.max(0, Math.min(dt, 0.05));
      if (game.phase === "playing" && input.current) {
        game.target = Math.max(
          -EDGE,
          Math.min(EDGE, game.target + input.current * LATERAL_SPEED * step),
        );
      }
      tick(game, step);
    },
    [game, paused],
  );
  const drag = useCallback(
    (event: DragEvent, width: number) => {
      if (game && !paused && game.phase === "playing") {
        steer(game, event.phase, event.dx, (2 * EDGE) / (STEER_WIDTH * Math.max(1, width)));
      }
    },
    [game, paused],
  );
  return {
    game,
    error,
    reportError: (error: Error) => {
      setError(error.message);
      setPaused(true);
    },
    phase,
    score,
    lives,
    time,
    paused,
    muted,
    input,
    update,
    drag,
    best: session.best,
    start: () => {
      if (game) start(game);
    },
    restart: () => setRun((value) => value + 1),
    setPaused,
    toggleMute: () => setMuted((value) => !value),
  };
}
