import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from "expo-audio";
import * as Haptics from "expo-haptics";
import type { GameAudio, GameHaptics, HapticImpact, HapticNotification, PlayOptions } from "../audio";

type ExpoAudioOptions = {
  /** Simultaneous plays per sound effect. Default 3. */
  voices?: number;
  /** Play even when the device's silent switch is on. Default false (games usually respect it). */
  playsInSilentMode?: boolean;
};

/**
 * `GameAudio` backed by expo-audio. Each sound gets `voices` preloaded players that are reused
 * round-robin, so rapid repeats overlap instead of cutting each other off.
 *
 * ```ts
 * const audio = createExpoAudio({ pickup: require("./pickup.wav"), music: require("./music.wav") });
 * audio.play("pickup", { volume: 0.8 });
 * audio.playMusic("music", { volume: 0.4 });
 * ```
 */
export function createExpoAudio<K extends string>(
  sounds: Record<K, AudioSource>,
  { voices = 3, playsInSilentMode = false }: ExpoAudioOptions = {},
): GameAudio<K> {
  setAudioModeAsync({ playsInSilentMode, interruptionMode: "mixWithOthers" }).catch(() => {});

  const pools = new Map<K, { players: AudioPlayer[]; next: number }>();
  for (const key of Object.keys(sounds) as K[]) {
    const players = Array.from({ length: Math.max(1, voices) }, () => createAudioPlayer(sounds[key]));
    pools.set(key, { players, next: 0 });
  }

  let music: { key: K; player: AudioPlayer; volume: number } | null = null;
  let muted = false;
  let disposed = false;

  return {
    play(sound: K, { volume = 1, rate = 1 }: PlayOptions = {}) {
      const pool = pools.get(sound);
      if (!pool || muted || disposed || volume <= 0) return;
      const player = pool.players[pool.next]!;
      pool.next = (pool.next + 1) % pool.players.length;
      player.volume = Math.min(1, volume);
      if (player.playbackRate !== rate) player.setPlaybackRate(rate);
      player.seekTo(0).catch(() => {});
      player.play();
    },

    playMusic(sound: K, { volume = 0.5 } = {}) {
      if (disposed) return;
      if (music?.key === sound) {
        music.volume = volume;
        music.player.volume = muted ? 0 : volume;
        return;
      }
      music?.player.remove();
      const player = createAudioPlayer(sounds[sound]);
      player.loop = true;
      player.volume = muted ? 0 : volume;
      player.play();
      music = { key: sound, player, volume };
    },

    stopMusic() {
      music?.player.remove();
      music = null;
    },

    get muted() {
      return muted;
    },
    set muted(value: boolean) {
      muted = value;
      if (music) music.player.volume = value ? 0 : music.volume;
    },

    dispose() {
      disposed = true;
      music?.player.remove();
      music = null;
      for (const { players } of pools.values()) players.forEach((p) => p.remove());
      pools.clear();
    },
  };
}

const IMPACT: Record<HapticImpact, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  soft: Haptics.ImpactFeedbackStyle.Soft,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
};

const NOTIFICATION: Record<HapticNotification, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * `GameHaptics` backed by expo-haptics. Impacts and selection ticks closer than `minIntervalMs`
 * are dropped so a pile of collisions doesn't flood the Taptic Engine; notifications always fire.
 */
export function createExpoHaptics({ minIntervalMs = 40 }: { minIntervalMs?: number } = {}): GameHaptics {
  let last = 0;
  const allow = () => {
    const now = Date.now();
    if (!haptics.enabled || now - last < minIntervalMs) return false;
    last = now;
    return true;
  };
  const haptics: GameHaptics = {
    enabled: true,
    impact(style = "medium") {
      if (allow()) Haptics.impactAsync(IMPACT[style]).catch(() => {});
    },
    notify(type) {
      if (haptics.enabled) Haptics.notificationAsync(NOTIFICATION[type]).catch(() => {});
    },
    selection() {
      if (allow()) Haptics.selectionAsync().catch(() => {});
    },
  };
  return haptics;
}
