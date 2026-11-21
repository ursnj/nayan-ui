import { getAudioBuffer } from "../media/library";
import { US, clipEndUs, isAudibleKind, isMediaClip } from "../types";
import type { Clip, MediaClip, Track } from "../types";

/** Clips that produce sound at or after `fromUs`, honouring mutes and solos. */
export const audibleClips = (clips: Clip[], tracks: Track[], fromUs: number): MediaClip[] => {
  const trackById = new Map(tracks.map((track) => [track.id, track]));

  return clips.filter((clip): clip is MediaClip => {
    if (!isMediaClip(clip) || !isAudibleKind(clip)) return false;
    if (clip.muted || clip.volume <= 0) return false;
    const track = trackById.get(clip.trackId);
    if (!track || track.muted) return false;
    return clipEndUs(clip) > fromUs;
  });
};

export const scheduleClipAudio = (
  context: BaseAudioContext,
  destination: AudioNode,
  clip: MediaClip,
  buffer: AudioBuffer,
  fromUs: number,
  originTime: number,
  trackVolume = 1,
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

  if (clip.fadeInUs > 0)
    rampSegment(
      parameter,
      atTime(clip.startUs),
      0,
      atTime(clip.startUs + clip.fadeInUs),
      baseVolume,
    );
  else parameter.setValueAtTime(baseVolume, Math.max(0, atTime(clip.startUs)));

  if (clip.fadeOutUs > 0)
    rampSegment(parameter, atTime(endUs - clip.fadeOutUs), baseVolume, atTime(endUs), 0);

  source.start(Math.max(context.currentTime, atTime(entryUs)), offsetSeconds, sourceSeconds);
  return source;
};

const rampSegment = (
  parameter: AudioParam,
  fromTime: number,
  fromValue: number,
  toTime: number,
  toValue: number,
) => {
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

const reversedCache = new WeakMap<AudioBuffer, AudioBuffer>();

const reversedBuffer = (buffer: AudioBuffer): AudioBuffer => {
  const cached = reversedCache.get(buffer);
  if (cached) return cached;

  const output = new AudioBuffer({
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    numberOfChannels: buffer.numberOfChannels,
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

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
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
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  get currentTime(): number | null {
    return this.context?.currentTime ?? null;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master) this.master.gain.value = this.volume;
  }

  async start(clips: Clip[], tracks: Track[], fromUs: number): Promise<number> {
    const context = await this.ensureContext();
    this.stopSources();
    const generation = ++this.generation;

    const decoded = await Promise.all(
      audibleClips(clips, tracks, fromUs).map(async (clip) => ({
        clip,
        buffer: await getAudioBuffer(clip.assetId),
      })),
    );

    if (generation !== this.generation || !this.master) return context.currentTime;

    const trackVolumes = new Map(tracks.map((track) => [track.id, track.volume]));
    // Small lead-in so the scheduling work below can't cause a late first note.
    const originTime = context.currentTime + 0.06;

    for (const { clip, buffer } of decoded) {
      if (!buffer) continue;
      const source = scheduleClipAudio(
        context,
        this.master,
        clip,
        buffer,
        fromUs,
        originTime,
        trackVolumes.get(clip.trackId) ?? 1,
      );
      if (!source) continue;
      source.addEventListener("ended", () => {
        this.active = this.active.filter((node) => node !== source);
      });
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
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped or never started.
      }
    }
    this.active = [];
  }
}
