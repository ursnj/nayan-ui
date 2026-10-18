import NativeEngine from "../native/NativeNayanEngine";

const OP = { addScore: 0, setScore: 1, addLives: 2, setLives: 3, startClock: 4, stopClock: 5, resumeClock: 6, reset: 7, addTime: 8, timeBonus: 9 } as const;
const S = { score: 0, lives: 1, seconds: 2, shown: 3, flags: 4, running: 5, rate: 6, best: 7 } as const;
const FLAG = { score: 1, lives: 2, second: 4, timeUp: 8, livesOut: 16 } as const;

export type ScoreboardHandlers = {
  /** The score changed (points, time-based points, reset). */
  onScore?: (score: number) => void;
  onLives?: (lives: number) => void;
  /** The whole seconds shown changed: time left for a countdown, elapsed otherwise. */
  onSecond?: (seconds: number) => void;
  /** A countdown reached 0 (the clock stops). */
  onTimeUp?: () => void;
  /** Lives went from above 0 to 0. */
  onLivesOut?: () => void;
};

/**
 * Score, lives and the game clock, kept and advanced in Rust by `world.update`: countdowns, elapsed
 * time and time-based points (survival, distance) cost no JS per frame. Handlers run from `update`
 * only when something they show changed.
 *
 * ```ts
 * world.scoreboard.handlers = { onScore: setScore, onSecond: setTime, onTimeUp: () => end(true) };
 * world.scoreboard.reset(3);
 * world.scoreboard.startCountdown(60);
 * world.scoreboard.add(10);
 * ```
 */
export class Scoreboard {
  handlers: ScoreboardHandlers = {};
  private readonly state: Float64Array;

  /** @internal */
  constructor(private readonly world: number) {
    if (!NativeEngine || typeof NativeEngine.getScoreboard !== "function") {
      throw new Error("Scoreboard: this app's native core predates the scoreboard: rebuild it");
    }
    this.state = new Float64Array(NativeEngine.getScoreboard(world) as ArrayBuffer);
  }

  private op(op: number, a = 0, b = 0) {
    return NativeEngine!.scoreboard(this.world, op, a, b);
  }

  get score() {
    return this.state[S.score]!;
  }
  get best() {
    return this.state[S.best]!;
  }
  get lives() {
    return this.state[S.lives]!;
  }
  /** Seconds left (countdown) or elapsed, fractional. */
  get seconds() {
    return this.state[S.seconds]!;
  }
  /** Whole seconds as shown: rounded up while counting down, down while counting up. */
  get shownSeconds() {
    return this.state[S.shown]!;
  }
  get running() {
    return this.state[S.running] !== 0;
  }

  /** Adds points (negative to take away). Returns the score. */
  add(points: number) {
    return this.op(OP.addScore, points);
  }
  set(score: number) {
    return this.op(OP.setScore, score);
  }
  addLives(n: number) {
    this.op(OP.addLives, n);
    return this.lives;
  }
  setLives(n: number) {
    this.op(OP.setLives, n);
  }
  /** Counts `seconds` down to 0 (then `onTimeUp`), earning `pointsPerSecond` meanwhile. */
  startCountdown(seconds: number, pointsPerSecond = 0) {
    this.op(OP.startClock, Math.max(1e-6, seconds), pointsPerSecond);
  }
  /** Counts up from 0, earning `pointsPerSecond` (survival and distance scores). */
  startClock(pointsPerSecond = 0) {
    this.op(OP.startClock, 0, pointsPerSecond);
  }
  stop() {
    this.op(OP.stopClock);
  }
  resume() {
    this.op(OP.resumeClock);
  }
  /** Time bonus (or penalty) on the clock. */
  addTime(seconds: number) {
    this.op(OP.addTime, seconds);
  }
  /**
   * Adds `pointsPerSecond` for each whole second saved: the seconds left on a countdown, or
   * `expectedSeconds` minus the seconds elapsed on a clock counting up. Returns the score.
   */
  awardTimeBonus(pointsPerSecond: number, expectedSeconds = 0) {
    return this.op(OP.timeBonus, pointsPerSecond, expectedSeconds);
  }
  /** A new run: score 0, `lives`, clock stopped at 0. */
  reset(lives = 0) {
    this.op(OP.reset, lives);
  }

  /** @internal Runs handlers for what changed since the last call. */
  dispatch() {
    const flags = this.state[S.flags]!;
    if (flags === 0) return;
    this.state[S.flags] = 0;
    const h = this.handlers;
    if (flags & FLAG.score) h.onScore?.(this.score);
    if (flags & FLAG.lives) h.onLives?.(this.lives);
    if (flags & FLAG.second) h.onSecond?.(this.shownSeconds);
    if (flags & FLAG.timeUp) h.onTimeUp?.();
    if (flags & FLAG.livesOut) h.onLivesOut?.();
  }
}
