import { getAudioBuffer } from '../media/library';
import { US, clipEndUs, isMediaClip } from '../types';
import type { Clip, MediaClip, Track } from '../types';

/** Clips that produce sound at or after `fromUs`, honouring track and clip mutes. */
export const audibleClips = (clips: Clip[], tracks: Track[], fromUs: number): MediaClip[] => {
  const trackById = new Map(tracks.map(track => [track.id, track]));
  return clips.filter((clip): clip is MediaClip => {
    if (!isMediaClip(clip) || clip.kind === 'image') return false;
    if (clip.muted || clip.volume <= 0) return false;
    if (trackById.get(clip.trackId)?.muted) return false;
    return clipEndUs(clip) > fromUs;
  });
};

/**
 * Places one clip on an audio graph, with its fades.
 *
 * Shared by the live preview and the offline export mix so both produce
 * identical audio — the only difference is which `BaseAudioContext` is passed.
 *
 * Timeline instant `t` maps to `originTime + (t - fromUs) / US` on the target
 * context's clock, which is also how the compositor's fade envelope is
 * evaluated, so sound and picture fade together.
 */
export const scheduleClipAudio = (
  context: BaseAudioContext,
  destination: AudioNode,
  clip: MediaClip,
  buffer: AudioBuffer,
  fromUs: number,
  originTime: number
): AudioBufferSourceNode | null => {
  const entryUs = Math.max(fromUs, clip.startUs);
  const endUs = clipEndUs(clip);
  const remainingUs = endUs - entryUs;
  if (remainingUs <= 0) return null;

  const offsetSeconds = (clip.inUs + (entryUs - clip.startUs) * clip.speed) / US;
  if (offsetSeconds >= buffer.duration) return null;
  // Timeline duration maps to a longer/shorter slice of source at speed != 1.
  const sourceSeconds = Math.min((remainingUs / US) * clip.speed, buffer.duration - offsetSeconds);
  if (sourceSeconds <= 0) return null;

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = clip.speed;

  const gain = context.createGain();
  source.connect(gain).connect(destination);

  const atTime = (timelineUs: number) => originTime + (timelineUs - fromUs) / US;
  const volume = clip.volume;
  const parameter = gain.gain;

  if (clip.fadeInUs > 0) rampSegment(parameter, atTime(clip.startUs), 0, atTime(clip.startUs + clip.fadeInUs), volume);
  else parameter.setValueAtTime(volume, Math.max(0, atTime(clip.startUs)));

  if (clip.fadeOutUs > 0) rampSegment(parameter, atTime(endUs - clip.fadeOutUs), volume, atTime(endUs), 0);

  source.start(Math.max(context.currentTime, atTime(entryUs)), offsetSeconds, sourceSeconds);
  return source;
};

/**
 * Schedules one linear gain segment.
 *
 * Web Audio rejects negative times, so a seek that lands part-way through a
 * fade can't simply schedule the ramp's true start. Instead the ramp is
 * restarted from the value it would already have reached, which preserves the
 * slope rather than flattening it against t=0.
 */
const rampSegment = (parameter: AudioParam, fromTime: number, fromValue: number, toTime: number, toValue: number) => {
  if (toTime <= 0) {
    // The whole ramp is behind us; jump straight to its end value.
    parameter.setValueAtTime(toValue, 0);
    return;
  }
  if (fromTime >= 0) {
    parameter.setValueAtTime(fromValue, fromTime);
  } else {
    const progress = -fromTime / (toTime - fromTime);
    parameter.setValueAtTime(fromValue + (toValue - fromValue) * progress, 0);
  }
  parameter.linearRampToValueAtTime(toValue, toTime);
};

/**
 * Preview audio.
 *
 * Rather than streaming decoded packets, each clip is scheduled as one
 * `AudioBufferSourceNode` against the audio clock when playback starts. The
 * browser then mixes everything sample-accurately without any per-frame work,
 * and the same clock drives the video loop so the two can't drift apart.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active: AudioBufferSourceNode[] = [];
  /** Bumped on every start/stop so a slow decode can't schedule into a stale run. */
  private generation = 0;
  /** Monitor level, 0–1. Applies to preview only; exports use clip volumes. */
  private volume = 1;

  /** Must be called from a user gesture the first time. */
  async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }

  get currentTime(): number | null {
    return this.context?.currentTime ?? null;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master) this.master.gain.value = this.volume;
  }

  /**
   * Schedules every audible clip from `fromUs` onward.
   *
   * Returns the audio-clock time that corresponds to timeline position
   * `fromUs`, which the render loop uses as its time base.
   */
  async start(clips: Clip[], tracks: Track[], fromUs: number): Promise<number> {
    const context = await this.ensureContext();
    this.stopSources();
    const generation = ++this.generation;

    // Decode everything *before* fixing the time base. The first play of a clip
    // can take seconds to decode, and an origin captured beforehand would
    // already be in the past by the time playback starts — the video loop would
    // then jump forward by exactly that decode time.
    const decoded = await Promise.all(audibleClips(clips, tracks, fromUs).map(async clip => ({ clip, buffer: await getAudioBuffer(clip.assetId) })));

    // A seek or stop happened while we were decoding.
    if (generation !== this.generation || !this.master) return context.currentTime;

    // Small lead-in so the scheduling work below can't cause a late first note.
    const originTime = context.currentTime + 0.06;

    for (const { clip, buffer } of decoded) {
      if (!buffer) continue;
      const source = scheduleClipAudio(context, this.master, clip, buffer, fromUs, originTime);
      if (!source) continue;
      source.onended = () => {
        this.active = this.active.filter(node => node !== source);
      };
      this.active.push(source);
    }

    return originTime;
  }

  stop() {
    this.generation++;
    this.stopSources();
  }

  dispose() {
    this.stop();
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  private stopSources() {
    for (const source of this.active) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped or never started.
      }
    }
    this.active = [];
  }
}
