/** Width of the sticky track-header column, in px. */
export const HEADER_WIDTH = 184;
/** Height of the time ruler, in px. */
export const RULER_HEIGHT = 30;
/** Height of the marker lane below the ruler, in px. */
export const MARKER_LANE_HEIGHT = 18;
/**
 * The track header's two control rows come to exactly 52px:
 * `py-1 (8) + h-5 (20) + gap-1 (4) + h-5 (20)`. That is the floor — any less
 * and the level fader starts getting clipped.
 */
export const MIN_ROW_HEIGHT = 52;
/** Only reachable by dragging a row taller on purpose. */
export const MAX_ROW_HEIGHT = 160;
/** Grab area on each side of a clip for trimming, in px. */
export const TRIM_HANDLE_WIDTH = 9;
/** Snap radius, in px — converted to time using the current zoom. */
export const SNAP_RADIUS_PX = 9;
/** Trailing empty space after the last clip so it can always be dragged later. */
export const TAIL_PADDING_PX = 320;
/** Clips further than this outside the viewport aren't rendered at all. */
export const VIRTUALISE_OVERSCAN_PX = 400;
