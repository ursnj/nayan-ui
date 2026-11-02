import {
  configureGameThemes,
  type GameThemeMode,
  type GameThemeOverrides,
  resolveGameTheme,
} from "@nayan-ui/games/services";

type Rgb = readonly [number, number, number];

/** Tailwind's indigo scale — the site's one accent (see `src/design/system.ts`). */
const INDIGO = {
  400: [129, 140, 248],
  500: [99, 102, 241],
  600: [79, 70, 229],
} as const satisfies Record<number, Rgb>;

const WHITE: Rgb = [255, 255, 255];

/** The games parse `#RRGGBB` and comma-separated `rgb()` / `rgba()` only. */
const rgba = ([r, g, b]: Rgb, alpha = 1) =>
  alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;

const TOKENS = [
  "--background",
  "--surface",
  "--border",
  "--foreground",
  "--muted",
  "--danger",
] as const;

/** Reads the site's CSS tokens for one theme, resolved to RGB by the browser. */
const readTokens = (theme: GameThemeMode) => {
  const scope = document.createElement("div");
  scope.dataset.theme = theme;
  scope.className = theme;
  scope.style.display = "none";
  const probe = document.createElement("span");
  scope.append(probe);
  document.body.append(scope);
  try {
    const colors = {} as Record<(typeof TOKENS)[number], Rgb>;
    for (const token of TOKENS) {
      probe.style.color = `var(${token})`;
      const channels =
        getComputedStyle(probe)
          .color.match(/[\d.]+/g)
          ?.map(Number) ?? [];
      colors[token] = [
        Math.round(channels[0] ?? 0),
        Math.round(channels[1] ?? 0),
        Math.round(channels[2] ?? 0),
      ];
    }
    return colors;
  } finally {
    scope.remove();
  }
};

const buildOverrides = (): GameThemeOverrides => {
  const overrides: GameThemeOverrides = {};
  for (const mode of ["light", "dark"] as const) {
    const tokens = readTokens(mode);
    const dark = mode === "dark";
    const background = tokens["--background"];
    const surface = tokens["--surface"];
    const border = tokens["--border"];
    const text = tokens["--foreground"];
    const muted = tokens["--muted"];
    const danger = tokens["--danger"];
    const accent = dark ? INDIGO[400] : INDIGO[600];
    const solid = dark ? INDIGO[500] : INDIGO[600];
    const panel = rgba(surface, dark ? 0.72 : 0.78);
    overrides[mode] = {
      BACKGROUND: rgba(background),
      PATTERN_OPACITY: dark ? 0.18 : 0.3,
      SURFACE: panel,
      BORDER: rgba(border),
      BORDER_WIDTH: 1,
      DIVIDER: rgba(border),
      TEXT: rgba(text),
      TEXT_MUTED: rgba(muted),
      LABEL: rgba(text),
      TEXT_SUBTLE: rgba(text),
      SOLID: rgba(solid),
      ON_SOLID: rgba(WHITE),
      SCORE_HIGHLIGHT: rgba(accent),
      DANGER: rgba(danger),
      CHIP: rgba(accent, dark ? 0.22 : 0.12),
      SWITCH_TRACK_OFF: rgba(text, 0.15),
      SWITCH_TRACK_ON: rgba(solid),
      SWITCH_THUMB: rgba(WHITE),
      HEADER: { BACKGROUND: panel, BORDER: rgba(border), TINT: rgba(text) },
      BOARD: {
        SURFACE: rgba(surface, dark ? 0.5 : 0.6),
        BORDER: rgba(border),
        CELL_EMPTY: dark ? rgba(accent, 0.14) : rgba(surface, 0.85),
        GRID_LINE: rgba(text, dark ? 0.2 : 0.12),
        CELL_HIGHLIGHT: rgba(accent, dark ? 0.32 : 0.22),
        CELL_INVALID: rgba(danger),
      },
    };
  }
  return overrides;
};

let configured = false;

/**
 * The active game palette for a light/dark preference, built from the site's own tokens.
 * Configures the games once, in the browser, before the first game renders.
 */
export function resolveSiteGameTheme(mode: GameThemeMode) {
  if (!configured && typeof document !== "undefined") {
    configureGameThemes(buildOverrides());
    configured = true;
  }
  return resolveGameTheme(mode);
}
