import type { VideoSample, VideoSampleSink } from 'mediabunny';

/** Jump threshold: stepping forward reuses the decoder, seeking restarts from the preceding keyframe. */
const RESTART_THRESHOLD_SECONDS = 1;

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
      if (next.done || !next.value) break;
      this.current.close();
      this.current = next.value;
    }
  }

  // Release the current sample before tearing the iterator down, and never hold one across that teardown.
  private async restart(seconds: number) {
    await this.closeIterator();
    if (this.disposed) return;
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
