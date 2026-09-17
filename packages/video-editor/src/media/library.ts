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
  /**
   * The file the asset came from, kept so a project can be bundled with its
   * media. Holding a `File` costs nothing — it is a handle to bytes the
   * browser already has on disk, not a copy in memory.
   */
  file: File;
  input: Input | null;
  videoTrack: InputVideoTrack | null;
  audioTrack: InputAudioTrack | null;
  videoSink: VideoSampleSink | null;
  bitmap: ImageBitmap | null;
  audioBuffer: AudioBuffer | null;
  audioPromise: Promise<AudioBuffer | null> | null;
  peaks: Float32Array | null;
  /**
   * The video track's first presentation timestamp, resolved on demand and
   * then kept. See `videoStartSeconds` for why anything needs to know it.
   */
  startPromise: Promise<number> | null;
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
/**
 * Probes a file and registers everything needed to play it back.
 *
 * `preferredId` exists for reopening a bundled project: clips reference their
 * asset by id, so restoring media under a freshly minted id would leave every
 * clip pointing at nothing.
 */
export const loadAsset = async (file: File, preferredId?: string): Promise<MediaAsset> => {
  const id = preferredId ?? uid('asset');
  /*
   * A `preferredId` can name an asset that is already registered — reopening
   * the project that is currently loaded is the ordinary case. `resources.set`
   * below would drop that entry on the floor with its decoder still open, its
   * bitmap still allocated, its decoded PCM still held and its object URL
   * never revoked, so it is released deliberately first.
   */
  if (resources.has(id)) await releaseAsset(id);

  const objectUrl = URL.createObjectURL(file);
  const declaredKind = kindForFile(file);

  if (declaredKind === 'image') {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      URL.revokeObjectURL(objectUrl);
      throw new UnsupportedMediaError(`${file.name} is not a readable image`);
    }
    resources.set(id, {
      file,
      input: null,
      videoTrack: null,
      audioTrack: null,
      videoSink: null,
      bitmap,
      audioBuffer: null,
      audioPromise: null,
      peaks: null,
      startPromise: null,
      objectUrl
    });
    return {
      id,
      kind: 'image',
      name: file.name,
      type: file.type,
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
    file,
    input,
    videoTrack: decodableVideo,
    audioTrack: decodableAudio,
    videoSink: decodableVideo ? new VideoSampleSink(decodableVideo) : null,
    bitmap: null,
    audioBuffer: null,
    audioPromise: null,
    peaks: null,
    startPromise: null,
    objectUrl
  });

  const asset: MediaAsset = {
    id,
    kind,
    name: file.name,
    type: file.type,
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

/* ------------------------------------------------------------------ *
 * Decode scheduling
 * ------------------------------------------------------------------ */

/**
 * Poster frames and filmstrips run one job at a time.
 *
 * Each job opens a decoder of its own, and every visible clip wants a strip as
 * it mounts — a dozen clips would start a dozen hardware decoders at once and
 * stall playback. This used to be a plain FIFO promise chain, which fixed that
 * and created a worse problem: nothing could be reordered or given up on, so
 * one zoom step queued a job per clip and the strip for the clip under the
 * cursor waited behind every one of them, at a second or more apiece.
 *
 * So the order matters as much as the limit:
 *
 * - Poster frames go first and in request order. They are a single frame each,
 *   and every clip of that asset paints it immediately as its placeholder, so
 *   one cheap job improves the look of the whole timeline.
 * - Filmstrips run newest-first. The most recent request is the one describing
 *   what is on screen *now*; the older ones describe a zoom level the user has
 *   already left. Past a queue depth they are dropped outright.
 * - A job nobody is waiting for any more is abandoned mid-decode, and two
 *   callers asking for the same thing share one job.
 */
const MAX_QUEUED_STRIPS = 12;

interface Job {
  key: string;
  /** Callers still interested. At zero the job is abandoned. */
  waiters: number;
  controller: AbortController;
  run: (signal: AbortSignal) => Promise<unknown>;
  /** Handed back when the job is dropped instead of run. */
  fallback: unknown;
  resolve: (value: unknown) => void;
  promise: Promise<unknown>;
}

const jobsByKey = new Map<string, Job>();
/** Taken from the front: one frame each, first come first served. */
const posterJobs: Job[] = [];
/** Taken from the back: the newest request is the one on screen. */
const stripJobs: Job[] = [];
let draining = false;

const dropJob = (job: Job) => {
  jobsByKey.delete(job.key);
  for (const queue of [posterJobs, stripJobs]) {
    const index = queue.indexOf(job);
    if (index >= 0) queue.splice(index, 1);
  }
  // Tells a job already under way to stop between frames.
  job.controller.abort();
  job.resolve(job.fallback);
};

const drain = async () => {
  if (draining) return;
  draining = true;
  try {
    while (posterJobs.length > 0 || stripJobs.length > 0) {
      const job = posterJobs.shift() ?? stripJobs.pop();
      if (!job) break;
      if (job.controller.signal.aborted) continue;
      try {
        job.resolve(await job.run(job.controller.signal));
      } catch {
        job.resolve(job.fallback);
      } finally {
        // Only if it is still the job registered under that key: one dropped
        // mid-run may already have been replaced by a fresh request for the
        // same thing, and that one is not this one's to unregister.
        if (jobsByKey.get(job.key) === job) jobsByKey.delete(job.key);
      }
    }
  } finally {
    draining = false;
  }
};

/**
 * Queues `run`, or joins the job already queued under the same key.
 *
 * `signal` is the *caller* losing interest — a clip unmounting, a trim handle
 * moving on — rather than a cancellation of the work: the job only stops once
 * every caller has gone.
 */
const schedule = <T>(
  key: string,
  kind: 'poster' | 'strip',
  signal: AbortSignal | undefined,
  run: (signal: AbortSignal) => Promise<T>,
  fallback: T
): Promise<T> => {
  if (signal?.aborted) return Promise.resolve(fallback);

  let job = jobsByKey.get(key);
  if (!job) {
    let resolve!: (value: unknown) => void;
    const promise = new Promise<unknown>(settle => (resolve = settle));
    job = { key, waiters: 0, controller: new AbortController(), run: run as Job['run'], fallback, resolve, promise };
    jobsByKey.set(key, job);

    if (kind === 'poster') {
      posterJobs.push(job);
    } else {
      stripJobs.push(job);
      // The oldest waiting strips describe a view that has moved on. Their
      // callers are told so, and ask again if they are still there.
      while (stripJobs.length > MAX_QUEUED_STRIPS) dropJob(stripJobs[0]);
    }
    void drain();
  }

  const joined = job;
  joined.waiters++;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    joined.waiters--;
    if (joined.waiters === 0) dropJob(joined);
  };
  signal?.addEventListener('abort', release, { once: true });

  return joined.promise.then(value => {
    released = true;
    signal?.removeEventListener('abort', release);
    return value as T;
  });
};

/* ------------------------------------------------------------------ *
 * Poster frames and filmstrips
 * ------------------------------------------------------------------ */

/**
 * Where the video actually starts, in seconds.
 *
 * Both APIs below resolve a timestamp to the frame *at or before* it, and
 * return null when there is no such frame. A file whose first video packet
 * starts after zero — an edit list, a trimmed export, a stream with a
 * presentation offset — therefore answers nothing at all for `t = 0`: the
 * media panel got no poster frame and the head of every clip came back blank,
 * with no error to explain either. Requests are clamped to this instead.
 *
 * Playback never hit it, which is why the preview looked fine: the player
 * reads through `samples(t)`, which yields forward from `t` and so lands on
 * the first frame by itself.
 */
const videoStartSeconds = async (entry: AssetResources): Promise<number> => {
  if (!entry.videoTrack) return 0;
  entry.startPromise ??= entry.videoTrack.getFirstTimestamp().catch(() => 0);
  // A negative first timestamp means offset timing; those frames are not meant
  // to be presented, so zero is still the floor.
  return Math.max(0, await entry.startPromise);
};

/** Wide enough for the media panel card and for a tall timeline row. */
const POSTER_WIDTH = 320;

/** Poster frame for the media panel. Generated after import so it never blocks it. */
export const generateThumbnail = async (assetId: string, timeUs = 0): Promise<string | null> => {
  const entry = resources.get(assetId);
  if (!entry) return null;
  if (entry.bitmap) return bitmapToDataUrl(entry.bitmap);
  if (!entry.videoTrack) return null;
  // Scheduled because a folder dropped on the media panel fires one of these
  // per file without waiting, which opened a decoder per file at once.
  return schedule<string | null>(`poster:${assetId}:${Math.round(timeUs)}`, 'poster', undefined, () => buildThumbnail(entry, timeUs), null);
};

const buildThumbnail = async (entry: AssetResources, timeUs: number): Promise<string | null> => {
  const track = entry.videoTrack;
  if (!track) return null;

  try {
    const sink = new CanvasSink(track, { width: POSTER_WIDTH, poolSize: 0 });
    const startSeconds = await videoStartSeconds(entry);
    const wrapped = await sink.getCanvas(Math.max(startSeconds, timeUs / US));
    if (wrapped) return canvasToDataUrl(wrapped.canvas);

    // Nothing at or before that instant even after clamping — a track whose
    // index disagrees with its packets. Take the first frame it will give up.
    for await (const first of sink.canvases()) {
      return canvasToDataUrl(first.canvas);
    }
    return null;
  } catch {
    return null;
  }
};

export interface FilmstripRequest {
  /** The caller's cache key; also the identity two callers are deduped on. */
  key: string;
  assetId: string;
  fromUs: number;
  toUs: number;
  count: number;
  /** Tile width in device pixels, so a wide clip isn't upscaled from a thumbnail. */
  tilePx: number;
}

/**
 * Generated strips, keyed by the caller's cache key.
 *
 * The frames are object URLs rather than data URLs. Base64 costs a third more
 * bytes and keeps every frame on the JS heap as a string, but the real reason
 * is the encode: `toDataURL` is synchronous, so a 24-tile strip meant 24 JPEG
 * encodes on the main thread, and that landed as a visible hitch each time a
 * clip mounted. `toBlob` hands the work to the browser to do off-thread.
 *
 * Owning URLs means eviction has to revoke them — see `rememberStrip` and
 * `forgetStrips`.
 */
const STRIP_CACHE_LIMIT = 120;
const strips = new Map<string, { assetId: string; frames: string[] }>();

const revokeFrames = (frames: string[]) => {
  for (const frame of frames) if (frame) URL.revokeObjectURL(frame);
};

/**
 * Caches a finished strip.
 *
 * Never called for a key that already has one: a cached strip's URLs are the
 * ones the timeline is painting from, and replacing the entry would revoke
 * them out from under a clip that has no reason to re-render. `buildFilmstrip`
 * checks first and discards its own frames instead.
 */
const rememberStrip = (key: string, assetId: string, frames: string[]) => {
  strips.set(key, { assetId, frames });
  // Map iteration is insertion order, so the front is the oldest strip.
  while (strips.size > STRIP_CACHE_LIMIT) {
    const oldest = strips.keys().next().value;
    if (oldest === undefined || oldest === key) break;
    const evicted = strips.get(oldest);
    strips.delete(oldest);
    if (evicted) revokeFrames(evicted.frames);
  }
};

/** Drops every strip made from an asset, on the way to releasing it. */
const forgetStrips = (assetId: string) => {
  for (const [key, entry] of strips) {
    if (entry.assetId !== assetId) continue;
    strips.delete(key);
    revokeFrames(entry.frames);
  }
};

/** A strip that has already been generated, for reading during render. */
export const getFilmstrip = (key: string): string[] | null => strips.get(key)?.frames ?? null;

/**
 * Evenly spaced stills along a clip, drawn behind the clip body.
 *
 * Resolves to the frames, to `[]` when the asset has no stills to give, or to
 * `null` when the job was abandoned — the queue was busy with newer work, or a
 * decode failed. `null` is worth asking about again; `[]` is not.
 */
export const requestFilmstrip = (request: FilmstripRequest, signal?: AbortSignal): Promise<string[] | null> => {
  const cached = strips.get(request.key);
  if (cached) return Promise.resolve(cached.frames);
  return schedule<string[] | null>(request.key, 'strip', signal, jobSignal => buildFilmstrip(request, jobSignal), null);
};

const buildFilmstrip = async ({ key, assetId, fromUs, toUs, count, tilePx }: FilmstripRequest, signal: AbortSignal): Promise<string[] | null> => {
  const entry = resources.get(assetId);
  if (!entry?.videoTrack || count <= 0) return [];

  // Another job may have answered this key while this one waited its turn —
  // a clip that unmounted mid-decode and came straight back asks again, and
  // the first job still finishes and caches. Decoding it twice would be waste;
  // the danger is the second result replacing URLs already on screen.
  const ready = strips.get(key);
  if (ready) return ready.frames;

  const startSeconds = await videoStartSeconds(entry);
  if (signal.aborted) return null;

  const span = Math.max(0, toUs - fromUs);
  // Monotonically non-decreasing, which is what lets `canvasesAtTimestamps`
  // decode each packet once; clamping can only flatten the start of the ramp,
  // and a repeated timestamp is answered from the same decoded frame.
  const timestamps = Array.from({ length: count }, (_, index) => Math.max(startSeconds, (fromUs + (span * (index + 0.5)) / count) / US));

  const sink = new CanvasSink(entry.videoTrack, { width: tilePx, poolSize: 0 });
  const encoding: Promise<string>[] = [];

  try {
    for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
      if (signal.aborted) break;
      /*
       * Encoding is started and not awaited, so it overlaps the next decode.
       * That is only safe because `poolSize: 0` gives each frame a canvas of
       * its own — with a pool, the surface being encoded is one the sink is
       * free to draw the next frame into.
       */
      encoding.push(wrapped ? canvasToUrl(wrapped.canvas) : Promise.resolve(''));
    }
  } catch {
    // Decoder gave out part way; treat it as a partial below.
  }

  const frames = await Promise.all(encoding);

  if (signal.aborted || frames.length < count) {
    // Never cache a strip with holes in it: a cached answer is never asked
    // for again, so one bad decode would leave the clip blank for good.
    revokeFrames(frames);
    return null;
  }
  if (frames.every(frame => frame === '')) {
    // Answered in full, with nothing in it. Retrying would only fail again.
    return [];
  }

  // Checked again: the cache can have filled during the decode. Whoever got
  // there first owns the URLs the timeline is showing, so these are the ones
  // to throw away.
  const winner = strips.get(key);
  if (winner) {
    revokeFrames(frames);
    return winner.frames;
  }

  rememberStrip(key, assetId, frames);
  return frames;
};

/**
 * A reader is bound to a clip rather than an asset: two clips showing different
 * parts of the same file would otherwise fight over one decoder and force a
 * re-seek every frame.
 *
 * `target` keeps preview and export on separate readers — an export walks the
 * timeline from the start while the user may still be scrubbing, and sharing a
 * reader would make each seek thrash the other.
 */
export const getReader = (clipId: string, assetId: string, target: 'preview' | 'export' = 'preview'): SequentialVideoReader | null => {
  const key = `${target}:${clipId}`;
  const existing = readers.get(key);
  if (existing && existing.assetId === assetId) {
    existing.usedAt = performance.now();
    return existing.reader;
  }
  if (existing) void releaseReader(key);

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
  readers.set(key, { reader, assetId, usedAt: performance.now() });
  return reader;
};

/** Accepts either a bare clip id (releases both targets) or a `target:clipId` key. */
export const releaseReader = async (keyOrClipId: string) => {
  const keys = keyOrClipId.includes(':') ? [keyOrClipId] : [`preview:${keyOrClipId}`, `export:${keyOrClipId}`];
  await Promise.all(
    keys.map(async key => {
      const entry = readers.get(key);
      if (!entry) return;
      readers.delete(key);
      await entry.reader.dispose();
    })
  );
};

/** Frees the decoders an export spun up, leaving the preview's alone. */
export const releaseExportReaders = async () => {
  await Promise.all([...readers.keys()].filter(key => key.startsWith('export:')).map(releaseReader));
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
  for (const [key, entry] of readers) {
    if (entry.assetId === assetId) await releaseReader(key);
  }
  const entry = resources.get(assetId);
  if (!entry) return;
  resources.delete(assetId);
  // The strips are object URLs this module minted, so they have to be revoked
  // rather than simply forgotten.
  forgetStrips(assetId);
  entry.bitmap?.close();
  entry.input?.dispose();
  URL.revokeObjectURL(entry.objectUrl);
};

/**
 * Frees every asset the store is no longer holding.
 *
 * Opening a project replaces the whole media library, and the entries here are
 * keyed by asset id rather than reachable from React state — so without this
 * the previous project's decoders, bitmaps and decoded PCM stay for the rest
 * of the session. A fully decoded stereo track is about 23MB a minute, so two
 * or three projects is enough to matter.
 */
export const releaseAssetsExcept = async (keepIds: Iterable<string>) => {
  const keep = new Set(keepIds);
  const doomed = [...resources.keys()].filter(id => !keep.has(id));
  await Promise.all(doomed.map(releaseAsset));
};

/** The file an asset was imported from, for writing it into a project bundle. */
export const getAssetFile = (assetId: string): File | null => resources.get(assetId)?.file ?? null;

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

const JPEG_QUALITY = 0.7;

/**
 * A JPEG of the canvas, encoded off the main thread where the browser can.
 *
 * `toDataURL` is the synchronous alternative and it blocks for the whole
 * encode, which is the wrong trade for a filmstrip: the tiles are wanted
 * soon, not instantly, and there are up to 24 of them per clip.
 */
const canvasToBlob = (canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob | null> => {
  if (!(canvas instanceof HTMLCanvasElement)) {
    return canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY }).catch(() => null);
  }
  return new Promise(resolve => {
    try {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', JPEG_QUALITY);
    } catch {
      resolve(null);
    }
  });
};

/** An empty string for a frame that could not be encoded; the caller tiles around it. */
const canvasToUrl = async (canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string> => {
  const blob = await canvasToBlob(canvas);
  return blob ? URL.createObjectURL(blob) : '';
};

/**
 * Poster frames stay data URLs on purpose: there is one per asset, it lives in
 * the store for as long as the asset does, and it is rendered by both the media
 * panel and the timeline — a URL with no owner is worth more here than the
 * encode time it costs once.
 */
const canvasToDataUrl = async (canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string | null> => {
  try {
    if (canvas instanceof HTMLCanvasElement) return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
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
    reader.addEventListener('load', () => resolve(typeof reader.result === 'string' ? reader.result : null), { once: true });
    reader.addEventListener('error', () => resolve(null), { once: true });
    reader.readAsDataURL(blob);
  });
