import { useEffect, useRef } from "react";
import { GameView } from "@nayan-ui/engine";
import { DAY_LIGHT, SKY, useRacing } from "@nayan-engine-example/shared/car-racing";
import { sources } from "./assets";
import "./style.css";

export default function CarRacing() {
  const racing = useRacing(sources);
  const { game, phase, paused, input, setPaused } = racing;
  const surface = useRef<HTMLElement>(null);
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
    <div className="app">
      <header className="flex items-center justify-between">
        <a href="https://www.nayanui.com/engine">NAYAN / ENGINE</a>
        <span>React + shared TypeScript</span>
      </header>
      <section className="title">
        <div>
          <p>THE SHARED GAME EXAMPLE</p>
          <h1>
            Car Racing<span>Hit the road.</span>
          </h1>
        </div>
        <p>
          One engine. Two platforms.
          <br />
          Dodge traffic on a winding highway.
        </p>
      </section>
      <div className="hud" aria-label="Race statistics">
        <div>
          <span>SCORE</span>
          <strong>{racing.score.toLocaleString()}</strong>
        </div>
        <div>
          <span>LIVES</span>
          <strong>{racing.lives} / 3</strong>
        </div>
        <div>
          <span>TIME LEFT</span>
          <strong className={racing.time <= 10 ? "danger" : ""}>
            {Math.floor(racing.time / 60)}:{String(racing.time % 60).padStart(2, "0")}
          </strong>
        </div>
        <button onClick={racing.toggleMute}>{racing.muted ? "Sound off" : "Sound on"}</button>
        {phase === "playing" && (
          <button onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>
        )}
      </div>
      <main ref={surface}>
        {game && (
          <GameView
            source={game.world}
            camera={game.camera}
            light={DAY_LIGHT}
            background={SKY}
            fog={0.0075}
            paused={paused}
            onError={racing.reportError}
            onUpdate={racing.update}
            onDrag={(event) => racing.drag(event, surface.current?.clientWidth ?? 1)}
          />
        )}
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
                          ? "Time’s up!"
                          : "Crashed!"
                        : "Ready to drive?"}
              </h2>
              <p>
                {racing.error ??
                  (phase === "over"
                    ? `Score ${racing.score.toLocaleString()} · Best ${racing.best.toLocaleString()}`
                    : "120 seconds. Three lives. 500 points for every car passed.")}
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
      <footer className="flex flex-wrap items-center justify-between gap-4">
        <span>
          <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> to steer · Drag or swipe the road
        </span>
        <span>Inspired by Playtura</span>
      </footer>
    </div>
  );
}
