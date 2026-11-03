import { GAME_IDS } from './UtilsService';

// Global primary and background colors for all games
export const PRIMARY_COLOR = '#ffffff';
export const BACKGROUND_COLOR = '#3a3a5e';

// Derived transparent colors from PRIMARY_COLOR
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

// Game Names
export const GAME_NAMES = {
  BALLOON_BLASTER: 'balloonBlaster',
  FRUIT_SLICER: 'fruitSlicer',
  MAZE_RUNNER: 'mazeRunner',
  CAT_POPPER: 'catPopper',
  SPACE_TRAVELLER: 'spaceTraveller'
} as const;

export type GameName = (typeof GAME_NAMES)[keyof typeof GAME_NAMES];

// Game titles mapping - avoids circular dependency with GamesService
export const getGameTitle = (gameId: string): string => {
  switch (gameId) {
    case GAME_IDS.PLAY_WITH_TUA:
      return 'Play With Tua';
    case GAME_IDS.TREASURE_HUNT:
      return 'Treasure Hunt';
    case GAME_IDS.BALLOON_BLASTER:
      return 'Balloon Blaster';
    case GAME_IDS.FRUIT_NINJA:
      return 'Fruit Ninja';
    case GAME_IDS.MAZE_RUNNER:
      return 'Maze Runner';
    case GAME_IDS.WHACK_A_MOLE:
      return 'Whack-a-Mole';
    case GAME_IDS.SPACE_FIGHTER:
      return 'Space Fighter';
    case GAME_IDS.POPIT_FIDGET:
      return 'Pop It Fidget';
    case GAME_IDS.SLIDING_NUMBERS:
      return 'Sliding Numbers';
    case GAME_IDS.GAME_2048:
      return '2048';
    case GAME_IDS.DINO_JUMP:
      return 'Dino Jump';
    case GAME_IDS.COLORS_SORT:
      return 'Colors Sort';
    case GAME_IDS.FRUIT_MERGER:
      return 'Fruit Merger';
    case GAME_IDS.FLAPPY_BIRD:
      return 'Flappy Bird';
    case GAME_IDS.CANDY_CRUSH:
      return 'Candy Crush';
    case GAME_IDS.SNAKE_3D:
      return 'Snake 3D';
    case GAME_IDS.CAR_RACING:
      return 'Car Racing';
    case GAME_IDS.BIKE_RACING:
      return 'Bike Racing';
    case GAME_IDS.BLOCK_BLAST:
      return 'Block Blast';
    case GAME_IDS.BUBBLE_SHOOTER:
      return 'Bubble Shooter';
    case GAME_IDS.PERFECT_CIRCLE:
      return 'Perfect Circle';
    case GAME_IDS.TIC_TAC_TOE:
      return 'Tic Tac Toe';
    case GAME_IDS.SPIDER_SOLITAIRE:
      return 'Spider Solitaire';
    case GAME_IDS.PAC_MAN:
      return 'Pac-Man';
    case GAME_IDS.TILE_HOME:
      return 'Tile Home';
    case GAME_IDS.WORD_SEARCH:
      return 'Word Search';
    case GAME_IDS.CONNECT_EM_ALL:
      return 'Connect Em All';
    case GAME_IDS.NUTS_AND_BOLTS:
      return 'Nuts and Bolts';
    case GAME_IDS.NUMBER_SEARCH:
      return 'Number Search';
    case GAME_IDS.DOTS_AND_BOXES:
      return 'Dots and Boxes';
    case GAME_IDS.LUDO_KING:
      return 'Ludo King';
    case GAME_IDS.TANK_1990:
      return 'Tank 1990';
    case GAME_IDS.BLOCK_BREAKER:
      return 'Block Breaker';
    case GAME_IDS.STACK_TOWER:
      return 'Stack Tower';
    case GAME_IDS.MINE_SWEEPER:
      return 'Mine Sweeper';
    case GAME_IDS.SUDOKU:
      return 'Sudoku';
    case GAME_IDS.KNIFE_HIT:
      return 'Knife Hit';
    case GAME_IDS.COLOR_SWITCH:
      return 'Color Switch';
    case GAME_IDS.PIPE_CONNECT:
      return 'Pipe Connect';
    case GAME_IDS.ARROWS:
      return 'Arrows';
    case GAME_IDS.FIND_DIFFERENT_NUMBER:
      return 'Find Different Number';
    case GAME_IDS.SNAKES_AND_LADDERS:
      return 'Snakes and Ladders';
    case GAME_IDS.BLUK:
      return 'Bluk';
    case GAME_IDS.CHAMELEON_RUN:
      return 'Chameleon Run';
    case GAME_IDS.MOB_CONTROL:
      return 'Mob Control';
    case GAME_IDS.PAPER_IO:
      return 'Paper IO';
    case GAME_IDS.CROSSY_ROAD:
      return 'Crossy Road';
    case GAME_IDS.TANGRAM:
      return 'Tangram';
    case GAME_IDS.CHECKERS:
      return 'Checkers';
    case GAME_IDS.MEMORY_MATCH:
      return 'Memory Match';
    case GAME_IDS.FALLING_STICKS:
      return 'Falling Sticks';
    case GAME_IDS.REVERSI:
      return 'Reversi';
    case GAME_IDS.PENGUIN_RUN:
      return 'Penguin Run';
    default:
      return 'Game Settings';
  }
};

// --- Color helpers for 3D faces ---
export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
};

export const rgbToHex = (r: number, g: number, b: number) =>
  '#' +
  [r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('');

export const lighten = (hex: string, amount: number) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
};

export const darken = (hex: string, amount: number) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
};
