// Helpers shared by the Nayan engine games. Engine options take theme colors ('#RRGGBB', 'rgba(…)')
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

/**
 * How long (game seconds) a new board's intro stays due. The screen is laid out again a few frames in,
 * once the header's real height is measured, and the board rebuilt for it should play the intro again
 * rather than appear at rest: keep `intro` set until the intro has run this long (`introPlayed`).
 */
const INTRO_REPLAY_TIME = 0.5;

/** Ages a due intro by `dt`; once it's played long enough, clears `intro` so later rebuilds show the board at rest. */
export function introPlayed(g: { intro: boolean; introAge: number }, dt: number) {
  if (g.intro && g.introAge >= 0 && (g.introAge += dt) >= INTRO_REPLAY_TIME) g.intro = false;
}
