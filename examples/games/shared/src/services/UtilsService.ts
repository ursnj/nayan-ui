import { type ComponentType, type ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { gameWidthFor } from '../games/shared/EngineGameWidth';

export function getScreenDimensions(): { width: number; height: number } {
  const { width, height } = Dimensions.get('window');
  return { width, height };
}

export const isTablet = getScreenDimensions().width > 640;

export const getGameDimensions = () => {
  const { width, height } = getScreenDimensions();
  const gameWidth = gameWidthFor(width);
  return { width: gameWidth, height, screenWidth: width };
};

export type GameThemeMode = 'light' | 'dark';

export interface GameSettings {
  isVisible: boolean;
  /** Pause gameplay while a host panel is open, without opening settings. */
  paused?: boolean;
  enableSounds: boolean;
  enableHaptics: boolean;
  enableMusic: boolean;
  offset?: number;
  /** Host settings trigger's screen-space attachment point. */
  anchor?: { top: number; right: number };
  /** Host app's colour scheme. Applied by games listed in THEMED_GAMES; others keep the classic look. */
  theme?: GameThemeMode;
}

export interface GameCompletionMetrics {
  status: 'win' | 'lose' | 'cancel';
  score: string;
  additionalData?: Record<string, any>; // Optional game-specific data
}

export interface GameProps {
  settings: GameSettings;
  /** Hosts can disable navigation gestures for the duration of a run, including pauses. */
  onPlayingChange?: (playing: boolean) => void;
  onSettingsChange?: (settings: GameSettings) => void;
  onEndGame?: (metrics: GameCompletionMetrics) => void;
  onReplayGame?: () => void;
  onShare?: () => void;
  onShareScreenshot?: () => void;
  onShowLeaderboard?: () => void;
  bannerAd?: ReactNode;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  isVisible: false,
  enableSounds: true,
  enableHaptics: true,
  enableMusic: false,
  offset: 0
};

export enum GAME_IDS {
  WHACK_A_MOLE = 'whack-a-mole',
  POPIT_FIDGET = 'popit-fidget',
  FRUIT_NINJA = 'fruit-ninja',
  BALLOON_BLASTER = 'balloon-blaster',
  SPACE_FIGHTER = 'space-fighter',
  MAZE_RUNNER = 'maze-runner',
  SLIDING_NUMBERS = 'sliding-numbers',
  GAME_2048 = 'game-2048',
  DINO_JUMP = 'dino-jump',
  COLORS_SORT = 'colors-sort',
  FRUIT_MERGER = 'fruit-merger',
  FLAPPY_BIRD = 'flappy-bird',
  CANDY_CRUSH = 'candy-crush',
  SNAKE_3D = 'snake-3d',
  CAR_RACING = 'car-racing',
  BIKE_RACING = 'bike-racing',
  BLOCK_BLAST = 'block-blast',
  BUBBLE_SHOOTER = 'bubble-shooter',
  PERFECT_CIRCLE = 'perfect-circle',
  SPIDER_SOLITAIRE = 'spider-solitaire',
  TIC_TAC_TOE = 'tic-tac-toe',
  PAC_MAN = 'pac-man',
  TILE_HOME = 'tile-home',
  WORD_SEARCH = 'word-search',
  CONNECT_EM_ALL = 'connect-em-all',
  NUTS_AND_BOLTS = 'nuts-and-bolts',
  NUMBER_SEARCH = 'number-search',
  DOTS_AND_BOXES = 'dots-and-boxes',
  LUDO_KING = 'ludo-king',
  TANK_1990 = 'tank-1990',
  BLOCK_BREAKER = 'block-breaker',
  STACK_TOWER = 'stack-tower',
  MINE_SWEEPER = 'mine-sweeper',
  SUDOKU = 'sudoku',
  KNIFE_HIT = 'knife-hit',
  COLOR_SWITCH = 'color-switch',
  PIPE_CONNECT = 'pipe-connect',
  ARROWS = 'arrows',
  FIND_DIFFERENT_NUMBER = 'find-different-number',
  SNAKES_AND_LADDERS = 'snakes-and-ladders',
  BLUK = 'bluk',
  CHAMELEON_RUN = 'chameleon-run',
  MOB_CONTROL = 'mob-control',
  PAPER_IO = 'paper-io',
  CROSSY_ROAD = 'crossy-road',
  TANGRAM = 'tangram',
  CHECKERS = 'checkers',
  MEMORY_MATCH = 'memory-match',
  FALLING_STICKS = 'falling-sticks',
  REVERSI = 'reversi',
  PENGUIN_RUN = 'penguin-run',
  PLAY_WITH_TUA = 'play-with-tua',
  TREASURE_HUNT = 'treasure-hunt'
}

export type GameComponent = ComponentType<GameProps>;

export type GameCategory = 'arcade' | 'block' | 'casual' | 'action' | 'brain' | 'education' | 'puzzle' | 'racing' | 'strategy';

export interface GameDefinition {
  id: GAME_IDS;
  title: string;
  description: string;
  instructions: string[];
  categories: GameCategory[];
  component: GameComponent;
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
