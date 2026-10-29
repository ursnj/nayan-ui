import { useEffect, useRef } from "react";
import { GameView } from "@nayan-ui/engine";
import {
  DAY_LIGHT,
  NIGHT_LIGHT,
  SKY,
  NIGHT_SKY,
  TRACK_LENGTH,
  useRacing,
} from "@nayan-engine-example/shared/car-racing";
import { sources } from "./assets";
import "./style.css";

function initialDark() {
  try {
    const saved = localStorage.getItem("nayan-car-racing-theme");
    if (saved === "dark" || saved === "light") return saved === "dark";
  } catch {
    /* Private browsing can disable storage. */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function CarRacing() {
  const racing = useRacing(sources, initialDark);
  const { game, phase, paused, input, setPaused } = racing;
  const surface = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem("nayan-car-racing-theme", racing.dark ? "dark" : "light");
    } catch {
      /* The toggle still works without storage. */
    }
  }, [racing.dark]);
  useEffect(() => {
    const keys = new Set<string>();
    const key = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) return;
      event.preventDefault();
      const code = event.key.toLowerCase();
      if (event.type === "keydown") keys.add(code);
      else keys.delete(code);
      input.current =
        Number(keys.has("arrowright") || keys.has("d")) -
        Number(keys.has("arrowleft") || keys.has("a"));
    };
    const blur = () => {
      keys.clear();
      input.current = 0;
      if (phase === "playing") setPaused(true);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("blur", blur);
      input.current = 0;
    };
  }, [phase, input, setPaused]);
  return (
    <div
      className="racing-screen h-dvh w-full overflow-hidden"
      data-theme={racing.dark ? "dark" : "light"}
    >
      <main ref={surface} className="race-scene relative flex h-full w-full">
        {game && (
          <GameView
            source={game.world}
            camera={game.camera}
            light={racing.dark ? NIGHT_LIGHT : DAY_LIGHT}
            background={racing.dark ? NIGHT_SKY : SKY}
            fog={0.0075}
            quality="medium"
            paused={racing.renderPaused}
            onError={racing.reportError}
            onUpdate={racing.update}
            onDrag={(event) => racing.drag(event, surface.current?.clientWidth ?? 1)}
          />
        )}
        <div className="hud" aria-label="Race statistics">
          <div className="race-stats">
            <div className="stat score-stat">
              <span>SCORE</span>
              <strong>{racing.score.toLocaleString()}</strong>
            </div>
            <div className="stat lives-stat">
              <span>LIVES</span>
              <div className="hearts" aria-label={`${racing.lives} of 3 lives`}>
                {[0, 1, 2].map((life) => (
                  <svg
                    key={life}
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className={life < racing.lives ? "heart filled" : "heart"}
                  >
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="stat distance-stat">
              <span>TRACK LEFT</span>
              <strong>
                {racing.left.toLocaleString()} <small>m</small>
              </strong>
            </div>
          </div>
          <div className="race-actions">
            <button
              className="hud-action"
              onClick={racing.toggleMode}
              aria-label={racing.dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={racing.dark}
              title={racing.dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                {racing.dark ? (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                  </>
                ) : (
                  <path d="M20.5 13.4A8.5 8.5 0 0 1 10.6 3.5 8.5 8.5 0 1 0 20.5 13.4Z" />
                )}
              </svg>
              <span>{racing.dark ? "Light mode" : "Dark mode"}</span>
            </button>
            <button
              className="hud-action"
              onClick={racing.toggleMute}
              aria-label={racing.muted ? "Sound off" : "Sound on"}
              aria-pressed={!racing.muted}
              title={racing.muted ? "Turn sound on" : "Turn sound off"}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                {racing.muted ? (
                  <path d="m16 9 6 6m0-6-6 6" />
                ) : (
                  <>
                    <path d="M15 8a6 6 0 0 1 0 8" />
                    <path d="M18 5a10 10 0 0 1 0 14" />
                  </>
                )}
              </svg>
              <span>{racing.muted ? "Sound off" : "Sound on"}</span>
            </button>
            {phase === "playing" && (
              <button
                className="hud-action"
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Resume" : "Pause"}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  {paused ? (
                    <path d="m8 4 12 8-12 8V4Z" />
                  ) : (
                    <>
                      <path d="M8 5v14" />
                      <path d="M16 5v14" />
                    </>
                  )}
                </svg>
                <span>{paused ? "Resume" : "Pause"}</span>
              </button>
            )}
          </div>
        </div>
        {racing.nearMiss && (
          <div className="near-miss" role="status">
            NEAR MISS!
          </div>
        )}
        {racing.flash && <div className="crash-flash" aria-hidden="true" />}
        {(racing.error || !game || phase !== "playing" || paused) && (
          <div className="overlay">
            <div className="card" role="status">
              <p>
                {racing.error ? "ENGINE ERROR" : phase === "over" ? "RACE COMPLETE" : "CAR RACING"}
              </p>
              <h2>
                {racing.error
                  ? "Unable to load"
                  : !game
                    ? "Starting engine…"
                    : paused
                      ? "Race paused"
                      : phase === "over"
                        ? racing.lives > 0
                          ? "Finished!"
                          : "Crashed!"
                        : "Ready to drive?"}
              </h2>
              <p>
                {racing.error ??
                  (phase === "over"
                    ? `Score ${racing.score.toLocaleString()} · Best ${racing.best.toLocaleString()} · ${TRACK_LENGTH - racing.left} m driven`
                    : "2,000 metres. Three lives. 500 points for every car passed.")}
              </p>
              {racing.error ? (
                <button onClick={racing.restart}>Retry</button>
              ) : (
                game && (
                  <button
                    className="primary"
                    onClick={
                      paused
                        ? () => setPaused(false)
                        : phase === "ready"
                          ? racing.start
                          : racing.restart
                    }
                  >
                    {paused ? "Resume race" : phase === "ready" ? "Start race" : "Race again"}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </main>
      <p className="driving-hint">
        <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> to steer · Drag or swipe the road
      </p>
    </div>
  );
}
