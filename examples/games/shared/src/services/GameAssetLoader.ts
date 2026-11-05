export type AssetTask = () => unknown;
export interface AssetStage {
  label: string;
  tasks: () => Iterable<AssetTask>;
}
export interface LoadTiming {
  afterPaint(run: () => void): () => void;
  now?: () => number;
}
/**
 * Work per frame while the loader is up. The loading scene itself takes only a few milliseconds to
 * step and draw, so most of each 16.7 ms frame can go to loading. (It used to be 4 ms: three
 * quarters of every frame sat idle and a game took four times as long to load.)
 */
export const FRAME_BUDGET_MS = 10;
const MAX_JOBS_PER_FRAME = 64;
/**
 * Runs `run` right after the next frame is painted, in the same frame. `setImmediate` runs as soon as
 * the frame's callbacks return; `setTimeout(0)` would wait for the next frame on React Native
 * Android (its timers fire on frame ticks), so every step cost two frames and loading took twice as
 * long, or four times on a display running at 30 Hz.
 */
const timing: LoadTiming = {
  afterPaint(run) {
    // On the engine's display clock where there's a GameView (the loading screen is one): the work
    // runs right after each frame leaves, every refresh.
    const engine = require('@nayan-ui/engine') as { afterNextFrame?: (fn: () => void) => () => void };
    if (typeof engine.afterNextFrame === 'function') return engine.afterNextFrame(run);
    let cancelled = false;
    const soon = typeof setImmediate === 'function' ? (fn: () => void) => setImmediate(fn) : (fn: () => void) => setTimeout(fn, 0);
    const frame = requestAnimationFrame(() => {
      soon(() => {
        if (!cancelled) run();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }
};

/** Paint first, then batch small jobs within a frame budget, yielding between expensive builders. */
export class GameAssetLoader {
  private stage = 0;
  private iterator?: Iterator<AssetTask>;
  private task?: AssetTask;
  private cancel?: () => void;
  private active = false;
  private busy = false;
  private disposed = false;
  private done = false;
  /** Who's loading (a game id), for the dev log. */
  name = '';
  constructor(
    private stages: readonly AssetStage[],
    private changed: (label: string) => void,
    private finished: () => void,
    private failed: (error: unknown) => void,
    private clock: LoadTiming = timing
  ) {}
  start() {
    if (this.disposed || this.done) return;
    this.active = true;
    this.schedule();
  }
  pause() {
    this.active = false;
    this.cancel?.();
    this.cancel = undefined;
  }
  dispose() {
    this.pause();
    this.disposed = true;
  }
  private schedule() {
    if (!this.active || this.busy || this.cancel || this.disposed || this.done) return;
    this.cancel = this.clock.afterPaint(() => {
      this.cancel = undefined;
      void this.step();
    });
  }
  private async step() {
    if (!this.active || this.disposed) return;
    this.busy = true;
    const now = () => this.clock.now?.() ?? performance.now();
    const started = now();
    try {
      for (let jobs = 0; jobs < MAX_JOBS_PER_FRAME && this.active && !this.disposed; jobs++) {
        const stage = this.stages[this.stage];
        if (!stage) {
          this.done = true;
          this.active = false;
          this.finished();
          return;
        }
        if (!this.iterator) {
          this.changed(stage.label);
          this.iterator = stage.tasks()[Symbol.iterator]();
        }
        if (!this.task) {
          const next = this.iterator.next();
          if (next.done) {
            this.iterator = undefined;
            this.stage++;
            continue;
          }
          this.task = next.value;
        }
        if (!this.active || this.disposed) break;
        const began = now();
        const result = this.task();
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') await result;
        const took = now() - began;
        if (typeof __DEV__ !== 'undefined' && __DEV__ && took > 100)
          console.log(`[loader] ${this.name ? this.name + ' ' : ''}slow job in "${stage.label}": ${took.toFixed(0)} ms`);
        this.task = undefined;
        if (now() - started >= FRAME_BUDGET_MS) break;
      }
    } catch (error) {
      this.reject(error);
    } finally {
      this.busy = false;
    }
    this.schedule();
  }
  private reject(error: unknown) {
    this.busy = false;
    if (this.disposed) return;
    // A thrown generator is closed: retry the stage; completed model factories retain their caches.
    if (!this.task) this.iterator = undefined;
    this.pause();
    this.failed(error);
  }
}
