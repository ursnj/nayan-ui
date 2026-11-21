import { speechPlatform } from './speechPlatform';

export type SpeechOptions = {
  /** BCP 47 language tag, such as en-US or hi-IN. Defaults to the system language. */
  language?: string;
  /** Identifier returned by getAvailableVoicesAsync. */
  voice?: string;
  /** Speed relative to the platform default, 0.1..2. Default 1. */
  rate?: number;
  /** Pitch multiplier, 0.5..2. Default 1. */
  pitch?: number;
  /** Loudness, 0..1. Default 1. */
  volume?: number;
};

export type SpeechVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: 'Default' | 'Enhanced';
};

async function request<T>(command: Record<string, unknown>): Promise<T> {
  if (!speechPlatform.supported) throw new Error('Speech is unavailable on this platform or engine build');
  const result = JSON.parse(await speechPlatform.request(JSON.stringify(command)));
  if (result.error) throw new Error(result.error);
  return result.value as T;
}

/** System text-to-speech. Independent of the engine mixer, microphone and asset loading. */
export const speech = {
  /** API availability; installed voices and Android TTS initialization may still fail. */
  get supported(): boolean {
    return speechPlatform.supported;
  },

  /**
   * Queues text using the system synthesizer. Resolves when queued, not when speech finishes.
   * No audio files are created. Call stop on leaving a screen to cancel its queued speech.
   */
  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    if (typeof text !== 'string') throw new TypeError('Speech text must be a string');
    for (const [key, min, max] of [
      ['rate', 0.1, 2],
      ['pitch', 0.5, 2],
      ['volume', 0, 1]
    ] as const) {
      const value = options[key];
      if (value !== undefined && (!Number.isFinite(value) || value < min || value > max)) {
        throw new RangeError(`Speech ${key} must be between ${min} and ${max}`);
      }
    }
    for (const key of ['language', 'voice'] as const) {
      if (options[key] !== undefined && typeof options[key] !== 'string') throw new TypeError(`Speech ${key} must be a string`);
    }
    if (!text.trim()) return;
    const { language, voice, rate, pitch, volume } = options;
    await request({ action: 'speak', text, language, voice, rate, pitch, volume });
  },

  /** Stops current speech and clears the entire speech queue. */
  async stop(): Promise<void> {
    await request({ action: 'stop' });
  },

  /** iOS and web only; rejects on Android, which has no system pause API. */
  async pause(): Promise<void> {
    await request({ action: 'pause' });
  },

  /** iOS and web only; rejects on Android. */
  async resume(): Promise<void> {
    await request({ action: 'resume' });
  },

  /** Includes speech paused on iOS/web. */
  isSpeakingAsync(): Promise<boolean> {
    return request({ action: 'isSpeaking' });
  },

  getAvailableVoicesAsync(): Promise<SpeechVoice[]> {
    return request({ action: 'voices' });
  }
};
