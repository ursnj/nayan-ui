import { AssetLoader } from '../assets/AssetLoader';
// Sound, played by the Rust core's mixer (no Expo or other native audio dependency).
import type { AssetSource } from '../assets/source';
import type { EngineBridge } from '../native/EngineBridge';
import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';

/** A decoded sound in the core's mixer. */
export type Sound = number & { readonly __sound: unique symbol };
/** A playing instance of a sound (for `audio.stop`). */
export type Voice = number & { readonly __voice: unique symbol };

export type AudioPlayOptions = {
  /** 0..2. Default 1. */
  volume?: number;
  /** -1 left .. 1 right. Default 0. */
  pan?: number;
  /** Playback speed (0.1..4, also shifts pitch). Default 1. */
  pitch?: number;
  /** Repeat until stopped (music, engines, ambience). */
  loop?: boolean;
};

/** `audio.shift`: a new sound with its pitch and tempo changed separately (each 0.25..4). */
export type AudioShiftOptions = {
  /** Frequency ratio: 2 is an octave up. Default 1. */
  pitch?: number;
  /** Speed ratio: 1.1 is 10% quicker. Default 1. */
  tempo?: number;
  /** Speech RMS to level to (0.2 is about -14 dBFS), at most 30 dB louder; 0 leaves the level. */
  loudness?: number;
  /** Turn rumble (below 100 Hz) and the room between words down first (a microphone take). */
  clean?: boolean;
};

/** A bundled audio asset or URI. Supports mono and stereo WAV, MP3, AAC-LC in M4A, FLAC, and Ogg Vorbis. */
export type SoundSource = AssetSource;

const playbackStates = ['pending', 'playing', 'paused', 'ended', 'stopped'] as const;
export type AudioPlaybackState = (typeof playbackStates)[number];
export interface AudioPlaybackStatus {
  state: AudioPlaybackState;
  /** Playback position in seconds at the sound's original speed. */
  currentTime: number;
  /** Sound length in seconds. */
  duration: number;
}

const loader = /* @__PURE__ */ new AssetLoader<Sound>('audio');

async function decodeSound(native: EngineBridge, bytes: ArrayBuffer): Promise<Sound> {
  const id = typeof native.audioLoadAsync === 'function' ? await native.audioLoadAsync(bytes) : native.audioLoad(bytes);
  if (id < 0) throw new Error('Could not decode audio with this engine build');
  return id as Sound;
}

function loadSound(source: SoundSource): Promise<Sound> {
  return loader.load(source, decodeSound);
}

/** Named sounds. Plays are ignored until `ready` resolves (usually a few milliseconds). */
export class SoundBank<K extends string> {
  /** Resolves when every sound has loaded (failures are logged and skipped). */
  readonly ready: Promise<void>;
  private readonly ids: Partial<Record<K, Sound>> = {};

  constructor(sources: Record<K, SoundSource>) {
    this.ready = Promise.all(
      (Object.keys(sources) as K[]).map(async (name) => {
        try {
          this.ids[name] = await loadSound(sources[name]);
        } catch (error) {
          console.warn(error instanceof Error ? error.message : String(error));
        }
      })
    ).then(() => undefined);
  }

  /** The sound, once loaded (e.g. for an entity's `impact.sound`). */
  get(name: K): Sound | undefined {
    return this.ids[name];
  }

  play(name: K, options?: AudioPlayOptions): Voice | null {
    const id = this.ids[name];
    return id === undefined ? null : audio.play(id, options);
  }
}

let muted = false;
let volume = 1;

function control(voice: number, action: number, value = 0, pan = 0): boolean {
  if (!NativeEngine?.audioControl?.(0, 4, 0, 0)) throw new Error('Voice controls require an engine build with audio support');
  return NativeEngine.audioControl(voice, action, value, pan);
}

function updateVoice(voice: Voice, action: number, value: number, pan = 0): boolean {
  if (!Number.isSafeInteger(voice) || voice <= 0) throw new TypeError('Expected a valid voice');
  return control(voice, action, value, pan);
}

export const audio = {
  /** Initialize audio bindings without creating a game or render surface. */
  async prepare(): Promise<void> {
    await prepareEngine();
  },
  /** Initializes the engine and loads named sounds into its mixer. Each asset decodes once per session. */
  load<K extends string>(sources: Record<K, SoundSource>): SoundBank<K> {
    return new SoundBank(sources);
  },

  /** Loads one session-cached audio asset. Rejects when loading or decoding fails. */
  loadSound,

  /** Decodes owned audio bytes. Call release when finished with the returned sound. */
  decode: decodeBytes,
  /** Decodes owned WAV bytes. Call release when finished with the returned sound. */
  decodeWav(data: ArrayBuffer | ArrayBufferView): Promise<Sound> {
    return decodeBytes(data, true);
  },

  /** Exports a loaded sound or microphone take as 16-bit stereo PCM WAV bytes. */
  encodeWav(sound: Sound): ArrayBuffer {
    if (!NativeEngine?.audioEncodeWav) throw new Error('WAV export requires an engine build with audio export support');
    const bytes = NativeEngine.audioEncodeWav(sound);
    if (!bytes.byteLength) throw new Error('Unknown or released audio sound');
    return bytes;
  },

  /** Plays a sound (low latency: mixed in Rust on the audio thread). Returns null if it couldn't play. */
  play(sound: Sound, { volume: v = 1, pan = 0, pitch = 1, loop = false }: AudioPlayOptions = {}): Voice | null {
    const voice = NativeEngine?.audioPlay(sound, v, pan, pitch, loop) ?? 0;
    return voice > 0 ? (voice as Voice) : null;
  },

  stop(voice: Voice | null | undefined) {
    if (voice) NativeEngine?.audioStop(voice);
  },

  /** Whether this build has live voice control, including stopAll. */
  get canControlVoices(): boolean {
    return NativeEngine?.audioControl?.(0, 4, 0, 0) ?? false;
  },

  /** These controls return whether the mixer accepted the command. */
  pause(voice: Voice): boolean {
    return updateVoice(voice, 0, 1);
  },
  resume(voice: Voice): boolean {
    return updateVoice(voice, 0, 0);
  },
  /** Seek in seconds at the sound's original speed. */
  seek(voice: Voice, seconds: number): boolean {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Seek seconds must be finite and nonnegative');
    return updateVoice(voice, 1, seconds);
  },
  setVoiceMix(voice: Voice, volume: number, pan = 0): boolean {
    if (!Number.isFinite(volume) || volume < 0 || volume > 2 || !Number.isFinite(pan) || pan < -1 || pan > 1)
      throw new RangeError('Voice volume must be 0..2 and pan must be -1..1');
    return updateVoice(voice, 2, volume, pan);
  },
  /** Changes playback speed without restarting the voice. Like pitch, this changes speed and pitch together. */
  setVoiceRate(voice: Voice, rate: number): boolean {
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 4) throw new RangeError('Voice rate must be 0.1..4');
    return updateVoice(voice, 5, rate);
  },
  setVoiceLoop(voice: Voice, loop: boolean): boolean {
    return updateVoice(voice, 6, Number(loop));
  },
  setVoiceMuted(voice: Voice, muted: boolean): boolean {
    return updateVoice(voice, 7, Number(muted));
  },
  /** Returns the latest mixer snapshot. Old completed voices are removed from the bounded history. */
  getStatus(voice: Voice): AudioPlaybackStatus | null {
    if (!Number.isSafeInteger(voice) || voice <= 0) return null;
    const buffer = NativeEngine?.audioVoiceStatus?.(voice);
    if (buffer?.byteLength !== 3 * Float32Array.BYTES_PER_ELEMENT) return null;
    const [index, currentTime, duration] = new Float32Array(buffer);
    const state = playbackStates[index!];
    return state ? { state, currentTime: currentTime!, duration: duration! } : null;
  },
  /** Stops every voice in the engine mixer, including loops and paused voices. */
  stopAll(): boolean {
    return control(0, 3);
  },

  /**
   * Frees a sound's samples, for sounds made at runtime (a `microphone.take` recording, once played).
   * Its id then plays nothing; voices already playing it finish first. Don't release a bank's sounds.
   */
  release(sound: Sound | null | undefined) {
    if (sound != null) NativeEngine?.audioRelease?.(sound);
  },

  /** A sound's length in seconds (0 if unknown or released). */
  duration(sound: Sound): number {
    return NativeEngine?.audioDuration?.(sound) ?? 0;
  },

  /**
   * A sound's loudness (RMS, 0..1) over time, one value per `1 / perSecond` seconds from its start:
   * drive a talking mouth, a bobbing body or a meter from it while the sound plays (at `pitch` p,
   * value i plays at i / (perSecond * p) seconds).
   */
  levels(sound: Sound, perSecond = 30): Float32Array {
    const buffer = NativeEngine?.audioLevels?.(sound, perSecond);
    return buffer ? new Float32Array(buffer) : new Float32Array(0);
  },

  /**
   * A new sound made from `sound`: `pitch` times higher and `tempo` times faster (0.25..4 each), so a
   * recorded voice can go up without racing (`play`'s `pitch` changes both together). For a voice
   * from the `microphone`: `clean` first removes rumble and turns the room down between words, and
   * `loudness` (an RMS level, 0.2 is about -14 dBFS) levels the speech itself, at most 30 dB louder,
   * under a soft limiter. Made in Rust on the calling thread (a few milliseconds a second of audio);
   * free it with `release` once played. Null if it can't be made, including on app builds older
   * than this method.
   */
  shift(sound: Sound, { pitch = 1, tempo = 1, loudness = 0, clean = false }: AudioShiftOptions = {}): Sound | null {
    const id = NativeEngine?.audioShift?.(sound, pitch, tempo, loudness, clean) ?? -1;
    return id >= 0 ? (id as Sound) : null;
  },

  /** Whether `shift` is available (the app's native build has it). */
  get canShift(): boolean {
    return typeof NativeEngine?.audioShift === 'function';
  },

  get muted() {
    return muted;
  },
  /** The inverse of `muted`, matching `haptics.enabled` (e.g. `audio.enabled = settings.enableSounds`). */
  get enabled() {
    return !muted;
  },
  set enabled(value: boolean) {
    this.muted = !value;
  },
  set muted(value: boolean) {
    muted = value;
    NativeEngine?.audioSetMuted(value);
  },

  /** Master volume, 0..2. */
  get volume() {
    return volume;
  },
  set volume(value: number) {
    volume = value;
    NativeEngine?.audioSetVolume(value);
  },

  /** True once the device's audio output is running. */
  get running() {
    return NativeEngine?.audioIsRunning() ?? false;
  }
};

async function decodeBytes(data: ArrayBuffer | ArrayBufferView, wavOnly = false): Promise<Sound> {
  if (!(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) throw new TypeError('Expected audio bytes');
  if (!data.byteLength || data.byteLength > 64 * 1024 * 1024) throw new RangeError('Expected an audio payload up to 64 MiB');
  const source = new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer, ArrayBuffer.isView(data) ? data.byteOffset : 0, data.byteLength);
  if (wavOnly && (source.length < 12 || String.fromCharCode(...source.subarray(0, 4), ...source.subarray(8, 12)) !== 'RIFFWAVE')) {
    throw new TypeError('Expected WAV bytes');
  }
  const bytes = source.slice().buffer;
  await prepareEngine();
  if (!NativeEngine) throw new Error('Audio is unavailable on this engine build');
  return decodeSound(NativeEngine, bytes);
}
