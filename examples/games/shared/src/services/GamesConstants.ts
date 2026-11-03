import { GAME_IDS } from './UtilsService';

// Global background color for all games
export const BACKGROUND_COLOR = '#3a3a5e';

// Derived transparent colors (white and black)
export const COLORS = {
  // Component backgrounds and borders (white transparent)
  BG_35: 'rgba(255, 255, 255, 0.35)',
  BG_40: 'rgba(255, 255, 255, 0.40)',
  BG_50: 'rgba(255, 255, 255, 0.50)',
  // Overlay backgrounds (black transparent)
  OVERLAY: 'rgba(0, 0, 0, 0.8)',
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.5)',
  // Text colors
  TEXT: '#ffffff',
  TEXT_MUTED: '#cccccc',
  // Accent color
  ACCENT: '#3b82f6',
  ACCENT_LIGHT: '#60a5fa',
  // Switch colors
  SWITCH_TRACK_OFF: '#555555',
  SWITCH_TRACK_ON: '#3b82f6',
  SWITCH_THUMB: '#ffffff',
  // Score display
  SCORE_GOLD: '#facc15'
} as const;

// Shared in-game chrome (scoreboard, control buttons, modals): frosted white. A light fill with a
// brighter thin rim keeps panels crisp instead of milky. SOLID is the Game Over modal's Play Again.
export const HUD = {
  SURFACE: 'rgba(255, 255, 255, 0.3)',
  BORDER: 'rgba(255, 255, 255, 0.6)',
  BORDER_WIDTH: 1.5,
  DIVIDER: 'rgba(255, 255, 255, 0.25)',
  TEXT: '#ffffff',
  TEXT_MUTED: 'rgba(255, 255, 255, 0.85)',
  TEXT_SHADOW: 'rgba(0, 0, 0, 0.35)',
  SOLID: '#ffffff',
  ON_SOLID: '#3a3a5e'
} as const;

// Game titles for the settings modal (the games library lists every game here)
export const getGameTitle = (gameId: string): string => {
  switch (gameId) {
    case GAME_IDS.CAR_RACING:
      return 'Car Racing';
    default:
      return 'Game Settings';
  }
};
