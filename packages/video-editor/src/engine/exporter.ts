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

/** How long the end credit holds, when it is included. */
export const END_CREDIT_SECONDS = 2;
/** The card's two lines, under the logo. */
export const END_CREDIT_TITLE = 'Nayan UI';
export const END_CREDIT_SUBTITLE = 'Free Online Video Editor';
/** Sits against the bottom edge rather than in the centred stack. */
export const END_CREDIT_URL = 'www.nayanui.com/video-editor';
/**
 * When each part of the card arrives, as fractions of the card's own length.
 *
 * The three elements are staggered rather than fading in together: the logo
 * lands first, the name follows while the logo is still settling, and the line
 * beneath it last. The overlap is what makes it read as one movement instead of
 * three — each begins before the one before it has finished.
 *
 * Everything is expressed against the card's length, so changing
 * `END_CREDIT_SECONDS` re-times the whole sequence and nothing needs adjusting
 * to match.
 */
const CREDIT_MOTION = {
  logo: { from: 0, to: 0.4 },
  title: { from: 0.12, to: 0.52 },
  subtitle: { from: 0.24, to: 0.64 },
  /** Last in, and early enough to leave a real hold behind it. */
  url: { from: 0.34, to: 0.74 },
  /** How far each element travels up as it arrives, as a fraction of height. */
  rise: 0.028,
  /** The logo's scale as its entrance begins. */
  logoFrom: 0.86,
  /** Peak opacity of the glow behind the stack. */
  glow: 0.26
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Fast off the mark, soft on the landing — the shape most motion wants. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** How far into its own entrance an element is at this point in the card. */
const stageAt = (progress: number, stage: { from: number; to: number }) => easeOut(clamp01((progress - stage.from) / (stage.to - stage.from)));

/**
 * How the held frame behind the card behaves.
 *
 * The blur is what lets text sit on footage at all: over a sharp frame a
 * wordmark competes with whatever happens to be under it, and legibility then
 * depends on the clip. Blurred and dimmed, any frame becomes a ground.
 */
const CREDIT_BACKDROP = {
  /** Blur radius as a fraction of frame height, applied once at capture. */
  blur: 0.014,
  /** Extra scale, so the still drifts instead of sitting dead. */
  zoom: 0.05,
  /** Scrim opacity at the cut, and once the card has assembled. */
  scrimFrom: 0.45,
  scrimTo: 0.82,
  /** Fraction of the card over which the scrim deepens. */
  scrimIn: 0.5
};

/** Every measurement on the card, as a fraction of the frame height. */
const CREDIT_LAYOUT = {
  logoHeight: 0.1,
  logoGap: 0.015,
  titleSize: 0.042,
  titleGap: 0.03,
  subtitleSize: 0.022,
  urlSize: 0.024,
  /** Distance from the frame's bottom edge to the top of the URL. */
  urlBottom: 0.07
};

/**
 * The logo, decoded once per session.
 *
 * It lives in `public/`, so it is served from the app's base path rather than
 * bundled — `BASE_URL` is what makes that work under `/video-editor/start/` in
 * production as well as in dev. Decoding is a one-off: an export draws the card
 * sixty times a second and none of those frames should be waiting on a fetch.
 *
 * A failure resolves to null rather than throwing. A logo that cannot be
 * decoded is a reason to fall back to the wordmark alone, never a reason to
 * fail an export the user has already waited for.
 */
let logoPromise: Promise<ImageBitmap | null> | null = null;

const loadCreditLogo = (): Promise<ImageBitmap | null> => {
  logoPromise ??= (async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}logo.webp`);
      if (!response.ok) return null;
      return await createImageBitmap(await response.blob());
    } catch {
      return null;
    }
  })();
  return logoPromise;
};

/**
 * The card that plays after the last frame of the timeline.
 *
 * Deliberately not a clip. Going through the compositor would mean inventing a
 * text clip on a track that does not exist, at a time past the end of the
 * project, and every part of the editor that walks the timeline would then have
 * to know to ignore it. It is a card drawn straight onto the export canvas, in
 * the one place that wants it.
 *
 * The logo, the name and the line beneath it are measured as one block and then
 * centred as one, so the stack stays optically centred whether or not the logo
 * arrived — rather than the text sitting low in the frame with a gap above it.
 *
 * `progress` runs 0→1 across the card so it can fade up and away rather than
 * cutting in, which reads as an ending instead of a glitch.
 */
const drawEndCredit = (
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  logo: ImageBitmap | null,
  backdrop: OffscreenCanvas | HTMLCanvasElement | null
) => {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';

  context.fillStyle = '#07090f';
  context.fillRect(0, 0, width, height);

  /*
   * The film itself, held under the card.
   *
   * This is the last frame of the timeline, blurred once when it was captured
   * rather than per frame — a 4K blur sixty times a second would cost more than
   * the rest of the card put together. It drifts in very slightly across the
   * hold, which is the difference between a freeze frame that feels intended
   * and one that looks like playback stalled.
   *
   * The scrim over it deepens as the card assembles, so the cut out of the
   * timeline lands on something close to the picture you were just watching and
   * settles behind the credits rather than snapping to black.
   */
  if (backdrop) {
    const zoom = 1 + CREDIT_BACKDROP.zoom * easeOut(progress);
    const drawWidth = width * zoom;
    const drawHeight = height * zoom;
    context.drawImage(backdrop, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

    const scrim =
      CREDIT_BACKDROP.scrimFrom + (CREDIT_BACKDROP.scrimTo - CREDIT_BACKDROP.scrimFrom) * easeOut(clamp01(progress / CREDIT_BACKDROP.scrimIn));
    context.fillStyle = `rgba(7, 9, 15, ${scrim})`;
    context.fillRect(0, 0, width, height);
  }

  /*
   * Nothing fades out. The card used to dip away over its last fifth, which
   * meant the video ended on an empty frame — the last thing anyone sees was a
   * black rectangle, and a paused player parks on it. So the sequence only ever
   * assembles: each element arrives on its own timing and then holds, and the
   * final frame of the file is the finished card at full opacity.
   *
   * Nothing needs a global fade *in* either, since every element brings its own.
   */

  // Sized against the frame, like everything else in the model, so the card
  // looks the same at 720p and at 4K.
  const logoHeight = logo ? height * CREDIT_LAYOUT.logoHeight : 0;
  const logoWidth = logo ? logoHeight * (logo.width / logo.height) : 0;
  const logoGap = logo ? height * CREDIT_LAYOUT.logoGap : 0;
  const titleSize = Math.max(12, height * CREDIT_LAYOUT.titleSize);
  const titleGap = height * CREDIT_LAYOUT.titleGap;
  const subtitleSize = Math.max(10, height * CREDIT_LAYOUT.subtitleSize);

  const blockHeight = logoHeight + logoGap + titleSize + titleGap + subtitleSize;
  const blockTop = (height - blockHeight) / 2;
  const rise = height * CREDIT_MOTION.rise;

  const logoIn = stageAt(progress, CREDIT_MOTION.logo);
  const titleIn = stageAt(progress, CREDIT_MOTION.title);
  const subtitleIn = stageAt(progress, CREDIT_MOTION.subtitle);

  context.textAlign = 'center';
  context.textBaseline = 'top';

  /*
   * A soft bloom behind the stack, arriving with the logo. It does the work a
   * flat background cannot: gives the frame a centre, and stops the wordmark
   * reading as text pasted onto black. Drawn first so everything else sits on
   * top of it, and kept low enough to be felt rather than seen.
   */
  const glowRadius = Math.max(width, height) * 0.42;
  const glow = context.createRadialGradient(width / 2, blockTop + blockHeight / 2, 0, width / 2, blockTop + blockHeight / 2, glowRadius);
  glow.addColorStop(0, `rgba(99, 102, 241, ${CREDIT_MOTION.glow * logoIn})`);
  glow.addColorStop(1, 'rgba(99, 102, 241, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  let y = blockTop;

  if (logo) {
    /*
     * Scaled about its own centre, so it grows into place rather than drifting
     * right as it gets bigger — which is what scaling a top-left anchored draw
     * would do.
     */
    const scale = CREDIT_MOTION.logoFrom + (1 - CREDIT_MOTION.logoFrom) * logoIn;
    const drawWidth = logoWidth * scale;
    const drawHeight = logoHeight * scale;
    context.globalAlpha = logoIn;
    context.drawImage(logo, (width - drawWidth) / 2, y + (logoHeight - drawHeight) / 2 + rise * (1 - logoIn), drawWidth, drawHeight);
    y += logoHeight + logoGap;
  }

  context.globalAlpha = titleIn;
  context.font = `700 ${titleSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  context.fillStyle = '#f5f7fb';
  context.fillText(END_CREDIT_TITLE, width / 2, y + rise * (1 - titleIn));
  y += titleSize + titleGap;

  context.globalAlpha = subtitleIn;
  context.font = `400 ${subtitleSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  context.fillStyle = '#9aa3b2';
  context.fillText(END_CREDIT_SUBTITLE, width / 2, y + rise * (1 - subtitleIn));

  /*
   * The address is measured from the bottom edge, not from the stack above it.
   * It is a footer rather than a fourth line: hung off the block it would drag
   * the whole thing off centre, and a URL belongs at the edge of the frame
   * where it can be read without competing with the name.
   */
  const urlSize = Math.max(9, height * CREDIT_LAYOUT.urlSize);
  const urlIn = stageAt(progress, CREDIT_MOTION.url);
  context.globalAlpha = urlIn;
  context.font = `400 ${urlSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  context.fillStyle = '#7f8899';
  context.fillText(END_CREDIT_URL, width / 2, height - height * CREDIT_LAYOUT.urlBottom - urlSize + rise * (1 - urlIn));

  context.globalAlpha = 1;
  context.textBaseline = 'alphabetic';
};

/**
 * One at a time, whatever it is.
 *
 * The real export and the size probe drive the same things: the `export`-keyed
 * decoders and scratch surfaces, the export GPU processor, and a hardware video
 * encoder. Two of them at once is not a slow path, it is a broken one — and it
 * was reachable, because the probe now starts by itself. Pressing Export while
 * one was in flight left the probe's cleanup releasing readers and destroying
 * the GL context underneath an export that had just begun, with two full-frame
 * encode pipelines allocated at the same time.
 *
 * Queuing them here rather than in the dialog means nothing has to remember to
 * check: the caller that gets there second simply waits. A probe is aborted by
 * the dialog the moment an export starts and checks that between frames, so
 * the export waits for one frame of unwinding, not for a whole measurement.
 */
let exportChain: Promise<unknown> = Promise.resolve();

const exclusive = <T>(run: () => Promise<T>): Promise<T> => {
  const task = exportChain.then(run, run);
  // Swallowed so one failure doesn't reject every later caller in the queue.
  exportChain = task.catch(() => undefined);
  return task;
};

/** Windows sampled by the probe, and how long each one runs. */
const PROBE_WINDOWS = 3;
/**
 * Short, because this now runs by itself whenever the dialog opens or a setting
 * changes rather than on a button. Half a second still contains a keyframe and
 * a dozen-odd deltas at any sane frame rate, which is what the sample needs to
 * be representative; longer only buys precision the row cannot display.
 */
const PROBE_WINDOW_SECONDS = 0.5;

/**
 * Measures the file size by encoding a little of it.
 *
 * No formula can do this. The encoder runs at a variable bitrate and the size
 * of a frame depends on what is in it — grain, motion and detail cost, flat
 * colour and stillness are nearly free — so bitrate × duration is only ever an
 * upper bound, and it overshoots typical footage several times over. The way to
 * know is to ask the encoder.
 *
 * So this encodes three short windows spread across the range, at the real
 * size, codec, quality and frame rate, and scales what comes out. Three windows
 * rather than one because a timeline is rarely uniform — titles at the top,
 * footage in the middle — and a single sample from the wrong place is a
 * confident wrong answer.
 *
 * Each window runs for long enough to contain its own keyframe *and* a run of
 * the cheap delta frames that follow it, so the sample carries the same mix of
 * frame types as the real encode. Sampling single frames scattered about would
 * make every one of them a keyframe and land back where the formula was.
 *
 * The audio is added arithmetically rather than measured: at a fixed bitrate it
 * genuinely is duration × rate.
 */
const runProbe = async (
  scene: Scene,
  settings: ExportSettings,
  durationUs: number,
  formatId: string,
  signal?: AbortSignal
): Promise<number | null> => {
  const format = findFormat(formatId);
  if (format.kind === 'audio') return null;

  const container = format.create();
  const videoQuality = new Quality({ bitrate: settings.bitrate });
  const videoCodec = await getFirstEncodableVideoCodec(candidates(VIDEO_PREFERENCE, container.getSupportedVideoCodecs()), {
    width: settings.width,
    height: settings.height,
    quality: videoQuality
  });
  if (!videoCodec) return null;

  const startUs = settings.rangeUs?.startUs ?? 0;
  const endUs = settings.rangeUs?.endUs ?? durationUs;
  const spanSeconds = Math.max(0, endUs - startUs) / US;
  if (spanSeconds <= 0) return null;

  const creditSeconds = settings.endCredit ? END_CREDIT_SECONDS : 0;
  const windowSeconds = Math.min(PROBE_WINDOW_SECONDS, spanSeconds);
  const framesPerWindow = Math.max(2, Math.round(windowSeconds * settings.fps));

  const canvas = new OffscreenCanvas(settings.width, settings.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return null;

  const output = new Output({ format: container, target: new BufferTarget() });
  const videoSource = new CanvasSource(canvas, { codec: videoCodec, quality: videoQuality, keyFrameInterval: 2 });
  output.addVideoTrack(videoSource, { frameRate: settings.fps });

  const exportScene: Scene = {
    ...scene,
    project: { ...scene.project, width: settings.width, height: settings.height, fps: settings.fps }
  };

  let encoded = 0;
  try {
    await output.start();
    for (let window = 0; window < PROBE_WINDOWS; window++) {
      // Spread the windows over the range without ever running off its end.
      const at = PROBE_WINDOWS > 1 ? (window / (PROBE_WINDOWS - 1)) * Math.max(0, spanSeconds - windowSeconds) : 0;
      for (let frame = 0; frame < framesPerWindow; frame++) {
        if (signal?.aborted) return null;
        const sceneTimeUs = Math.min(startUs + (at + frame / settings.fps) * US, endUs - 1);
        await renderScene(context, exportScene, sceneTimeUs, { target: 'export' });
        await videoSource.add(encoded / settings.fps, 1 / settings.fps);
        encoded++;
      }
    }
    videoSource.close();
    await output.finalize();
  } catch {
    return null;
  } finally {
    // The probe used the export's own readers and surfaces; hand them back so a
    // glance at the estimate doesn't hold a decoder open for the session.
    await releaseExportReaders();
    releaseExportSurfaces();
    exportProcessor.dispose();
  }

  const buffer = output.target.buffer;
  if (!buffer || encoded === 0) return null;

  /*
   * Container overhead rides along in the sample, which makes the per-second
   * figure slightly high — and that is the direction to be wrong in. The credit
   * is counted at the same rate although it is cheaper than footage, for the
   * same reason.
   */
  const videoBytesPerSecond = buffer.byteLength / (encoded / settings.fps);
  const audioBytesPerSecond = settings.includeAudio ? settings.audioBitrate / 8 : 0;
  return (videoBytesPerSecond + audioBytesPerSecond) * (spanSeconds + creditSeconds);
};

/**
 * Measures the size, one job at a time — see `exclusive`.
 */
export const probeExportBytes = (
  scene: Scene,
  settings: ExportSettings,
  durationUs: number,
  formatId: string,
  signal?: AbortSignal
): Promise<number | null> => exclusive(() => runProbe(scene, settings, durationUs, formatId, signal));

/**
 * Renders the timeline to a video file.
 *
 * The compositor is the same one the preview uses, pointed at an OffscreenCanvas
 * at output resolution — so what you saw is what you get. Video is walked frame
 * by frame at the target rate; audio is mixed in one offline pass first, since
 * `OfflineAudioContext` renders far faster than real time and gives the encoder
 * a clean, gapless PCM stream.
 */
const runExport = async (
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

  /*
   * The credit only applies where there is a picture to follow: an audio-only
   * bounce has nothing to show it on, and two seconds of silence appended to a
   * WAV would be a defect rather than a credit.
   */
  const creditSeconds = settings.endCredit && !videoOnlyAudioless ? END_CREDIT_SECONDS : 0;

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
    /*
     * Mixed over the credit as well, which costs one longer buffer and leaves
     * the two tracks the same length. Nothing plays there — no clip reaches
     * past the timeline — so the extra span renders as silence, and a player
     * that takes its duration from the audio track still reports the whole
     * file rather than cutting the card off the end.
     */
    mixedAudio = await mixAudio(scene, startUs, spanUs + creditSeconds * US);
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
      const timelineFrames = Math.max(1, Math.ceil(durationSeconds * settings.fps));
      const creditFrames = Math.round(creditSeconds * settings.fps);
      const frameCount = timelineFrames + creditFrames;
      // Fetched and decoded before the loop, so no frame waits on it — and only
      // when there is a card to put it on.
      const creditLogo = creditFrames > 0 ? await loadCreditLogo() : null;
      /*
       * The last timeline frame, kept to sit under the card.
       *
       * Copied off the export canvas the moment it has been encoded, and
       * blurred on the way in — once, here, rather than on each of the sixty
       * frames that go on to use it. Null when there is no card, so an export
       * without one allocates nothing.
       */
      let creditBackdrop: OffscreenCanvas | null = null;
      const began = performance.now();

      for (let frame = 0; frame < frameCount; frame++) {
        throwIfCanceled();
        if (frame < timelineFrames) {
          /*
           * Scene time includes the range offset; output time always starts at 0.
           *
           * Clamped just inside the range, because the frame count is rounded
           * *up*: a span that isn't a whole number of frames puts the last one
           * at or past `endUs`, and clip ranges are half-open — so that frame
           * composited nothing and came out as bare background. The video ended
           * on a blank, and the credit's backdrop, captured from it, was blank
           * with it. The player has always clamped this; the exporter did not.
           */
          const sceneTimeUs = Math.min(startUs + (frame / settings.fps) * US, endUs - 1);
          await renderScene(context, exportScene, sceneTimeUs, { target: 'export' });
        } else {
          // Past the timeline: the card, with its own progress across the hold.
          const creditFrame = frame - timelineFrames;
          drawEndCredit(
            context,
            settings.width,
            settings.height,
            creditFrames > 1 ? creditFrame / (creditFrames - 1) : 1,
            creditLogo,
            creditBackdrop
          );
        }
        await videoSource.add(frame / settings.fps, 1 / settings.fps);

        /*
         * Captured after the frame is encoded, so the copy cannot disturb what
         * was written, and only on the last timeline frame — the one the card
         * then holds under itself.
         */
        if (creditFrames > 0 && frame === timelineFrames - 1) {
          creditBackdrop = new OffscreenCanvas(settings.width, settings.height);
          const backdropContext = creditBackdrop.getContext('2d');
          if (backdropContext) {
            backdropContext.filter = `blur(${Math.max(1, settings.height * CREDIT_BACKDROP.blur)}px)`;
            /*
             * Drawn overscaled and centred so the blur has material to sample
             * past every edge. Blurring an image drawn to its own bounds pulls
             * in the transparent black outside it and leaves a dark vignette
             * around the whole frame.
             */
            const bleed = 1 + CREDIT_BACKDROP.blur * 4;
            const bleedWidth = settings.width * bleed;
            const bleedHeight = settings.height * bleed;
            backdropContext.drawImage(canvas, (settings.width - bleedWidth) / 2, (settings.height - bleedHeight) / 2, bleedWidth, bleedHeight);
            backdropContext.filter = 'none';
          } else {
            creditBackdrop = null;
          }
        }

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
 * Renders the timeline to a file, one job at a time — see `exclusive`. A size
 * probe already running is waited out rather than fought with; the dialog
 * aborts it as the export starts, so the wait is a frame.
 */
export const exportProject = (
  scene: Scene,
  settings: ExportSettings,
  durationUs: number,
  onProgress: (progress: ExportProgress) => void,
  signal?: AbortSignal,
  formatId = 'mp4'
): Promise<Blob> => exclusive(() => runExport(scene, settings, durationUs, onProgress, signal, formatId));

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
