import { animatedValue } from '../lib/keyframes';
import { getAudioBuffer } from '../media/library';
import { US, clipEndUs, isAudibleKind, isMediaClip } from '../types';
import type { Clip, MediaClip, Track } from '../types';

/** Clips that produce sound at or after `fromUs`, honouring mutes and solos. */
export const audibleClips = (clips: Clip[], tracks: Track[], fromUs: number): MediaClip[] => {
  const trackById = new Map(tracks.map(track => [track.id, track]));

  return clips.filter((clip): clip is MediaClip => {
    if (!isMediaClip(clip) || !isAudibleKind(clip)) return false;
    if (clip.muted || clip.volume <= 0) return false;
    const track = trackById.get(clip.trackId);
    if (!track || track.muted) return false;
    return clipEndUs(clip) > fromUs;
  });
};

/**
 * Places one clip on an audio graph: source → EQ → panner → gain → destination.
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
  originTime: number,
  trackVolume = 1
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
  source.buffer = clip.reversed ? reversedBuffer(buffer) : buffer;
  source.playbackRate.value = clip.speed;

  const gain = context.createGain();
  source.connect(gain).connect(destination);

  const atTime = (timelineUs: number) => originTime + (timelineUs - fromUs) / US;
  const parameter = gain.gain;
  const baseVolume = clip.volume * trackVolume;

  const volumeKeys = clip.animations['volume'];
  if (volumeKeys && volumeKeys.length > 0) {
    // An automated volume curve replaces the simple fade pair: sample it at a
    // fixed rate and lay the points onto the param timeline.
    scheduleVolumeCurve(parameter, clip, entryUs, endUs, atTime, trackVolume);
  } else {
    if (clip.fadeInUs > 0) rampSegment(parameter, atTime(clip.startUs), 0, atTime(clip.startUs + clip.fadeInUs), baseVolume);
    else parameter.setValueAtTime(baseVolume, Math.max(0, atTime(clip.startUs)));

    if (clip.fadeOutUs > 0) rampSegment(parameter, atTime(endUs - clip.fadeOutUs), baseVolume, atTime(endUs), 0);
  }

  source.start(Math.max(context.currentTime, atTime(entryUs)), offsetSeconds, sourceSeconds);
  return source;
};

/** Samples a keyframed volume track onto the param timeline. */
const scheduleVolumeCurve = (
  parameter: AudioParam,
  clip: MediaClip,
  entryUs: number,
  endUs: number,
  atTime: (timelineUs: number) => number,
  trackVolume: number
) => {
  /*
   * 50 Hz is well below any audible stepping, but a fixed step means a long
   * clip mints an automation event every 20ms — a ten-minute clip would queue
   * thirty thousand of them on the audio thread. Cap the total and let the
   * step stretch instead; a volume envelope never needs that resolution.
   */
  const MAX_POINTS = 400;
  const stepUs = Math.max(20_000, (endUs - entryUs) / MAX_POINTS);
  for (let t = entryUs; t <= endUs; t += stepUs) {
    const value = animatedValue(clip, 'volume', clip.volume, t) * trackVolume;
    const when = Math.max(0, atTime(t));
    if (t === entryUs) parameter.setValueAtTime(Math.max(0, value), when);
    else parameter.linearRampToValueAtTime(Math.max(0, value), when);
  }
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

/** Reversed clips need reversed PCM; cached because the copy is not cheap. */
const reversedCache = new WeakMap<AudioBuffer, AudioBuffer>();

const reversedBuffer = (buffer: AudioBuffer): AudioBuffer => {
  const cached = reversedCache.get(buffer);
  if (cached) return cached;

  const output = new AudioBuffer({
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    numberOfChannels: buffer.numberOfChannels
  });
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel);
    const target = new Float32Array(source.length);
    for (let i = 0; i < source.length; i++) target[i] = source[source.length - 1 - i];
    output.copyToChannel(target, channel);
  }
  reversedCache.set(buffer, output);
  return output;
};

/**
 * Preview audio.
 *
 * Rather than streaming decoded packets, each clip is scheduled as one
 * `AudioBufferSourceNode` when playback starts. The browser then mixes
 * everything sample-accurately with no per-frame work, and the render loop
 * reads its time from that same clock so the two can't drift apart.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private active: AudioBufferSourceNode[] = [];
  /** Bumped on every start/stop so a slow decode can't schedule into a stale run. */
  private generation = 0;
  private volume = 1;

  /** Must be called from a user gesture the first time. */
  async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.master.connect(this.analyser);
      this.analyser.connect(this.context.destination);
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

  /** Peak level 0–1 for the meter, or 0 when nothing is playing. */
  peakLevel(): number {
    if (!this.analyser) return 0;
    const data = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(data);
    let peak = 0;
    for (const sample of data) {
      const value = Math.abs(sample);
      if (value > peak) peak = value;
    }
    return Math.min(1, peak);
  }

  /**
   * Schedules every audible clip from `fromUs` onward. Returns the audio-clock
   * time corresponding to timeline position `fromUs`.
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

    if (generation !== this.generation || !this.master) return context.currentTime;

    const trackVolumes = new Map(tracks.map(track => [track.id, track.volume]));
    // Small lead-in so the scheduling work below can't cause a late first note.
    const originTime = context.currentTime + 0.06;

    for (const { clip, buffer } of decoded) {
      if (!buffer) continue;
      const source = scheduleClipAudio(context, this.master, clip, buffer, fromUs, originTime, trackVolumes.get(clip.trackId) ?? 1);
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
    this.analyser = null;
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
