import { useSyncExternalStore } from "react";
import { useColorScheme } from "react-native";

// Playtura's game themes (ThemeService): light, and dark (games also use it to repaint their scenes at night).
export type Theme = typeof LIGHT;

export const LIGHT = {
  dark: false,
  BACKGROUND: "#C8C2E0",
  SURFACE: "rgba(255, 255, 255, 0.55)",
  BORDER: "rgba(255, 255, 255, 0.9)",
  BORDER_WIDTH: 1.5,
  TEXT: "#0F1729",
  TEXT_MUTED: "#65758B",
  TEXT_SUBTLE: "#0F1729",
  TEXT_SHADOW: "transparent",
  SOLID: "#6F3EF4",
  ON_SOLID: "#FFFFFF",
  SCORE_HIGHLIGHT: "#6F3EF4",
  DANGER: "#EF4343",
  OVERLAY: "rgba(15, 23, 41, 0.8)",
  SWITCH_TRACK_OFF: "rgba(15, 23, 41, 0.15)",
  SWITCH_TRACK_ON: "#6F3EF4",
  SWITCH_THUMB: "#FFFFFF",
  HEADER_BACKGROUND: "rgba(255, 255, 255, 0.55)",
  HEADER_BORDER: "rgba(255, 255, 255, 0.9)",
  HEADER_TINT: "#0F1729",
  FILL: "rgba(111, 62, 244, 0.45)",
};

export const DARK: Theme = {
  dark: true,
  BACKGROUND: "#17122B",
  SURFACE: "rgba(153, 118, 249, 0.16)",
  BORDER: "rgba(153, 118, 249, 0.22)",
  BORDER_WIDTH: 1.5,
  TEXT: "#F9F8FB",
  TEXT_MUTED: "#9893B4",
  TEXT_SUBTLE: "#F9F8FB",
  TEXT_SHADOW: "transparent",
  SOLID: "#9976F9",
  ON_SOLID: "#FFFFFF",
  SCORE_HIGHLIGHT: "#F6A823",
  DANGER: "#DC2828",
  OVERLAY: "rgba(0, 0, 0, 0.86)",
  SWITCH_TRACK_OFF: "rgba(153, 118, 249, 0.3)",
  SWITCH_TRACK_ON: "#9976F9",
  SWITCH_THUMB: "#F9F8FB",
  HEADER_BACKGROUND: "rgba(153, 118, 249, 0.16)",
  HEADER_BORDER: "rgba(153, 118, 249, 0.2)",
  HEADER_TINT: "#F9F8FB",
  FILL: "rgba(153, 118, 249, 0.5)",
};

// The player's choice from the settings card (null = follow the system), shared by every screen.
let choice: boolean | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Sets dark mode for every game (`null` follows the system again). */
export function setDarkMode(dark: boolean | null) {
  choice = dark;
  for (const listener of listeners) listener();
}

/** The active game theme: the settings choice, else the game's `theme` prop, else the system's light / dark mode. */
export function useGameTheme(preferred?: "light" | "dark"): Theme {
  const system = useColorScheme() === "dark";
  const chosen = useSyncExternalStore(subscribe, () => choice);
  return (chosen ?? (preferred ? preferred === "dark" : system)) ? DARK : LIGHT;
}
