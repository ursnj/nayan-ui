// Engine-facing audio and haptics interfaces. The core library has no audio/haptics dependency;
// `@nayan-ui/engine/expo` implements these with expo-audio and expo-haptics, and you can plug in
// any other implementation.

export type PlayOptions = {
  /** 0..1. Default 1. */
  volume?: number;
  /** Playback speed. Default 1. */
  rate?: number;
};

export interface GameAudio<K extends string = string> {
  /** Fire-and-forget sound effect. Overlapping plays of the same sound use a small voice pool. */
  play(sound: K, options?: PlayOptions): void;
  /** Loops `sound` as background music, replacing the current track (no-op if already playing). */
  playMusic(sound: K, options?: { volume?: number }): void;
  stopMusic(): void;
  /** Silences effects and music without stopping the music track. */
  muted: boolean;
  /** Releases all players. */
  dispose(): void;
}

export type HapticImpact = "light" | "medium" | "heavy" | "soft" | "rigid";
export type HapticNotification = "success" | "warning" | "error";

export interface GameHaptics {
  /** A physical tap, e.g. a collision. Rapid calls are throttled. */
  impact(style?: HapticImpact): void;
  /** An outcome: success / warning / error. Never throttled. */
  notify(type: HapticNotification): void;
  /** A light tick for UI selection changes. */
  selection(): void;
  enabled: boolean;
}

/** An audio implementation that does nothing (tests, or builds without audio). */
export function silentAudio<K extends string = string>(): GameAudio<K> {
  return { play() {}, playMusic() {}, stopMusic() {}, muted: false, dispose() {} };
}

/** A haptics implementation that does nothing. */
export function noHaptics(): GameHaptics {
  return { impact() {}, notify() {}, selection() {}, enabled: false };
}

/** Maps an impact speed to a 0..1 volume/strength: quiet below `min`, full at `max`. */
export function impactStrength(speed: number, min = 1, max = 8): number {
  return Math.max(0, Math.min(1, (speed - min) / (max - min)));
}
