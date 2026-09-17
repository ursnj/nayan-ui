import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  MkvOutputFormat,
  MovOutputFormat,
  Mp4OutputFormat,
  OggOutputFormat,
  Output,
  Quality,
  WavOutputFormat,
  WebMOutputFormat,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec
} from 'mediabunny';
import type { AudioCodec, OutputFormat, VideoCodec } from 'mediabunny';
import { getAudioBuffer, releaseExportReaders } from '../media/library';
import { US } from '../types';
import type { ExportSettings } from '../types';
import { audibleClips, scheduleClipAudio } from './audioEngine';
import { releaseExportSurfaces, renderScene } from './compositor';
import type { Scene } from './compositor';
import { exportProcessor } from './glProcessor';

export type ExportStage = 'preparing' | 'audio' | 'video' | 'finalizing' | 'done';

export interface ExportProgress {
  stage: ExportStage;
  /** 0–1 across the whole job. */
  progress: number;
  message: string;
  /** Frames encoded per second, once there's enough data to estimate. */
  fps?: number;
  /** Seconds remaining, once there's enough data to estimate. */
  etaSeconds?: number;
}

export class ExportCanceledError extends Error {
  constructor() {
    super('Export canceled');
  }
}

export interface ExportFormat {
  id: string;
  label: string;
  detail: string;
  extension: string;
  /** `audio` formats hold no video track, for bouncing just the mix. */
  kind: 'video' | 'audio';
  create: () => OutputFormat;
}

/**
 * Containers the muxer can write. Which codecs each can actually carry is
 * asked of the format itself and intersected with what this browser can
 * encode, rather than hard-coded — so a format only appears if it will work
 * here, and adding one is a single entry.
 */
export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'mp4',
    label: 'MP4',
    detail: 'H.264 · plays everywhere',
    extension: 'mp4',
    kind: 'video',
    create: () => new Mp4OutputFormat({ fastStart: 'in-memory' })
  },
  {
    id: 'mov',
    label: 'MOV',
    detail: 'QuickTime · for Final Cut and Premiere',
    extension: 'mov',
    kind: 'video',
    create: () => new MovOutputFormat({ fastStart: 'in-memory' })
  },
  { id: 'mkv', label: 'MKV', detail: 'Matroska · archival', extension: 'mkv', kind: 'video', create: () => new MkvOutputFormat() },
  { id: 'webm', label: 'WebM', detail: 'VP9 · open web', extension: 'webm', kind: 'video', create: () => new WebMOutputFormat() },
  {
    id: 'm4a',
    label: 'M4A',
    detail: 'Audio only · AAC',
    extension: 'm4a',
    kind: 'audio',
    create: () => new Mp4OutputFormat({ fastStart: 'in-memory' })
  },
  { id: 'wav', label: 'WAV', detail: 'Audio only · uncompressed', extension: 'wav', kind: 'audio', create: () => new WavOutputFormat() },
  { id: 'ogg', label: 'OGG', detail: 'Audio only · Opus', extension: 'ogg', kind: 'audio', create: () => new OggOutputFormat() }
];

export const findFormat = (id: string) => EXPORT_FORMATS.find(format => format.id === id) ?? EXPORT_FORMATS[0];

/**
 * Preference order, narrowed to what a given container accepts. H.264 leads
 * because it is the one codec that plays everywhere; PCM leads for audio only
 * because it is the only one that needs no encoder at all.
 */
const VIDEO_PREFERENCE: VideoCodec[] = ['avc', 'vp9', 'av1', 'hevc', 'vp8'];
const AUDIO_PREFERENCE: AudioCodec[] = ['aac', 'opus', 'pcm-s16', 'vorbis', 'flac'];

const candidates = <T extends string>(preference: T[], supported: readonly string[]): T[] => preference.filter(codec => supported.includes(codec));

/** Whether this browser can actually encode into the format at this size. */
export const isFormatSupported = async (format: ExportFormat, width: number, height: number): Promise<boolean> => {
  const container = format.create();
  const audio = await getFirstEncodableAudioCodec(candidates(AUDIO_PREFERENCE, container.getSupportedAudioCodecs()), {
    numberOfChannels: MIX_CHANNELS,
    sampleRate: MIX_SAMPLE_RATE
  }).catch(() => null);

  if (format.kind === 'audio') return audio !== null;

  const video = await getFirstEncodableVideoCodec(candidates(VIDEO_PREFERENCE, container.getSupportedVideoCodecs()), {
    width,
    height
  }).catch(() => null);
  return video !== null;
};

const MIX_SAMPLE_RATE = 48_000;
const MIX_CHANNELS = 2;
const AUDIO_SLICE_SECONDS = 1;

/**
 * Renders the timeline to a video file.
 *
 * The compositor is the same one the preview uses, pointed at an OffscreenCanvas
 * at output resolution — so what you saw is what you get. Video is walked frame
 * by frame at the target rate; audio is mixed in one offline pass first, since
 * `OfflineAudioContext` renders far faster than real time and gives the encoder
 * a clean, gapless PCM stream.
 */
export const exportProject = async (
  scene: Scene,
  settings: ExportSettings,
  durationUs: number,
  onProgress: (progress: ExportProgress) => void,
  signal?: AbortSignal,
  formatId = 'mp4'
): Promise<Blob> => {
  const format = findFormat(formatId);
  const container = format.create();
  const videoOnlyAudioless = format.kind === 'audio';
  const throwIfCanceled = () => {
    if (signal?.aborted) throw new ExportCanceledError();
  };

  onProgress({ stage: 'preparing', progress: 0, message: 'Checking codec support…' });
  throwIfCanceled();

  // An in/out range exports just that region, re-based to start at zero.
  const startUs = settings.rangeUs?.startUs ?? 0;
  const endUs = settings.rangeUs?.endUs ?? durationUs;
  const spanUs = Math.max(0, endUs - startUs);
  const durationSeconds = spanUs / US;
  if (durationSeconds <= 0) throw new Error('Nothing to export — the selected range is empty.');

  // Codecs come from the container's own capability list intersected with
  // what this browser can encode, so the same code serves every format.
  const videoQuality = new Quality({ bitrate: settings.bitrate });
  let videoCodec: VideoCodec | null = null;
  if (!videoOnlyAudioless) {
    videoCodec = await getFirstEncodableVideoCodec(candidates(VIDEO_PREFERENCE, container.getSupportedVideoCodecs()), {
      width: settings.width,
      height: settings.height,
      quality: videoQuality
    });
    if (!videoCodec) throw new Error(`This browser cannot encode video for ${format.label}. Try MP4, or a recent Chrome, Edge or Safari.`);
  }

  // Mix audio up front: it's cheap relative to video and tells us whether an
  // audio track is needed before the output starts (tracks are immutable once
  // `start()` is called). An audio-only format always needs it.
  let mixedAudio: AudioBuffer | null = null;
  if (settings.includeAudio || videoOnlyAudioless) {
    onProgress({ stage: 'audio', progress: 0.02, message: 'Mixing audio…' });
    mixedAudio = await mixAudio(scene, startUs, spanUs);
    throwIfCanceled();
  }
  if (videoOnlyAudioless && !mixedAudio) throw new Error('Nothing to export — the timeline has no audible clips.');

  const audioCodec = mixedAudio
    ? await getFirstEncodableAudioCodec(candidates(AUDIO_PREFERENCE, container.getSupportedAudioCodecs()), {
        numberOfChannels: MIX_CHANNELS,
        sampleRate: MIX_SAMPLE_RATE,
        quality: new Quality({ bitrate: settings.audioBitrate })
      })
    : null;
  if (mixedAudio && !audioCodec && videoOnlyAudioless) {
    throw new Error(`This browser cannot encode audio for ${format.label}.`);
  }

  const output = new Output({ format: container, target: new BufferTarget() });

  const canvas = new OffscreenCanvas(settings.width, settings.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create the export canvas.');

  const videoSource = videoCodec ? new CanvasSource(canvas, { codec: videoCodec, quality: videoQuality, keyFrameInterval: 2 }) : null;
  if (videoSource) output.addVideoTrack(videoSource, { frameRate: settings.fps });

  const audioSource =
    mixedAudio && audioCodec ? new AudioBufferSource({ codec: audioCodec, quality: new Quality({ bitrate: settings.audioBitrate }) }) : null;
  if (audioSource) output.addAudioTrack(audioSource);

  // Positions and font sizes in the model are fractions of the frame, so
  // re-pointing the project at the export size scales the whole scene.
  const exportScene: Scene = {
    ...scene,
    project: { ...scene.project, width: settings.width, height: settings.height, fps: settings.fps }
  };

  try {
    await output.start();
    throwIfCanceled();

    if (audioSource && mixedAudio) {
      onProgress({ stage: 'audio', progress: 0.05, message: 'Encoding audio…' });
      for (const slice of sliceAudioBuffer(mixedAudio, AUDIO_SLICE_SECONDS)) {
        throwIfCanceled();
        await audioSource.add(slice);
      }
      audioSource.close();
    }

    // Guarded once rather than per iteration: `videoSource` is null only for
    // an audio-only bounce, and testing it inside the condition was there to
    // narrow the type, not because it can change.
    if (videoSource) {
      const frameCount = Math.max(1, Math.ceil(durationSeconds * settings.fps));
      const began = performance.now();

      for (let frame = 0; frame < frameCount; frame++) {
        throwIfCanceled();
        // Scene time includes the range offset; output time always starts at 0.
        const sceneTimeUs = startUs + (frame / settings.fps) * US;
        await renderScene(context, exportScene, sceneTimeUs, { target: 'export' });
        await videoSource.add(frame / settings.fps, 1 / settings.fps);

        const done = frame + 1;
        const elapsed = (performance.now() - began) / 1000;
        const rate = elapsed > 0.5 ? done / elapsed : undefined;
        onProgress({
          stage: 'video',
          // Video occupies 10%-95% of the reported progress.
          progress: 0.1 + (done / frameCount) * 0.85,
          message: `Encoding frame ${done} of ${frameCount}`,
          fps: rate,
          etaSeconds: rate ? (frameCount - done) / rate : undefined
        });
      }
      videoSource.close();
    }

    onProgress({ stage: 'finalizing', progress: 0.96, message: 'Writing file…' });
    await output.finalize();

    const buffer = output.target.buffer;
    if (!buffer) throw new Error('The muxer produced no output.');

    onProgress({ stage: 'done', progress: 1, message: 'Export complete' });
    return new Blob([buffer], { type: container.mimeType });
  } catch (error) {
    if (output.state === 'started' || output.state === 'pending') await output.cancel().catch(() => undefined);
    throw error;
  } finally {
    /*
     * An export runs on its own decoders, its own scratch surfaces and its own
     * GPU context, all of them sized to the output rather than to the window,
     * and all of them held by module-level singletons that outlive this call.
     * Nothing asks for them again until the next export, so they are handed
     * back here — on the cancel and failure paths as much as on success.
     */
    void releaseExportReaders();
    releaseExportSurfaces();
    exportProcessor.dispose();
  }
};

/**
 * Renders every audible clip into a single PCM buffer using the same scheduling
 * the preview uses, so the export matches what was heard.
 */
const mixAudio = async (scene: Scene, startUs: number, spanUs: number): Promise<AudioBuffer | null> => {
  const clips = audibleClips(scene.clips, scene.tracks, startUs);
  if (clips.length === 0) return null;

  const buffers = await Promise.all(clips.map(clip => getAudioBuffer(clip.assetId).then(buffer => ({ clip, buffer }))));
  const usable = buffers.filter((entry): entry is { clip: (typeof clips)[number]; buffer: AudioBuffer } => entry.buffer !== null);
  if (usable.length === 0) return null;

  const durationSeconds = spanUs / US;
  const offline = new OfflineAudioContext({
    numberOfChannels: MIX_CHANNELS,
    length: Math.max(1, Math.ceil(durationSeconds * MIX_SAMPLE_RATE)),
    sampleRate: MIX_SAMPLE_RATE
  });

  const trackVolumes = new Map(scene.tracks.map(track => [track.id, track.volume]));
  for (const { clip, buffer } of usable) {
    scheduleClipAudio(offline, offline.destination, clip, buffer, startUs, 0, trackVolumes.get(clip.trackId) ?? 1);
  }

  return offline.startRendering();
};

/** Splits a buffer into consecutive chunks; `AudioBufferSource` butts them together. */
const sliceAudioBuffer = (buffer: AudioBuffer, seconds: number): AudioBuffer[] => {
  const sliceLength = Math.max(1, Math.floor(seconds * buffer.sampleRate));
  const slices: AudioBuffer[] = [];

  for (let offset = 0; offset < buffer.length; offset += sliceLength) {
    const length = Math.min(sliceLength, buffer.length - offset);
    const slice = new AudioBuffer({ length, sampleRate: buffer.sampleRate, numberOfChannels: buffer.numberOfChannels });
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      slice.copyToChannel(buffer.getChannelData(channel).subarray(offset, offset + length), channel);
    }
    slices.push(slice);
  }

  return slices;
};

/** Sensible bitrate for a resolution/frame-rate pair, in bits per second. */
export const suggestBitrate = (width: number, height: number, fps: number) => {
  const pixels = width * height;
  const perPixel = 0.07; // bits per pixel per frame at a good quality/size balance
  return Math.round(Math.min(60_000_000, Math.max(1_000_000, pixels * fps * perPixel)));
};

/** Size presets only — the container is chosen separately. */
export interface ExportPreset {
  name: string;
  description: string;
  width: number;
  height: number;
  fps: number;
  qualityScale: number;
}

/** Named targets, so nobody has to reason about bitrates to post a clip. */
export const EXPORT_PRESETS: ExportPreset[] = [
  { name: '1080p', description: '1920×1080 · 30fps', width: 1920, height: 1080, fps: 30, qualityScale: 1.2 },
  { name: '720p', description: '1280×720 · 30fps', width: 1280, height: 720, fps: 30, qualityScale: 1 },
  { name: 'Vertical', description: '1080×1920 · 30fps', width: 1080, height: 1920, fps: 30, qualityScale: 1.1 },
  { name: 'Square', description: '1080×1080 · 30fps', width: 1080, height: 1080, fps: 30, qualityScale: 1.1 }
];
