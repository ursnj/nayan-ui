import { memo } from 'react';
import { cn, pickTickInterval } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import { US } from '../../types';
import { HEADER_WIDTH, RULER_HEIGHT, VIRTUALISE_OVERSCAN_PX } from './constants';

interface TimeRulerProps {
  width: number;
  pxPerSec: number;
  /**
   * The horizontal scroll window, in content pixels — the same measurement the
   * lanes virtualise against, so ruler and clips appear and disappear together.
   */
  viewportLeft: number;
  viewportWidth: number;
  onScrub: (event: React.PointerEvent) => void;
}

/**
 * Time ruler and the in/out range band.
 *
 * Tick spacing adapts to zoom via `pickTickInterval`, which walks a 1/2/5
 * ladder until labels are at least 70px apart — so the ruler stays readable
 * from a whole-project overview down to single frames.
 */
/**
 * Label for a tick, at a precision the tick spacing actually warrants.
 *
 * `formatTimecode` always appends a tenth, so a two-second interval read
 * `00:02.0`, `00:04.0` — a decimal that is always zero and only adds width.
 * Worse, it floors the fraction, so a quarter-second interval printed `.2`
 * for 0.25 and `.7` for 0.75. Below a second the fraction is shown exactly;
 * at or above one, it is left off.
 */
const pad = (value: number) => String(value).padStart(2, '0');

const rulerLabel = (seconds: number, interval: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  if (interval >= 1) return `${pad(minutes)}:${pad(Math.round(rest))}`;
  return `${pad(minutes)}:${rest.toFixed(2).padStart(5, '0')}`;
};

/**
 * Memoised, and only the ticks on screen are built.
 *
 * `width` is the whole project, not the window onto it, so a ten-minute
 * timeline at a working zoom asked for well over a thousand tick elements —
 * three DOM nodes each — none of which could be seen. Worse, this used to
 * rebuild all of them on every parent render, which includes each pointer
 * move of a marquee drag and each scroll event.
 */
export const TimeRuler = memo(({ width, pxPerSec, viewportLeft, viewportWidth, onScrub }: TimeRulerProps) => {
  const inPointUs = useEditor(state => state.inPointUs);
  const outPointUs = useEditor(state => state.outPointUs);

  const interval = pickTickInterval(pxPerSec);
  const tickSpacing = interval * pxPerSec;
  /*
   * Ticks land at 0, interval, 2*interval … up to and including the last one
   * that still fits.
   *
   * Rounding *up* here — as this did — puts the final tick past the right
   * edge, and its timecode label past that again. They are absolutely
   * positioned in a container with no overflow rule, so they do not merely
   * draw outside the ruler: they enlarge the timeline's scrollable area, and
   * the scroll they add is empty by construction.
   */
  const tickCount = Math.floor(width / tickSpacing) + 1;
  /** Rough width of a label; one nearer the edge than this would spill. */
  const labelWidth = interval >= 1 ? 36 : 48;

  /*
   * The slice of the ladder the window can actually see, with the lanes' own
   * overscan either side so a fast scroll never outruns the next render.
   *
   * The ruler starts after the sticky header column, so a tick's local x is
   * `HEADER_WIDTH` short of its content x — the same offset the lanes correct
   * for when they pick which clips to mount.
   */
  const firstTick = Math.max(0, Math.floor((viewportLeft - HEADER_WIDTH - VIRTUALISE_OVERSCAN_PX) / tickSpacing));
  const lastTick = Math.min(tickCount - 1, Math.ceil((viewportLeft + viewportWidth - HEADER_WIDTH + VIRTUALISE_OVERSCAN_PX) / tickSpacing));
  const visibleTicks = Math.max(0, lastTick - firstTick + 1);

  const rangeLeft = ((inPointUs ?? 0) / US) * pxPerSec;
  const rangeRight = outPointUs !== null ? (outPointUs / US) * pxPerSec : width;
  const hasRange = inPointUs !== null || outPointUs !== null;

  return (
    <div style={{ width }} className="relative">
      <div
        role="presentation"
        onPointerDown={onScrub}
        style={{ height: RULER_HEIGHT }}
        className="relative cursor-ew-resize overflow-hidden border-b border-border bg-editor-ruler">
        {hasRange && (
          <div
            className="absolute inset-y-0 border-x-2 border-accent bg-accent/15"
            style={{ left: rangeLeft, width: Math.max(0, rangeRight - rangeLeft) }}
          />
        )}

        {/* Marks along the top, numbers along the bottom — they occupy
            separate bands of the ruler's 30px so neither crowds the other. */}
        {Array.from({ length: visibleTicks }, (_, offset) => {
          const index = firstTick + offset;
          const seconds = index * interval;
          const left = seconds * pxPerSec;
          /*
           * Centred on its mark by shifting the label back half its own
           * width, which needs no fixed box and so stays correct whether the
           * text reads `00:02` or `00:00.25`.
           *
           * The first one is the exception: centring `00:00` on x=0 would put
           * half of it outside the ruler, where it is clipped. That one sits
           * flush to the start instead.
           */
          const centred = index > 0;
          if (centred && left + labelWidth / 2 > width) return null;
          return (
            <div key={index} className="pointer-events-none absolute inset-y-0" style={{ left }}>
              <div className="absolute top-0 h-2.5 w-px bg-separator" />
              <span
                className={cn(
                  'absolute bottom-[3px] left-0 whitespace-nowrap font-mono text-[10px] leading-none tabular-nums text-muted',
                  centred && '-translate-x-1/2'
                )}>
                {rulerLabel(seconds, interval)}
              </span>
            </div>
          );
        })}

        {/* Half-interval marks, shorter, sharing the top edge. */}
        {Array.from({ length: visibleTicks }, (_, offset) => (firstTick + offset + 0.5) * tickSpacing)
          .filter(left => left <= width)
          .map(left => (
            <div key={`minor-${left}`} className="pointer-events-none absolute top-0 h-1.5 w-px bg-separator/50" style={{ left }} />
          ))}
      </div>
    </div>
  );
});

TimeRuler.displayName = 'TimeRuler';
