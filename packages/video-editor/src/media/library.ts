import { ALL_FORMATS, AudioBufferSink, BlobSource, CanvasSink, Input, VideoSampleSink } from 'mediabunny';
import type { InputAudioTrack, InputVideoTrack } from 'mediabunny';
import { uid } from '../lib/utils';
import { US } from '../types';
import type { AssetKind, MediaAsset } from '../types';
import { SequentialVideoReader } from './frameReader';

/**
 * Decoders, bitmaps and PCM buffers can't live in the React store, so they're
 * held here and keyed by asset id. The store keeps only plain, serialisable
 * descriptions of each asset.
 */
interface AssetResources {
  input: Input | null;
  videoTrack: InputVideoTrack | null;
  audioTrack: InputAudioTrack | null;
  videoSink: VideoSampleSink | null;
  bitmap: ImageBitmap | null;
  audioBuffer: AudioBuffer | null;
  audioPromise: Promise<AudioBuffer | null> | null;
  peaks: Float32Array | null;
  objectUrl: string;
}

const resources = new Map<string, AssetResources>();

/** One decoder per on-screen clip. Capped so a busy timeline can't exhaust GPU memory. */
const MAX_READERS = 8;
const readers = new Map<string, { reader: SequentialVideoReader; assetId: string; usedAt: number }>();

export class UnsupportedMediaError extends Error {}

const kindForFile = (file: File): AssetKind => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'video';
};

/**
 * Probes a file and registers everything needed to play it back. Throws
 * `UnsupportedMediaError` when neither mediabunny nor the browser can read it.
 */
export const loadAsset = async (file: File): Promise<MediaAsset> => {
  const id = uid('asset');
  const objectUrl = URL.createObjectURL(file);
  const declaredKind = kindForFile(file);

  if (declaredKind === 'image') {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      URL.revokeObjectURL(objectUrl);
      throw new UnsupportedMediaError(`${file.name} is not a readable image`);
    }
    resources.set(id, {
      input: null,
      videoTrack: null,
      audioTrack: null,
      videoSink: null,
      bitmap,
      audioBuffer: null,
      audioPromise: null,
      peaks: null,
      objectUrl
    });
    return {
      id,
      kind: 'image',
      name: file.name,
      size: file.size,
      url: objectUrl,
      // Stills have no intrinsic length; 5s matches what CapCut drops in.
      durationUs: 5 * US,
      width: bitmap.width,
      height: bitmap.height,
      hasVideo: true,
      hasAudio: false,
      fps: 0,
      thumbnail: await bitmapToDataUrl(bitmap),
      webCodecs: false
    };
  }

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  if (!(await input.canRead())) {
    input.dispose();
    URL.revokeObjectURL(objectUrl);
    throw new UnsupportedMediaError(`${file.name} is not a supported media format`);
  }

  const videoTrack = await input.getPrimaryVideoTrack();
  const audioTrack = await input.getPrimaryAudioTrack();
  if (!videoTrack && !audioTrack) {
    input.dispose();
    URL.revokeObjectURL(objectUrl);
    throw new UnsupportedMediaError(`${file.name} contains no playable tracks`);
  }

  // A "video" file whose video track can't be decoded here is still useful as audio.
  const decodableVideo = videoTrack && (await videoTrack.canDecode()) ? videoTrack : null;
  const decodableAudio = audioTrack && (await audioTrack.canDecode()) ? audioTrack : null;
  if (!decodableVideo && !decodableAudio) {
    input.dispose();
    URL.revokeObjectURL(objectUrl);
    throw new UnsupportedMediaError(`${file.name} uses a codec this browser can't decode`);
  }

  const durationSeconds = await input.computeDuration();
  const kind: AssetKind = decodableVideo ? 'video' : 'audio';

  let width = 0;
  let height = 0;
  let fps = 0;
  if (decodableVideo) {
    width = await decodableVideo.getDisplayWidth();
    height = await decodableVideo.getDisplayHeight();
    const metrics = await decodableVideo.computeFrameRateMetrics().catch(() => null);
    fps = metrics?.bestGuessFrameRate ?? 30;
  }

  resources.set(id, {
    input,
    videoTrack: decodableVideo,
    audioTrack: decodableAudio,
    videoSink: decodableVideo ? new VideoSampleSink(decodableVideo) : null,
    bitmap: null,
    audioBuffer: null,
    audioPromise: null,
    peaks: null,
    objectUrl
  });

  const asset: MediaAsset = {
    id,
    kind,
    name: file.name,
    size: file.size,
    url: objectUrl,
    durationUs: Math.max(0, Math.round(durationSeconds * US)),
    width,
    height,
    hasVideo: !!decodableVideo,
    hasAudio: !!decodableAudio,
    fps,
    thumbnail: null,
    webCodecs: true
  };

  return asset;
};

/** Poster frame for the media panel. Generated after import so it never blocks it. */
export const generateThumbnail = async (assetId: string, timeUs = 0): Promise<string | null> => {
  const entry = resources.get(assetId);
  if (!entry) return null;
  if (entry.bitmap) return bitmapToDataUrl(entry.bitmap);
  if (!entry.videoTrack) return null;

  try {
    const sink = new CanvasSink(entry.videoTrack, { width: 320, fit: 'contain', poolSize: 1 });
    const wrapped = await sink.getCanvas(timeUs / US);
    if (!wrapped) return null;
    return canvasToDataUrl(wrapped.canvas);
  } catch {
    return null;
  }
};

/**
 * Evenly spaced stills along a clip, drawn behind the clip body in the timeline.
 * Uses `canvasesAtTimestamps`, which decodes each packet at most once for
 * monotonically increasing timestamps.
 */
export const generateFilmstrip = async (assetId: string, fromUs: number, toUs: number, count: number): Promise<string[]> => {
  const entry = resources.get(assetId);
  if (!entry) return [];
  if (entry.bitmap) {
    const url = await bitmapToDataUrl(entry.bitmap);
    return url ? Array.from({ length: count }, () => url) : [];
  }
  if (!entry.videoTrack || count <= 0) return [];

  const span = Math.max(0, toUs - fromUs);
  const timestamps = Array.from({ length: count }, (_, i) => (fromUs + (span * (i + 0.5)) / count) / US);

  try {
    const sink = new CanvasSink(entry.videoTrack, { width: 160, fit: 'contain', poolSize: 2 });
    const frames: string[] = [];
    for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
      frames.push(wrapped ? ((await canvasToDataUrl(wrapped.canvas)) ?? '') : '');
    }
    return frames;
  } catch {
    return [];
  }
};

/**
 * A reader is bound to a clip rather than an asset: two clips showing different
 * parts of the same file would otherwise fight over one decoder and force a
 * re-seek every frame.
 */
export const getReader = (clipId: string, assetId: string): SequentialVideoReader | null => {
  const existing = readers.get(clipId);
  if (existing && existing.assetId === assetId) {
    existing.usedAt = performance.now();
    return existing.reader;
  }
  if (existing) void releaseReader(clipId);

  const sink = resources.get(assetId)?.videoSink;
  if (!sink) return null;

  if (readers.size >= MAX_READERS) {
    // Evict the reader that hasn't rendered for the longest.
    let oldestId: string | null = null;
    let oldestAt = Infinity;
    for (const [id, entry] of readers) {
      if (entry.usedAt < oldestAt) {
        oldestAt = entry.usedAt;
        oldestId = id;
      }
    }
    if (oldestId) void releaseReader(oldestId);
  }

  const reader = new SequentialVideoReader(sink);
  readers.set(clipId, { reader, assetId, usedAt: performance.now() });
  return reader;
};

export const releaseReader = async (clipId: string) => {
  const entry = readers.get(clipId);
  if (!entry) return;
  readers.delete(clipId);
  await entry.reader.dispose();
};

export const releaseAllReaders = async () => {
  const entries = [...readers.values()];
  readers.clear();
  await Promise.all(entries.map(entry => entry.reader.dispose()));
};

export const getImageBitmap = (assetId: string): ImageBitmap | null => resources.get(assetId)?.bitmap ?? null;

/**
 * Fully decoded PCM for an asset, used both for Web Audio playback and for the
 * timeline waveform. Decoded once and cached; concurrent callers share one
 * in-flight promise.
 */
export const getAudioBuffer = async (assetId: string): Promise<AudioBuffer | null> => {
  const entry = resources.get(assetId);
  if (!entry) return null;
  if (entry.audioBuffer) return entry.audioBuffer;
  if (entry.audioPromise) return entry.audioPromise;
  if (!entry.audioTrack) return null;

  entry.audioPromise = decodeFullAudio(entry.audioTrack)
    .then(buffer => {
      entry.audioBuffer = buffer;
      if (buffer) entry.peaks = computePeaks(buffer, 2048);
      return buffer;
    })
    .catch(() => null)
    .finally(() => {
      entry.audioPromise = null;
    });

  return entry.audioPromise;
};

/** Normalised min/max pairs for waveform drawing. Null until audio is decoded. */
export const getPeaks = (assetId: string): Float32Array | null => resources.get(assetId)?.peaks ?? null;

export const releaseAsset = async (assetId: string) => {
  for (const [clipId, entry] of [...readers]) {
    if (entry.assetId === assetId) await releaseReader(clipId);
  }
  const entry = resources.get(assetId);
  if (!entry) return;
  resources.delete(assetId);
  entry.bitmap?.close();
  entry.input?.dispose();
  URL.revokeObjectURL(entry.objectUrl);
};

export const getVideoTrack = (assetId: string): InputVideoTrack | null => resources.get(assetId)?.videoTrack ?? null;

export const getAudioTrack = (assetId: string): InputAudioTrack | null => resources.get(assetId)?.audioTrack ?? null;

const decodeFullAudio = async (track: InputAudioTrack): Promise<AudioBuffer | null> => {
  const sink = new AudioBufferSink(track);
  const chunks: { buffer: AudioBuffer; timestamp: number }[] = [];
  let sampleRate = 0;
  let channels = 0;
  let endSeconds = 0;

  for await (const wrapped of sink.buffers()) {
    chunks.push({ buffer: wrapped.buffer, timestamp: wrapped.timestamp });
    sampleRate = Math.max(sampleRate, wrapped.buffer.sampleRate);
    channels = Math.max(channels, wrapped.buffer.numberOfChannels);
    endSeconds = Math.max(endSeconds, wrapped.timestamp + wrapped.duration);
  }
  if (chunks.length === 0 || !sampleRate) return null;

  const length = Math.max(1, Math.ceil(endSeconds * sampleRate));
  const output = new AudioBuffer({ length, sampleRate, numberOfChannels: channels });

  for (const chunk of chunks) {
    const offset = Math.round(chunk.timestamp * sampleRate);
    if (offset >= length) continue;
    for (let channel = 0; channel < channels; channel++) {
      // Mono sources feed every output channel.
      const source = chunk.buffer.getChannelData(Math.min(channel, chunk.buffer.numberOfChannels - 1));
      const writable = Math.min(source.length, length - offset);
      if (writable <= 0) continue;
      output.copyToChannel(writable === source.length ? source : source.subarray(0, writable), channel, offset);
    }
  }

  return output;
};

/** Down-samples channel 0 to `buckets` absolute peaks for the timeline waveform. */
const computePeaks = (buffer: AudioBuffer, buckets: number): Float32Array => {
  const data = buffer.getChannelData(0);
  const peaks = new Float32Array(buckets);
  const step = Math.max(1, Math.floor(data.length / buckets));
  for (let i = 0; i < buckets; i++) {
    const start = i * step;
    const end = Math.min(data.length, start + step);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const value = Math.abs(data[j]);
      if (value > peak) peak = value;
    }
    peaks[i] = peak;
  }
  return peaks;
};

const canvasToDataUrl = async (canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string | null> => {
  try {
    if (canvas instanceof HTMLCanvasElement) return canvas.toDataURL('image/jpeg', 0.7);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
};

const bitmapToDataUrl = async (bitmap: ImageBitmap): Promise<string | null> => {
  const scale = Math.min(1, 320 / Math.max(1, bitmap.width));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string | null>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
