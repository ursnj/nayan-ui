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

interface GameCompletionMetrics {
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
  CAR_RACING = 'car-racing'
}

type GameComponent = ComponentType<GameProps>;

export type GameCategory = 'arcade' | 'block' | 'casual' | 'action' | 'brain' | 'education' | 'puzzle' | 'racing' | 'strategy';

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
