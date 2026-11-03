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
  SWITCH_THUMB: COLORS.SWITCH_THUMB
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
  SWITCH_THUMB: '#FFFFFF'
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
  SWITCH_THUMB: '#F9F8FB'
};

/** Built-in palettes (light / dark default to Playtura's colours). Use resolveGameTheme to get the active ones. */
export const GAME_THEMES = {
  classic: CLASSIC_THEME,
  light: LIGHT_THEME,
  dark: DARK_THEME
} as const;

const activeThemes: Record<GameThemeMode, GameTheme> = { light: LIGHT_THEME, dark: DARK_THEME };

/** Active theme for a settings value; games that have not opted in (or no theme passed) get `classic`. */
export const resolveGameTheme = (mode?: GameThemeMode): GameTheme => (mode ? activeThemes[mode] : CLASSIC_THEME);

/**
 * Games that render with `settings.theme` (all of them, each wrapped in GameThemeProvider). Hosts use
 * this to theme their own chrome (header, status bar) to match. A new game must wrap itself in
 * GameThemeProvider too, or be listed as an exception here.
 */
const THEMED_GAMES: ReadonlySet<GAME_IDS> = new Set(Object.values(GAME_IDS));

export const isThemedGame = (gameId: GAME_IDS | null | undefined): boolean => !!gameId && THEMED_GAMES.has(gameId);
