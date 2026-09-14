import { US } from '../types';
import { AudioEngine } from './audioEngine';
import { renderScene } from './compositor';
import type { Scene } from './compositor';

export interface PlayerCallbacks {
  /** Latest scene state, pulled fresh each frame so edits show up live. */
  getScene: () => Scene;
  /** Timeline length; playback stops here. */
  getDurationUs: () => number;
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

  private rafId = 0;
  private playing = false;
  private rendering = false;
  /** Timeline position when the current run started. */
  private originUs = 0;
  /** Audio-clock time matching `originUs`, or null when running off wall clock. */
  private audioOrigin: number | null = null;
  private wallOrigin = 0;
  private currentUs = 0;
  /** Set while a seek render is pending so ticks don't fight it. */
  private pendingSeek: number | null = null;

  constructor(callbacks: PlayerCallbacks) {
    this.callbacks = callbacks;
  }

  attach(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.context = canvas?.getContext('2d', { alpha: false }) ?? null;
  }

  get isPlaying() {
    return this.playing;
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
      this.pendingSeek = timeUs;
      return;
    }
    await this.renderAt(timeUs);
  }

  /** Repaints the current instant — used when a clip property changes. */
  refresh() {
    if (this.playing || this.rendering) return;
    void this.renderAt(this.currentUs);
  }

  dispose() {
    this.pause();
    this.audio.dispose();
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

  private async renderAt(timeUs: number) {
    const context = this.context;
    const canvas = this.canvas;
    if (!context || !canvas) return;

    this.rendering = true;
    try {
      const scene = this.callbacks.getScene();
      if (canvas.width !== scene.project.width || canvas.height !== scene.project.height) {
        canvas.width = scene.project.width;
        canvas.height = scene.project.height;
      }
      await renderScene(context, scene, timeUs, { target: 'preview' });
    } catch {
      // A disposed reader or closed sample; the next frame will recover.
    } finally {
      this.rendering = false;
    }

    if (this.pendingSeek !== null) {
      const next = this.pendingSeek;
      this.pendingSeek = null;
      await this.renderAt(next);
    }
  }
}
