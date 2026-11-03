// Helpers shared by the Nayan Game Engine games. Engine options take theme colors ('#RRGGBB', 'rgba(…)')
// directly; `toColor` gives the 0..1 tuple when a game needs the numbers, and `frontLight` keeps flat
// board surfaces at their exact theme color. Both live in the engine.
import { toColor } from '@nayan-ui/engine';

export { frontLight, toColor } from '@nayan-ui/engine';

/** A theme color's RGB. */
export function toRgb(css: string): readonly [number, number, number] {
  const [r, g, b] = toColor(css);
  return [r, g, b];
}

export { MAX_GAME_WIDTH, gameWidthFor } from './EngineGameWidth';
