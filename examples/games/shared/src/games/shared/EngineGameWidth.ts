/** Native boards retain the established game width. */
export const MAX_GAME_WIDTH = 500;
export const gameWidthFor = (viewWidth: number) => Math.min(viewWidth - 30, MAX_GAME_WIDTH);
