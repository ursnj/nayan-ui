import { reportOnce } from '../lib/diagnostics';
import { US } from '../types';
import { AudioEngine } from './audioEngine';
import { renderScene } from './compositor';
import type { Scene } from './compositor';

/**
 * How long to wait before re-rendering a frame that couldn't resolve a source.
 * Long enough for a decoder to deliver the sample it was already seeking to,
 * short enough not to read as a stall.
 */
const RETRY_DELAY_MS = 120;

type BufferContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface PlayerCallbacks {
  /** Latest scene state, pulled fresh each frame so edits show up live. */
  getScene: () => Scene;
  /** Timeline length; playback stops here. */
  getDurationUs: () => number;
  /** Where a loop restarts — the in point, or the top of the timeline. */
  getLoopStartUs: () => number;
  onTime: (timeUs: number) => void;
  onEnded: () => void;
}

/**
 * Drives the preview canvas.
 *
 * Time comes from the Web Audio clock whenever audio is playing, so video and
 * audio can't drift; without audio it falls back to `performance.now()`. Frames
 * are rendered one at a time — if a decode takes longer than a display frame we
 * drop the next tick rather than queueing work we can no longer use.
 */
export class Player {
  readonly audio = new AudioEngine();

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private callbacks: PlayerCallbacks;

  /**
   * Off-screen surface each frame is composited into, then blitted to the
   * screen in one go.
   *
   * Compositing straight to the visible canvas meant the screen showed a
   * half-built frame for as long as the build took. `renderScene` lays the
   * background down first — it has to, it is the base every layer sits on —
   * and only then awaits the decoder, so the canvas held nothing but
   * background for the whole wait.
   *
   * Scrubbing forward hid that: the reader steps its open iterator and answers
   * within the same frame. Scrubbing *backward* cannot — the iterator only
   * runs forward, so every backward move re-seeks to the preceding keyframe
   * and replays a group of pictures to get there. That is hundreds of
   * milliseconds of a visibly empty preview, on every pointer move.
   *
   * One surface, at project size, for the life of the page.
   */
  private buffer: OffscreenCanvas | HTMLCanvasElement | null = null;
  private bufferContext: BufferContext | null = null;
  /**
   * Whether the visible canvas holds a frame worth protecting.
   *
   * Withholding an incomplete frame only makes sense when there is something
   * better already on screen. Before the first one lands — and after anything
   * that clears the canvas — a partial picture beats a blank one.
   */
  private presented = false;

  private rafId = 0;
  private playing = false;
  private rendering = false;
  private looping = false;
  /** Timeline position when the current run started. */
  private originUs = 0;
  /** Audio-clock time matching `originUs`, or null when running off wall clock. */
  private audioOrigin: number | null = null;
  private wallOrigin = 0;
  private currentUs = 0;
  /** Instant a queued repaint is waiting for, so ticks don't fight it. */
  private pendingRenderUs: number | null = null;
  /** Outstanding retry for a frame whose source wasn't ready. */
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks;
  }

  attach(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.context = canvas?.getContext('2d', { alpha: false }) ?? null;
    // A fresh canvas has nothing on it to hold on to.
    this.presented = false;
  }

  get isPlaying() {
    return this.playing;
  }

  setLoop(loop: boolean) {
    this.looping = loop;
  }

  async play(fromUs: number) {
    if (this.playing) return;
    const duration = this.callbacks.getDurationUs();
    // Restart from the top when play is pressed at the very end.
    const start = fromUs >= duration - 1000 ? 0 : fromUs;

    this.playing = true;
    this.originUs = start;
    this.currentUs = start;

    const scene = this.callbacks.getScene();
    try {
      this.audioOrigin = await this.audio.start(scene.clips, scene.tracks, start);
    } catch {
      this.audioOrigin = null;
    }
    if (!this.playing) return;

    this.wallOrigin = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.audio.stop();
    this.audioOrigin = null;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  /** Repaints at `timeUs` without starting playback. */
  async seek(timeUs: number) {
    this.currentUs = timeUs;
    if (this.playing) {
      this.pause();
      this.callbacks.onTime(timeUs);
    }
    if (this.rendering) {
      // Coalesce: the in-flight render will pick this up when it finishes.
      this.pendingRenderUs = timeUs;
      return;
    }
    await this.renderAt(timeUs);
  }

  /**
   * Repaints the current instant — used when a clip property changes.
   *
   * Queues behind an in-flight render exactly as `seek` does. Dropping the
   * repaint instead, as this used to, meant the canvas kept whatever the
   * earlier render had left on it: a frame from before the edit, or nothing
   * at all when that render was one that couldn't resolve its source. Edits
   * arrive faster than a decode during a slider drag, so the dropped repaint
   * was frequently the *last* one, and the stale picture then stayed.
   */
  refresh() {
    if (this.playing) return;
    if (this.rendering) {
      this.pendingRenderUs = this.currentUs;
      return;
    }
    void this.renderAt(this.currentUs);
  }

  dispose() {
    this.pause();
    this.cancelRetry();
    this.audio.dispose();
    // Hand back the backing store rather than waiting for the collector to
    // notice a detached canvas; at 4K this surface is about 33MB.
    if (this.buffer) {
      this.buffer.width = 0;
      this.buffer.height = 0;
    }
    this.buffer = null;
    this.bufferContext = null;
  }

  private elapsedUs(): number {
    const audioTime = this.audio.currentTime;
    if (this.audioOrigin !== null && audioTime !== null) {
      return Math.max(0, (audioTime - this.audioOrigin) * US);
    }
    return (performance.now() - this.wallOrigin) * 1000;
  }

  private tick = () => {
    if (!this.playing) return;
    this.rafId = requestAnimationFrame(this.tick);

    const timeUs = this.originUs + this.elapsedUs();
    const duration = this.callbacks.getDurationUs();

    if (timeUs >= duration) {
      this.pause();

      if (this.looping) {
        // Restart here rather than through React. Going out to the store and
        // back would fire a seek and a play concurrently, and the two async
        // renders race — which is what made looping flash blank.
        const from = this.callbacks.getLoopStartUs();
        this.currentUs = from;
        this.callbacks.onTime(from);
        void this.play(from);
        return;
      }

      this.currentUs = duration;
      this.callbacks.onTime(duration);
      void this.renderAt(duration);
      this.callbacks.onEnded();
      return;
    }

    this.currentUs = timeUs;
    this.callbacks.onTime(timeUs);
    // Drop the frame if the previous one is still decoding.
    if (!this.rendering) void this.renderAt(timeUs);
  };

  private async renderAt(timeUs: number, allowRetry = true) {
    const context = this.context;
    const canvas = this.canvas;
    if (!context || !canvas) return;

    // Whatever this frame turns out to be, it supersedes an older retry.
    this.cancelRetry();

    let complete = true;
    this.rendering = true;
    try {
      complete = await this.paint(context, canvas, timeUs, allowRetry);
    } catch (error) {
      // Usually a disposed reader or a closed sample mid-seek, and the next
      // frame recovers. But the background has already been painted by the
      // time anything here throws, so a *persistent* failure looks exactly
      // like an empty preview with no error at all — which is unreadable.
      // Reported once per distinct cause so playback can't flood the console.
      reportOnce('render', error);
    } finally {
      this.rendering = false;
    }

    if (this.pendingRenderUs !== null) {
      const next = this.pendingRenderUs;
      this.pendingRenderUs = null;
      await this.renderAt(next);
      return;
    }

    /*
     * A layer whose source wasn't ready — a decoder mid-seek, a reader the
     * cache evicted a moment ago — is skipped, but the background has already
     * been painted by then, so the clip simply vanishes. While paused nothing
     * else repaints, so the empty frame is what stays on screen.
     *
     * The retry is scheduled *after* `rendering` clears, and never awaited
     * inside the render window. Holding the flag across a wait was a deadlock:
     * `requestAnimationFrame` doesn't fire while the document is hidden, so
     * the promise never settled, `finally` never ran, and every later repaint
     * queued behind a render that would never finish. A timer fires in a
     * hidden tab, and one retry is enough for a decoder to catch up.
     */
    if (!complete && allowRetry && !this.playing) {
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        // Superseded by playback, a newer render, or a move to another instant.
        if (this.playing || this.rendering || this.currentUs !== timeUs) return;
        void this.renderAt(timeUs, false);
      }, RETRY_DELAY_MS);
    }
  }

  private cancelRetry() {
    if (this.retryTimer === null) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  /** The off-screen surface, sized to the project. Null if 2D is unavailable. */
  private ensureBuffer(width: number, height: number): BufferContext | null {
    if (!this.buffer) {
      this.buffer =
        typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : Object.assign(document.createElement('canvas'), { width, height });
      // Opaque, matching the visible canvas: the background is always painted.
      this.bufferContext = (this.buffer.getContext('2d', { alpha: false }) as BufferContext | null) ?? null;
    }
    if (this.buffer.width !== width || this.buffer.height !== height) {
      this.buffer.width = width;
      this.buffer.height = height;
    }
    return this.bufferContext;
  }

  /** One pass over the scene. False when a visible layer had no source to draw. */
  private async paint(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, timeUs: number, allowRetry: boolean) {
    const scene = this.callbacks.getScene();
    if (canvas.width !== scene.project.width || canvas.height !== scene.project.height) {
      canvas.width = scene.project.width;
      canvas.height = scene.project.height;
      // Resizing a canvas clears it, so there is nothing left to protect.
      this.presented = false;
    }

    /*
     * Clip ranges are half-open — a clip is visible for `[start, end)` — so
     * rendering the instant at the very end of the timeline composites
     * nothing and clears the canvas to the background. Hold the final frame
     * instead, which is what reaching the end of playback should look like.
     *
     * The clamp uses the clips' own extent rather than `getDurationUs()`,
     * because that returns the out point when a range is marked and would
     * then freeze the picture for any scrub past it.
     */
    let end = 0;
    for (const clip of scene.clips) end = Math.max(end, clip.startUs + clip.durationUs);
    const renderTime = end > 0 ? Math.min(timeUs, end - 1) : timeUs;

    const offscreen = this.ensureBuffer(scene.project.width, scene.project.height);
    // No off-screen surface to be had: composite to the screen directly, which
    // is worse to look at but still correct.
    if (!offscreen) return renderScene(context, scene, renderTime, { target: 'preview' });

    const complete = await renderScene(offscreen, scene, renderTime, { target: 'preview' });

    /*
     * An incomplete frame is held back while a good one is on screen: a layer
     * whose decoder is still seeking would otherwise replace a real picture
     * with a bare background, which is the flicker this buffer exists to
     * remove. The previous frame stays up, and the retry lands the real one.
     *
     * It is shown in the two cases where there is nothing better: when the
     * screen is empty anyway, and on the retry — by then the source has had
     * its chance, and a stale picture that never resolves is worse than an
     * honest empty one, since a deleted asset would otherwise keep showing
     * footage that has left the project.
     */
    if (complete || !allowRetry || !this.presented) {
      context.drawImage(this.buffer as CanvasImageSource, 0, 0);
      this.presented = true;
    }
    return complete;
  }
}
