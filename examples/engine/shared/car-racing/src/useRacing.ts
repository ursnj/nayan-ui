import { useCallback, useEffect, useRef, useState } from "react";
import { audio, warmUpEngine, type DragEvent } from "@nayan-ui/engine";
import {
  EDGE,
  TRACK_LENGTH,
  LATERAL_SPEED,
  LIVES,
  STEER_WIDTH,
  loadAssets,
  type AssetSources,
} from "./config";
import {
  createGame,
  dispose,
  setAudible,
  setNight,
  session,
  start,
  steer,
  tick,
  type Game,
  type Phase,
} from "./game";

/** Both hosts own their UI; loading, runs, input and cleanup stay shared. */
export function useRacing(sources: AssetSources, initialDark: boolean | (() => boolean) = false) {
  const [dark, setDark] = useState(initialDark);
  const mode = useRef(dark);
  mode.current = dark;
  const [game, setGame] = useState<Game | null>(null);
  const [run, setRun] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [left, setLeft] = useState(TRACK_LENGTH);
  const [nearMiss, setNearMiss] = useState(false);
  const [flash, setFlash] = useState(false);
  const [paused, setPaused] = useState(false);
  const [refreshingTheme, setRefreshingTheme] = useState(false);
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
    setLeft(TRACK_LENGTH);
    setNearMiss(false);
    setFlash(false);
    setPaused(false);
    input.current = 0;
    void warmUpEngine()
      .then(() => loadAssets(sources))
      .then((assets) => {
        if (!alive) return;
        current = createGame(assets, mode.current);
        current.onPhase = setPhase;
        current.onScore = setScore;
        current.onLives = setLives;
        current.onDistance = setLeft;
        current.onNearMiss = () => setNearMiss(true);
        current.onFlash = () => setFlash(true);
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
    if (!game) {
      setRefreshingTheme(false);
      return;
    }
    setNight(game, dark);
    // Refresh instance buffers without advancing the simulation. A paused renderer draws the
    // new lighting briefly, then suspends again; the race and audio remain paused throughout.
    game.world.update(0);
    setRefreshingTheme(paused);
    if (!paused) return;
    const timeout = setTimeout(() => setRefreshingTheme(false), 150);
    return () => clearTimeout(timeout);
  }, [game, dark, paused]);

  useEffect(() => {
    if (!game) return;
    audio.muted = muted || paused;
    setAudible(game, !muted && !paused);
    if (paused) input.current = 0;
    return () => {
      setAudible(game, false);
      audio.muted = false;
    };
  }, [game, muted, paused]);

  useEffect(() => {
    if (!nearMiss) return;
    const timeout = setTimeout(() => setNearMiss(false), 900);
    return () => clearTimeout(timeout);
  }, [nearMiss]);
  useEffect(() => {
    if (!flash) return;
    const timeout = setTimeout(() => setFlash(false), 400);
    return () => clearTimeout(timeout);
  }, [flash]);

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
    left,
    nearMiss,
    flash,
    paused,
    renderPaused: paused && !refreshingTheme,
    muted,
    dark,
    toggleMode: () => setDark((value) => !value),
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
