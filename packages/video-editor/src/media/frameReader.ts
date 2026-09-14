import type { VideoSample, VideoSampleSink } from 'mediabunny';

/**
 * How far the playhead may jump forward before we tear down the iterator and
 * re-seek. Stepping forward reuses the open decoder; seeking restarts from the
 * preceding keyframe, so we only pay that cost for real jumps.
 */
const RESTART_THRESHOLD_SECONDS = 1;

/**
 * Turns mediabunny's `VideoSampleSink` into something a per-frame render loop
 * can call.
 *
 * `sink.getSample()` spins up a fresh decoder and replays the whole GOP on
 * every call, which is fine for a one-off thumbnail but far too slow at 30 fps.
 * `sink.samples()` instead hands back a pre-decoding iterator — this class keeps
 * one open and walks it forward, which makes sequential playback nearly free
 * while still supporting arbitrary scrubbing.
 */
export class SequentialVideoReader {
  private readonly sink: VideoSampleSink;
  private iterator: AsyncGenerator<VideoSample, void, unknown> | null = null;
  /** The sample covering the last requested instant. Owned by this reader. */
  private current: VideoSample | null = null;
  /** Serialises overlapping calls; one iterator can't be advanced concurrently. */
  private chain: Promise<unknown> = Promise.resolve();
  private disposed = false;

  constructor(sink: VideoSampleSink) {
    this.sink = sink;
  }

  /**
   * The returned sample stays valid until the next `sampleAt` call on this
   * reader, so draw it before awaiting anything else.
   */
  async sampleAt(seconds: number): Promise<VideoSample | null> {
    if (this.disposed) return null;
    const run = this.chain.then(() => this.advanceTo(seconds)).catch(() => undefined);
    this.chain = run;
    await run;
    return this.disposed ? null : this.current;
  }

  async dispose() {
    this.disposed = true;
    await this.closeIterator();
  }

  private covers(sample: VideoSample, seconds: number) {
    // Zero-duration samples (some single-frame files) should still match.
    const duration = Math.max(sample.duration, 1e-6);
    return seconds >= sample.timestamp && seconds < sample.timestamp + duration;
  }

  private async advanceTo(seconds: number) {
    if (this.disposed) return;
    if (this.current && this.covers(this.current, seconds)) return;

    const canStepForward =
      this.iterator !== null &&
      this.current !== null &&
      seconds >= this.current.timestamp &&
      seconds - this.current.timestamp < RESTART_THRESHOLD_SECONDS;

    if (!canStepForward) {
      await this.restart(seconds);
      return;
    }

    while (this.iterator && this.current && !this.covers(this.current, seconds) && seconds > this.current.timestamp) {
      const next = await this.iterator.next();
      // Past the end of the track: hold the last frame rather than blanking.
      if (next.done || !next.value) break;
      this.current.close();
      this.current = next.value;
    }
  }

  private async restart(seconds: number) {
    await this.closeIterator();
    if (this.disposed) return;
    // `samples(t)` yields the sample *covering* t first, so this lands exactly
    // on the frame that should be on screen.
    this.iterator = this.sink.samples(Math.max(0, seconds));
    const first = await this.iterator.next();
    this.current = first.done ? null : first.value;
  }

  private async closeIterator() {
    const iterator = this.iterator;
    this.iterator = null;
    this.current?.close();
    this.current = null;
    if (iterator) await iterator.return().catch(() => undefined);
  }
}
