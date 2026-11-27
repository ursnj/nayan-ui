// Recording from the device's microphone, kept in the Rust core: it holds the last few seconds of
// input and how loud it is now, and turns any stretch of it into an ordinary Sound that plays through
// the mixer (at any pitch: a character repeating you in a squeaky voice). Nothing leaves the device.
//
//   if (!(await microphone.requestPermission())) return;   // the system prompt, the first time
//   microphone.start();                                     // listening (keeps the last 10 s)
//   // each frame: microphone.level (0..1) to notice speech starting and stopping
//   const take = microphone.take(spoke, { skipEnd: 0.6 });  // what was said, without the pause after
//   if (take) audio.play(take.sound, { pitch: 1.6 });       // ... then audio.release(take.sound)
//
// iOS: the app needs NSMicrophoneUsageDescription; the audio session switches to play-and-record (to
// the speaker) while listening and back to ambient after `stop`. Android: the app declares
// android.permission.RECORD_AUDIO; `requestPermission` asks through the current activity. Web: the
// page must be served over HTTPS (or localhost) and allowed to use the microphone.
import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';
import type { Sound } from '../audio/audio';

export type MicrophoneState = 'off' | 'starting' | 'listening' | 'paused' | 'failed';
export type MicrophonePermission = 'granted' | 'undetermined' | 'denied';

/** What `microphone.take` returns: a sound to play, how long it lasts and its loudness over time. */
export type Recording = {
  sound: Sound;
  /** Seconds at pitch 1. */
  duration: number;
  /** RMS loudness, `levelsPerSecond` values a second (see `audio.levels`). */
  levels: Float32Array;
  levelsPerSecond: number;
};

export type MicrophoneOptions = {
  /** Seconds of input kept (0.5..30). Default 10. */
  maxSeconds?: number;
};

export type TakeOptions = {
  /** Leave out the last `skipEnd` seconds (the silence after someone stops talking). Default 0. */
  skipEnd?: number;
  /** Loudness values per second in `levels`. Default 30. */
  levelsPerSecond?: number;
};

const STATES: Record<number, MicrophoneState> = { 0: 'off', 1: 'starting', 2: 'listening', 3: 'paused', [-1]: 'failed' };

export const microphone = {
  /** Initialize the audio bridge before requesting browser microphone access. */
  async prepare(): Promise<void> {
    await prepareEngine();
  },
  /** Whether this engine build can record (false on older app builds and without a native module). */
  get supported(): boolean {
    return typeof NativeEngine?.micStart === 'function' && NativeEngine.micPermission() !== -2;
  },

  /** Whether the app may record. On Android, 'undetermined' also covers a denial (it can't tell). */
  get permission(): MicrophonePermission {
    const value = microphone.supported ? NativeEngine!.micPermission() : -1;
    return value > 0 ? 'granted' : value < 0 ? 'denied' : 'undetermined';
  },

  /** Shows the system prompt the first time (answering at once after that); true if recording is allowed. */
  requestPermission(): Promise<boolean> {
    return microphone.supported ? NativeEngine!.micRequestPermission() : Promise.resolve(false);
  },

  /** Starts listening (asynchronously: see `state`). Ask for the permission first. */
  start({ maxSeconds = 10 }: MicrophoneOptions = {}): boolean {
    return microphone.supported && NativeEngine!.micStart(maxSeconds);
  },

  /** Pause sampling without releasing the microphone or clearing captured audio. */
  pause(): boolean {
    return NativeEngine?.micPause?.(true) ?? false;
  },

  resume(): boolean {
    return NativeEngine?.micPause?.(false) ?? false;
  },

  /** Stops listening and releases the microphone (its system indicator turns off); forgets what was heard. */
  stop() {
    if (microphone.supported) NativeEngine!.micStop();
  },

  /** 'failed' when there's no microphone, no permission or the input couldn't open. */
  get state(): MicrophoneState {
    return microphone.supported ? (STATES[NativeEngine!.micState()] ?? 'off') : 'off';
  },

  /**
   * How loud the input is now: 0 at -60 dBFS or quieter, 1 at full scale; speech close to a phone
   * is usually 0.4..0.8, a quiet room under 0.3. Rises at once and falls back over ~0.15 s. Cheap
   * enough to read every frame.
   */
  get level(): number {
    return microphone.supported ? NativeEngine!.micLevel() : 0;
  },

  /** Seconds of input held (up to `maxSeconds`), since starting or the last `take`. */
  get held(): number {
    return microphone.supported ? NativeEngine!.micHeld() : 0;
  },

  /**
   * The last `seconds` of input (ending `skipEnd` seconds ago) as a new Sound, and forgets
   * everything heard so far so the next take starts fresh. Null if nothing was heard. Release the
   * sound with `audio.release` once it has played: each take holds its samples until then.
   */
  take(seconds = Infinity, { skipEnd = 0, levelsPerSecond = 30 }: TakeOptions = {}): Recording | null {
    if (!microphone.supported) return null;
    const id = NativeEngine!.micTake(Number.isFinite(seconds) ? seconds : 3600, skipEnd);
    if (id < 0) return null;
    const sound = id as Sound;
    const buffer = NativeEngine!.audioLevels(sound, levelsPerSecond);
    return { sound, duration: NativeEngine!.audioDuration(sound), levels: new Float32Array(buffer), levelsPerSecond };
  },

  /** Return the buffered take and release the microphone, even when there were no samples. */
  finish(options?: TakeOptions): Recording | null {
    try {
      return microphone.take(Infinity, options);
    } finally {
      microphone.stop();
    }
  }
};
