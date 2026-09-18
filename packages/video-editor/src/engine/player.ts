import { reportOnce } from '../lib/diagnostics';
import { US } from '../types';
import { AudioEngine } from './audioEngine';
import { renderScene } from './compositor';
import type { Scene } from './compositor';

const RETRY_DELAY_MS = 120;

const MAX_RENDER_ATTEMPTS = 5;

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

export class Player {
  readonly audio = new AudioEngine();

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private callbacks: PlayerCallbacks;

  // Composite offscreen and blit once: drawing to the visible canvas showed half-built frames.
  private buffer: OffscreenCanvas | HTMLCanvasElement | null = null;
  private bufferContext: BufferContext | null = null;
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

  private async renderAt(timeUs: number, attempt = 0) {
    const context = this.context;
    const canvas = this.canvas;
    if (!context || !canvas) return;

    // Whatever this frame turns out to be, it supersedes an older retry.
    this.cancelRetry();

    const lastAttempt = attempt >= MAX_RENDER_ATTEMPTS - 1;
    let complete = true;
    this.rendering = true;
    try {
      complete = await this.paint(context, canvas, timeUs, !lastAttempt);
    } catch (error) {
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

    // A layer whose source is not ready is skipped, and while paused nothing repaints, so the gap would persist.
    if (!complete && !lastAttempt && !this.playing) {
      this.retryTimer = setTimeout(
        () => {
          this.retryTimer = null;
          // Superseded by playback, a newer render, or a move to another instant.
          if (this.playing || this.rendering || this.currentUs !== timeUs) return;
          void this.renderAt(timeUs, attempt + 1);
        },
        RETRY_DELAY_MS * (attempt + 1)
      );
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

    // Clip ranges are half-open, so the instant at the timeline's end composites nothing: hold the last frame.
    let end = 0;
    for (const clip of scene.clips) end = Math.max(end, clip.startUs + clip.durationUs);
    const renderTime = end > 0 ? Math.min(timeUs, end - 1) : timeUs;

    const offscreen = this.ensureBuffer(scene.project.width, scene.project.height);
    if (!offscreen) return renderScene(context, scene, renderTime, { target: 'preview' });

    const complete = await renderScene(offscreen, scene, renderTime, { target: 'preview' });

    // Hold the last good frame while a decoder seeks, rather than replacing a picture with a bare background.
    if (complete || !allowRetry || !this.presented) {
      context.drawImage(this.buffer as CanvasImageSource, 0, 0);
      this.presented = true;
    }
    return complete;
  }
}
