// Audio and haptics, both implemented in the Rust core (no Expo or other native audio dependency).
import { Image } from "react-native";
import NativeEngine from "./specs/NativeNayanEngine";

/** A decoded sound in the core's mixer. */
export type Sound = number & { readonly __sound: unique symbol };
/** A playing instance of a sound (for `audio.stop`). */
export type Voice = number & { readonly __voice: unique symbol };

export type PlayOptions = {
  /** 0..2. Default 1. */
  volume?: number;
  /** -1 left .. 1 right. Default 0. */
  pan?: number;
  /** Playback speed (also shifts pitch). Default 1. */
  pitch?: number;
  /** Repeat until stopped (music, engines, ambience). */
  loop?: boolean;
};

/** A `require("./file.wav")` asset, or a URI (http(s):// or file://). WAV, PCM or float, mono or stereo. */
export type SoundSource = number | string;

const loads = new Map<string, Promise<Sound | null>>();

function loadSound(source: SoundSource): Promise<Sound | null> {
  const uri = typeof source === "number" ? Image.resolveAssetSource(source)?.uri : source;
  if (!uri || !NativeEngine) return Promise.resolve(null);
  let pending = loads.get(uri);
  if (!pending) {
    pending = fetch(uri)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => {
        const id = NativeEngine!.audioLoad(bytes);
        if (id < 0) throw new Error("not a supported WAV file");
        return id as Sound;
      })
      .catch((error: unknown) => {
        console.warn(`audio: couldn't load ${uri}: ${error instanceof Error ? error.message : String(error)}`);
        loads.delete(uri); // allow a retry
        return null;
      });
    loads.set(uri, pending);
  }
  return pending;
}

/** Named sounds. Plays are ignored until `ready` resolves (usually a few milliseconds). */
export class SoundBank<K extends string> {
  /** Resolves when every sound has loaded (failures are logged and skipped). */
  readonly ready: Promise<void>;
  private readonly ids: Partial<Record<K, Sound>> = {};

  constructor(sources: Record<K, SoundSource>) {
    this.ready = Promise.all(
      (Object.keys(sources) as K[]).map(async (name) => {
        const id = await loadSound(sources[name]);
        if (id !== null) this.ids[name] = id;
      }),
    ).then(() => undefined);
  }

  /** The sound id, once loaded (e.g. for `World.setImpactFeedback`). */
  get(name: K): Sound | undefined {
    return this.ids[name];
  }

  play(name: K, options?: PlayOptions): Voice | null {
    const id = this.ids[name];
    return id === undefined ? null : audio.play(id, options);
  }
}

let muted = false;
let volume = 1;

export const audio = {
  /** Loads named sounds into the core's mixer. Loading the same asset twice decodes it once. */
  load<K extends string>(sources: Record<K, SoundSource>): SoundBank<K> {
    return new SoundBank(sources);
  },

  /** Plays a sound (low latency: mixed in Rust on the audio thread). Returns null if it couldn't play. */
  play(sound: Sound, { volume: v = 1, pan = 0, pitch = 1, loop = false }: PlayOptions = {}): Voice | null {
    const voice = NativeEngine?.audioPlay(sound, v, pan, pitch, loop) ?? 0;
    return voice > 0 ? (voice as Voice) : null;
  },

  stop(voice: Voice | null | undefined) {
    if (voice) NativeEngine?.audioStop(voice);
  },

  get muted() {
    return muted;
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
  },
};

export type HapticTap = {
  /** Seconds from now. */
  time: number;
  /** 0..1 */
  intensity: number;
  /** 0 (dull thud) .. 1 (crisp click). */
  sharpness: number;
};

const PATTERNS: Record<"success" | "warning" | "error", HapticTap[]> = {
  success: [
    { time: 0, intensity: 0.55, sharpness: 0.5 },
    { time: 0.1, intensity: 1, sharpness: 0.7 },
  ],
  warning: [
    { time: 0, intensity: 0.8, sharpness: 0.4 },
    { time: 0.16, intensity: 0.8, sharpness: 0.4 },
  ],
  error: [
    { time: 0, intensity: 1, sharpness: 0.8 },
    { time: 0.09, intensity: 0.9, sharpness: 0.8 },
    { time: 0.18, intensity: 0.7, sharpness: 0.8 },
  ],
};

function playTaps(taps: readonly HapticTap[], throttle: boolean) {
  if (!haptics.enabled || !NativeEngine) return;
  NativeEngine.hapticsPlay(
    taps.flatMap((t) => [t.time, t.intensity, t.sharpness]),
    throttle,
  );
}

export const haptics = {
  /** Set false to silence all haptics (e.g. a settings toggle). */
  enabled: true,

  /** True if the device has a haptic actuator (false on simulators). */
  get supported() {
    return NativeEngine?.hapticsSupported() ?? false;
  },

  /** A single tap. Rapid repeats (< 35 ms apart) are dropped so collisions don't buzz. */
  impact(intensity = 0.6, sharpness = 0.5) {
    playTaps([{ time: 0, intensity, sharpness }], true);
  },

  /** A light, crisp tick for UI selection. */
  selection() {
    playTaps([{ time: 0, intensity: 0.35, sharpness: 0.9 }], true);
  },

  notify(type: "success" | "warning" | "error") {
    playTaps(PATTERNS[type], false);
  },

  /** Any sequence of taps. */
  play(taps: readonly HapticTap[]) {
    playTaps(taps, false);
  },
};

/** Maps an impact speed to a 0..1 volume/strength: 0 below `min`, 1 at `max`. */
export function impactStrength(speed: number, min = 1, max = 8): number {
  return Math.max(0, Math.min(1, (speed - min) / (max - min)));
}
