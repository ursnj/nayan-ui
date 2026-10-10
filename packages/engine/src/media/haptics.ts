// Haptics, driven by the Rust core (Core Haptics on iOS).
import NativeEngine from "../native/NativeNayanEngine";

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
