import { BACKGROUND_COLOR, COLORS, HUD } from './GamesConstants';
import { GAME_IDS, type GameThemeMode } from './UtilsService';

/**
 * Colour tokens shared by a game's chrome (background, scoreboard, controls, modals) and its board.
 *
 * `light` and `dark` mirror the host app's design tokens (Playtura `src/global.css`), so a themed
 * game sits on the same background, surfaces, borders, text and accent as the screens around it.
 * `classic` is the original look (white frosted panels on the indigo pattern) and is what every
 * game gets until it opts into theming via `GameThemeProvider`.
 */
export interface GameTheme {
  mode: 'classic' | GameThemeMode;
  isDark: boolean;
  // Screen
  BACKGROUND: string;
  PATTERN_OPACITY: number;
  // Panels (scoreboard, icon buttons, modal cards)
  SURFACE: string;
  BORDER: string;
  BORDER_WIDTH: number;
  DIVIDER: string;
  // Text
  TEXT: string;
  TEXT_MUTED: string;
  LABEL: string; // scoreboard labels + control button subtitles (solid, same as TEXT today)
  TEXT_SUBTLE: string;
  TEXT_SHADOW: string;
  // Solid button on modal cards (Play Again)
  SOLID: string;
  ON_SOLID: string;
  // Accents
  SCORE_HIGHLIGHT: string;
  DANGER: string;
  CHIP: string;
  // Modals
  OVERLAY: string;
  // Switch
  SWITCH_TRACK_OFF: string;
  SWITCH_TRACK_ON: string;
  SWITCH_THUMB: string;
  // Host app header over the game (title, back / settings icons use TINT)
  HEADER: {
    BACKGROUND: string;
    BORDER: string;
    TINT: string;
  };
  // Game boards / grids
  BOARD: {
    SURFACE: string;
    BORDER: string;
    CELL_EMPTY: string;
    GRID_LINE: string; // separators between cells — visible on CELL_EMPTY
    CELL_HIGHLIGHT: string;
    CELL_INVALID: string; // 6-digit hex: games append an alpha byte
    FLASH: string;
  };
}

const CLASSIC_THEME: GameTheme = {
  mode: 'classic',
  isDark: true,
  BACKGROUND: BACKGROUND_COLOR,
  PATTERN_OPACITY: 1,
  SURFACE: HUD.SURFACE,
  BORDER: HUD.BORDER,
  BORDER_WIDTH: HUD.BORDER_WIDTH,
  DIVIDER: HUD.DIVIDER,
  TEXT: HUD.TEXT,
  TEXT_MUTED: HUD.TEXT_MUTED,
  LABEL: HUD.TEXT,
  TEXT_SUBTLE: COLORS.TEXT_MUTED,
  TEXT_SHADOW: HUD.TEXT_SHADOW,
  SOLID: HUD.SOLID,
  ON_SOLID: HUD.ON_SOLID,
  SCORE_HIGHLIGHT: COLORS.SCORE_GOLD,
  DANGER: '#FF5252',
  CHIP: 'rgba(255, 255, 255, 0.2)',
  OVERLAY: COLORS.OVERLAY,
  SWITCH_TRACK_OFF: COLORS.SWITCH_TRACK_OFF,
  SWITCH_TRACK_ON: COLORS.SWITCH_TRACK_ON,
  SWITCH_THUMB: COLORS.SWITCH_THUMB,
  HEADER: {
    BACKGROUND: 'rgba(255, 255, 255, 0.2)',
    BORDER: 'rgba(255, 255, 255, 0.3)',
    TINT: '#FFFFFF'
  },
  BOARD: {
    SURFACE: 'rgba(255, 255, 255, 0.15)',
    BORDER: 'transparent',
    CELL_EMPTY: 'rgba(255, 255, 255, 0.25)',
    GRID_LINE: 'rgba(255, 255, 255, 0.35)',
    CELL_HIGHLIGHT: 'rgba(255, 255, 255, 0.32)',
    CELL_INVALID: '#ff4444',
    FLASH: '#ffffff'
  }
};

// Light — translucent white panels and board over the app's light background; colours from Playtura's light tokens: background hsl(252 35% 93%), surface white,
// foreground hsl(222 47% 11%), muted hsl(215 16% 47%), accent hsl(256 89% 60%), border hsl(252 25% 86%)
const LIGHT_THEME: GameTheme = {
  mode: 'light',
  isDark: false,
  BACKGROUND: '#C8C2E0', // app background hue (252°), a few steps darker so the translucent white panels read clearly
  PATTERN_OPACITY: 0.55,
  SURFACE: 'rgba(255, 255, 255, 0.35)',
  BORDER: 'rgba(255, 255, 255, 0.9)',
  BORDER_WIDTH: 1.5,
  DIVIDER: 'rgba(15, 23, 41, 0.08)',
  TEXT: '#0F1729',
  TEXT_MUTED: '#65758B',
  LABEL: '#0F1729',
  TEXT_SUBTLE: '#0F1729', // Game Over message, score label and share prompt — solid, like TEXT
  TEXT_SHADOW: 'transparent',
  SOLID: '#6F3EF4',
  ON_SOLID: '#FFFFFF',
  SCORE_HIGHLIGHT: '#6F3EF4',
  DANGER: '#EF4343',
  CHIP: 'rgba(255, 255, 255, 0.75)',
  OVERLAY: 'rgba(15, 23, 41, 0.8)',
  SWITCH_TRACK_OFF: 'rgba(15, 23, 41, 0.15)',
  SWITCH_TRACK_ON: '#6F3EF4',
  SWITCH_THUMB: '#FFFFFF',
  HEADER: {
    BACKGROUND: 'rgba(255, 255, 255, 0.35)',
    BORDER: 'rgba(255, 255, 255, 0.9)',
    TINT: '#0F1729'
  },
  BOARD: {
    SURFACE: 'rgba(255, 255, 255, 0.45)',
    BORDER: 'rgba(255, 255, 255, 0.9)',
    CELL_EMPTY: 'rgba(255, 255, 255, 0.65)',
    GRID_LINE: 'rgba(15, 23, 41, 0.14)',
    CELL_HIGHLIGHT: 'rgba(111, 62, 244, 0.22)',
    CELL_INVALID: '#EF4343',
    FLASH: '#FFFFFF'
  }
};

// Dark — translucent dark panels for the header, scoreboard and controls over game scenes;
// background, text and accent come from Playtura's dark tokens: background hsl(252 40% 12%),
// foreground hsl(250 30% 98%), muted hsl(250 18% 64%), accent hsl(256 92% 72%)
const DARK_THEME: GameTheme = {
  mode: 'dark',
  isDark: true,
  BACKGROUND: '#100C1D',
  PATTERN_OPACITY: 0.25,
  SURFACE: 'rgba(20, 16, 34, 0.35)',
  BORDER: 'rgba(153, 118, 249, 0.22)', // faint rim in the panel's own purple, blends with the background
  BORDER_WIDTH: 1.5,
  DIVIDER: 'rgba(153, 118, 249, 0.25)',
  TEXT: '#F9F8FB',
  TEXT_MUTED: '#9893B4',
  LABEL: '#F9F8FB',
  TEXT_SUBTLE: '#F9F8FB',
  TEXT_SHADOW: 'transparent',
  SOLID: '#9976F9',
  ON_SOLID: '#FFFFFF',
  SCORE_HIGHLIGHT: '#F6A823',
  DANGER: '#DC2828',
  CHIP: 'rgba(153, 118, 249, 0.25)',
  OVERLAY: 'rgba(0, 0, 0, 0.86)',
  SWITCH_TRACK_OFF: 'rgba(153, 118, 249, 0.3)',
  SWITCH_TRACK_ON: '#9976F9',
  SWITCH_THUMB: '#F9F8FB',
  HEADER: {
    BACKGROUND: 'rgba(20, 16, 34, 0.35)',
    BORDER: 'rgba(153, 118, 249, 0.2)',
    TINT: '#F9F8FB'
  },
  BOARD: {
    SURFACE: 'rgba(153, 118, 249, 0.12)',
    BORDER: 'rgba(153, 118, 249, 0.3)',
    CELL_EMPTY: 'rgba(153, 118, 249, 0.2)',
    GRID_LINE: 'rgba(153, 118, 249, 0.35)',
    CELL_HIGHLIGHT: 'rgba(153, 118, 249, 0.3)',
    CELL_INVALID: '#DC2828',
    FLASH: '#FFFFFF'
  }
};

/**
 * Shared night palette for games that paint their own outdoor scene (sky, moon, clouds, hills).
 * Dark mode recolours those scenes with these values so every night scene looks alike; light and
 * classic keep the original day art. Ordered far → near for hills (atmospheric perspective).
 */
export const NIGHT_SCENE = {
  SKY: ['#120E24', '#17122B', '#241D40', '#3A3160'], // zenith → horizon
  HAZE: 'rgba(153, 118, 249, 0.10)',
  STAR: 'rgba(249, 248, 251, 0.85)',
  MOON: {
    CORE: ['#FFFFFF', '#EEEAF8', '#D6CEEC'], // radial, centre → edge
    CRATER: 'rgba(120, 108, 165, 0.22)',
    GLOW: '#C4B5FD' // drawn as soft concentric halos at low alpha
  },
  CLOUD: {
    BODY: 'rgba(92, 84, 132, 0.78)',
    SHADOW: 'rgba(52, 45, 84, 0.55)', // underside
    RIM: 'rgba(196, 181, 253, 0.45)' // moonlit top edge
  },
  // Hills are silhouettes against the brighter horizon: each layer is [ridge, base] and gets darker toward
  // the viewer; the moonlit rim and mist bands keep the layers apart.
  HILL: {
    FAR: ['#22264E', '#1A1D40'], // clearly darker than the horizon sky (#3A3160)
    MID: ['#22334A', '#18263A'],
    NEAR: ['#17362A', '#0F241C'],
    RIM: 'rgba(214, 204, 255, 0.2)', // a hint of moonlight, not an outline
    MIST: 'rgba(120, 104, 190, 0.22)'
  },
  GRASS: ['#24442C', '#1A3322'],
  GROUND: ['#3B2F2A', '#2A211E']
} as const;

/**
 * Day palette for the shared scene hills in light mode (classic keeps each game's original hills).
 * Far layers are hazier and bluer (atmospheric perspective); each layer is [ridge, base].
 */
export const DAY_SCENE = {
  HILL: {
    FAR: ['#BCD8C8', '#A6CBB6'],
    MID: ['#93C29E', '#7DB38A'],
    NEAR: ['#74AE7E', '#5E9C69'],
    RIM: 'rgba(255, 255, 240, 0.18)', // a hint of sunlight, not an outline
    MIST: 'rgba(255, 255, 255, 0.28)'
  }
} as const;

/** Built-in palettes (light / dark default to Playtura's colours). Use resolveGameTheme to get the active ones. */
export const GAME_THEMES = {
  classic: CLASSIC_THEME,
  light: LIGHT_THEME,
  dark: DARK_THEME
} as const;

type DeepPartial<T> = { [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Colours a host app may override per mode; anything left out keeps the built-in value. */
export type GameThemeOverrides = Partial<Record<GameThemeMode, DeepPartial<Omit<GameTheme, 'mode' | 'isDark'>>>>;

const mergeTheme = <T extends object>(base: T, override?: DeepPartial<T>): T => {
  if (!override) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = out[key];
    out[key] =
      value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object'
        ? mergeTheme(current as object, value as DeepPartial<object>)
        : value;
  }
  return out as T;
};

// Active light / dark themes: the built-ins until an app calls configureGameThemes. Built once per call,
// so each mode keeps one stable object (games cache styles and rendered elements per theme object).
let activeThemes: Record<GameThemeMode, GameTheme> = { light: LIGHT_THEME, dark: DARK_THEME };

/**
 * Override the light / dark game colours with the host app's palette. Call once at app start, before
 * any game renders (e.g. at module scope in the root layout). The classic theme is not configurable.
 *
 * configureGameThemes({ light: { BACKGROUND: '#DCE7F6', SOLID: '#0F62F2', BOARD: { CELL_HIGHLIGHT: 'rgba(15, 98, 242, 0.22)' } } });
 */
export const configureGameThemes = (overrides: GameThemeOverrides) => {
  activeThemes = {
    light: mergeTheme<GameTheme>(LIGHT_THEME, overrides.light as DeepPartial<GameTheme> | undefined),
    dark: mergeTheme<GameTheme>(DARK_THEME, overrides.dark as DeepPartial<GameTheme> | undefined)
  };
};

/** Active theme for a settings value; games that have not opted in (or no theme passed) get `classic`. */
export const resolveGameTheme = (mode?: GameThemeMode): GameTheme => (mode ? activeThemes[mode] : CLASSIC_THEME);

/**
 * Games that render with `settings.theme` (all of them, each wrapped in GameThemeProvider). Hosts use
 * this to theme their own chrome (header, status bar) to match. A new game must wrap itself in
 * GameThemeProvider too, or be listed as an exception here.
 */
export const THEMED_GAMES: ReadonlySet<GAME_IDS> = new Set(Object.values(GAME_IDS));

export const isThemedGame = (gameId: GAME_IDS | null | undefined): boolean => !!gameId && THEMED_GAMES.has(gameId);
