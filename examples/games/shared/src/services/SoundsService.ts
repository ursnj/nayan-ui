// Game sound effects: short, synthesised WAVs (scripts/build-sfx.py → src/assets/sfx) played through
// the Nayan Game Engine's mixer, which mixes them in Rust on the audio thread, so they're instant, overlap
// freely and never queue up the way spoken phrases did. Every game's events are mapped below onto the
// sound that fits them best (with a volume and pitch where it helps tell sounds apart).
//
// Games call playSound(GAME_SOUNDS.<GAME>.<EVENT>, settings.enableSounds) as before.
import type { AudioPlayOptions, SoundBank, Voice } from '@nayan-ui/engine';
import { SFX_SOURCES, type SfxName } from './SfxSources';

export interface SoundConfig {
  /** The sound effect to play. */
  sfx?: SfxName;
  /** 0..2, default 1. */
  volume?: number;
  /** Playback speed, which also shifts the pitch. Default 1. */
  pitch?: number;
  /** No longer spoken; kept so older call sites that pass a phrase still type-check. */
  text?: string;
  rate?: number;
  language?: string;
  /** Minimum gap between repeated instances, in milliseconds. */
  cooldown?: number;
  /** Repeat a music/ambience clip until its voice is stopped. */
  loop?: boolean;
}

// Keep the engine out of the home screen's metadata import. Each decoded sound is shared
// across games, but opening one game should not fetch and decode every game's effects.
const banks = new Map<SfxName, SoundBank<SfxName>>();
const engine = (): typeof import('@nayan-ui/engine') => require('@nayan-ui/engine');
const loadBank = (name: SfxName): SoundBank<SfxName> | null => {
  const { audio, isEngineAvailable } = engine();
  if (!isEngineAvailable) return null;
  let bank = banks.get(name);
  if (!bank) {
    bank = audio.load({ [name]: SFX_SOURCES[name] } as Record<SfxName, number>);
    banks.set(name, bank);
  }
  return bank;
};

// The same sound re-triggered within this window is dropped (so a burst of events doesn't stack it)
const MIN_REPEAT_INTERVAL = 30;
const _lastPlay = new Map<SfxName, number>();
// Recently started voices, so stopAllSounds can cut them off
const MAX_TRACKED_VOICES = 24;
const _voices: Voice[] = [];

/** Loads the sound effects ahead of use (e.g. when a game opens), so the first one isn't skipped. */
export const preloadSounds = (sounds?: Record<string, SoundConfig> | SoundConfig[]): void => {
  if (!sounds) return;
  for (const sound of Object.values(sounds)) if (sound.sfx) loadBank(sound.sfx);
};

export const playSound = (soundConfig: SoundConfig, soundEnabled: boolean, _force?: boolean): void => {
  playSoundVoice(soundConfig, soundEnabled);
};

/** For game-owned effects that must stop immediately when an action changes. */
const playSoundVoice = (soundConfig: SoundConfig, soundEnabled: boolean): Voice | null => {
  if (!soundEnabled || !soundConfig?.sfx) return null;
  const b = loadBank(soundConfig.sfx);
  if (!b) return null;
  const { audio } = engine();
  if (audio.muted) return null;
  const now = Date.now();
  if (now - (_lastPlay.get(soundConfig.sfx) ?? 0) < (soundConfig.cooldown ?? MIN_REPEAT_INTERVAL)) return null;
  _lastPlay.set(soundConfig.sfx, now);
  return playBankSound(b, soundConfig.sfx, { volume: soundConfig.volume ?? 1, pitch: soundConfig.pitch ?? 1, loop: soundConfig.loop });
};

/** Tracks custom native one-shots too, so race/forest effects stop with the shared game screen. */
export const playBankSound = <K extends string>(bank: SoundBank<K> | undefined, name: K, options?: AudioPlayOptions): Voice | null => {
  const { audio } = engine();
  if (!bank || audio.muted) return null;
  const voice = bank.play(name, options);
  if (voice != null) {
    _voices.push(voice);
    if (_voices.length > MAX_TRACKED_VOICES) audio.stop(_voices.shift());
  }
  return voice;
};

export const stopAllSounds = (): void => {
  _lastPlay.clear();
  if (!_voices.length) return;
  const { audio } = engine();
  for (const v of _voices) audio.stop(v);
  _voices.length = 0;
};

// The shared game screen's Stop and Play Again sounds (the games library maps every game's events
// here; Car Racing plays its own sound bank, CarRacingConstants' getRacingSounds).
export const GAME_SOUNDS = {
  STOP: { sfx: 'deselect', volume: 0.5 } as SoundConfig,
  RESET: { sfx: 'click', volume: 0.5 } as SoundConfig
};
