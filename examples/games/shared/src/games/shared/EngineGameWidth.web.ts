/** Keep browser boards compact, with room around raised pieces and the shared HUD. */
export const MAX_GAME_WIDTH = 420;
export const gameWidthFor = (viewWidth: number) => Math.min(viewWidth - 48, MAX_GAME_WIDTH);
