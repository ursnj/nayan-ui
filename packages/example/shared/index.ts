import { CarRacing as CarRacingGame } from './src/games/car-racing/CarRacing';
import { withGameLoading } from './src/games/shared/EngineGameLoader';
import { GAME_IDS } from './src/services/UtilsService';

/** Car Racing behind the games library's loader: its models, textures and sounds are prepared a few jobs per frame first. */
export const CarRacing = withGameLoading(GAME_IDS.CAR_RACING, () => CarRacingGame);
export { DEFAULT_GAME_SETTINGS, type GameProps, type GameSettings } from './src/services/UtilsService';
export { resolveGameTheme } from './src/services/ThemeService';
