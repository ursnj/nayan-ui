import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec
} from 'mediabunny';
import { getAudioBuffer } from '../media/library';
import { US } from '../types';
import type { ExportSettings } from '../types';
import { audibleClips, scheduleClipAudio } from './audioEngine';
import { renderScene } from './compositor';
import type { Scene } from './compositor';

export type ExportStage = 'preparing' | 'audio' | 'video' | 'finalizing' | 'done';

export interface ExportProgress {
  stage: ExportStage;
  /** 0–1 across the whole job. */
  progress: number;
  message: string;
}

export class ExportCanceledError extends Error {
  constructor() {
    super('Export canceled');
  }
}

/** Codecs an MP4 can hold, best first. */
const VIDEO_CANDIDATES = ['avc', 'hevc', 'av1', 'vp9'] as const;
const AUDIO_CANDIDATES = ['aac', 'opus'] as const;

const MIX_SAMPLE_RATE = 48_000;
const MIX_CHANNELS = 2;
/** Audio is handed to the encoder in slices so progress stays responsive. */
const AUDIO_SLICE_SECONDS = 1;

/**
 * Renders the timeline to an MP4.
 *
 * The compositor is the same one the preview uses, pointed at an OffscreenCanvas
 * at export resolution — so what you saw is what you get. Video is walked frame
 * by frame at the target rate; audio is mixed in one offline pass first, since
 * `OfflineAudioContext` renders far faster than real time and gives the encoder
 * a clean, gapless PCM stream.
 */
export const exportProject = async (
  scene: Scene,
  settings: ExportSettings,
  durationUs: number,
  onProgress: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<Blob> => {
  const throwIfCanceled = () => {
    if (signal?.aborted) throw new ExportCanceledError();
  };

  onProgress({ stage: 'preparing', progress: 0, message: 'Checking codec support…' });
  throwIfCanceled();

  const durationSeconds = Math.max(0, durationUs) / US;
  if (durationSeconds <= 0) throw new Error('Nothing to export — the timeline is empty.');

  const videoQuality = new Quality({ bitrate: settings.bitrate });
  const videoCodec = await getFirstEncodableVideoCodec([...VIDEO_CANDIDATES], {
    width: settings.width,
    height: settings.height,
    quality: videoQuality
  });
  if (!videoCodec) throw new Error('This browser cannot encode video. Try a recent Chrome, Edge or Safari.');

  // Mix audio up front: it's cheap relative to video and tells us whether an
  // audio track is needed before the output is started (tracks are immutable
  // once `start()` is called).
  let mixedAudio: AudioBuffer | null = null;
  if (settings.includeAudio) {
    onProgress({ stage: 'audio', progress: 0.02, message: 'Mixing audio…' });
    mixedAudio = await mixAudio(scene, durationSeconds);
    throwIfCanceled();
  }

  const audioCodec = mixedAudio
    ? await getFirstEncodableAudioCodec([...AUDIO_CANDIDATES], {
        numberOfChannels: MIX_CHANNELS,
        sampleRate: MIX_SAMPLE_RATE,
        quality: new Quality({ bitrate: settings.audioBitrate })
      })
    : null;

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget()
  });

  const canvas = new OffscreenCanvas(settings.width, settings.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create the export canvas.');

  const videoSource = new CanvasSource(canvas, {
    codec: videoCodec,
    quality: videoQuality,
    keyFrameInterval: 2
  });
  output.addVideoTrack(videoSource, { frameRate: settings.fps });

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

    const frameCount = Math.max(1, Math.ceil(durationSeconds * settings.fps));
    for (let frame = 0; frame < frameCount; frame++) {
      throwIfCanceled();
      const timeUs = (frame / settings.fps) * US;
      await renderScene(context, exportScene, timeUs);
      await videoSource.add(frame / settings.fps, 1 / settings.fps);

      const ratio = (frame + 1) / frameCount;
      onProgress({
        stage: 'video',
        // Video occupies 10%–95% of the reported progress.
        progress: 0.1 + ratio * 0.85,
        message: `Encoding frame ${frame + 1} of ${frameCount}`
      });
    }
    videoSource.close();

    onProgress({ stage: 'finalizing', progress: 0.96, message: 'Writing MP4…' });
    await output.finalize();

    const buffer = output.target.buffer;
    if (!buffer) throw new Error('The muxer produced no output.');

    onProgress({ stage: 'done', progress: 1, message: 'Export complete' });
    return new Blob([buffer], { type: 'video/mp4' });
  } catch (error) {
    if (output.state === 'started' || output.state === 'pending') await output.cancel().catch(() => undefined);
    throw error;
  }
};

/**
 * Renders every audible clip into a single PCM buffer using the same scheduling
 * the preview uses, so the export matches what was heard.
 */
const mixAudio = async (scene: Scene, durationSeconds: number): Promise<AudioBuffer | null> => {
  const clips = audibleClips(scene.clips, scene.tracks, 0);
  if (clips.length === 0) return null;

  const buffers = await Promise.all(clips.map(clip => getAudioBuffer(clip.assetId).then(buffer => ({ clip, buffer }))));
  const usable = buffers.filter((entry): entry is { clip: (typeof clips)[number]; buffer: AudioBuffer } => entry.buffer !== null);
  if (usable.length === 0) return null;

  const offline = new OfflineAudioContext({
    numberOfChannels: MIX_CHANNELS,
    length: Math.max(1, Math.ceil(durationSeconds * MIX_SAMPLE_RATE)),
    sampleRate: MIX_SAMPLE_RATE
  });

  for (const { clip, buffer } of usable) {
    scheduleClipAudio(offline, offline.destination, clip, buffer, 0, 0);
  }

  return offline.startRendering();
};

/** Splits a buffer into consecutive chunks; `AudioBufferSource` butts them together. */
const sliceAudioBuffer = (buffer: AudioBuffer, seconds: number): AudioBuffer[] => {
  const sliceLength = Math.max(1, Math.floor(seconds * buffer.sampleRate));
  const slices: AudioBuffer[] = [];

  for (let offset = 0; offset < buffer.length; offset += sliceLength) {
    const length = Math.min(sliceLength, buffer.length - offset);
    const slice = new AudioBuffer({
      length,
      sampleRate: buffer.sampleRate,
      numberOfChannels: buffer.numberOfChannels
    });
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
  return Math.round(Math.min(40_000_000, Math.max(1_000_000, pixels * fps * perPixel)));
};
