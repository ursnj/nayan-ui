// Games copied from the Playtura games library (packages/games/src), with the shared engine screen,
// HUD, loading and settings code they use. Each game is a component taking GameProps.
export { CarRacing } from './src/games/car-racing/CarRacing';
export { DEFAULT_GAME_SETTINGS, type GameProps, type GameSettings } from './src/services/UtilsService';
export { resolveGameTheme } from './src/services/ThemeService';
