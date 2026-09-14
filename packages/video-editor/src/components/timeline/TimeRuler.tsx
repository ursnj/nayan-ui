import { formatTimecode, pickTickInterval } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import { US } from '../../types';
import { RULER_HEIGHT } from './constants';

interface TimeRulerProps {
  width: number;
  pxPerSec: number;
  onScrub: (event: React.PointerEvent) => void;
}

/**
 * Time ruler and the in/out range band.
 *
 * Tick spacing adapts to zoom via `pickTickInterval`, which walks a 1/2/5
 * ladder until labels are at least 70px apart — so the ruler stays readable
 * from a whole-project overview down to single frames.
 */
export const TimeRuler = ({ width, pxPerSec, onScrub }: TimeRulerProps) => {
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
  /** Rough width of a timecode; a label nearer the edge than this would spill. */
  const labelWidth = 44;

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

        {Array.from({ length: tickCount }, (_, index) => {
          const seconds = index * interval;
          const left = seconds * pxPerSec;
          return (
            <div key={index} className="pointer-events-none absolute top-0 h-full" style={{ left }}>
              <div className="h-2.5 w-px bg-separator" />
              {/* Drop the label rather than let it run off the end half-drawn. */}
              {left + labelWidth <= width && (
                <span className="absolute left-1 top-1.5 whitespace-nowrap font-mono text-[10px] tabular-nums text-muted">
                  {formatTimecode(seconds * US)}
                </span>
              )}
            </div>
          );
        })}

        {/* Half-interval minor ticks for finer visual reference. */}
        {Array.from({ length: tickCount }, (_, index) => (index + 0.5) * tickSpacing)
          .filter(left => left <= width)
          .map(left => (
            <div key={`minor-${left}`} className="pointer-events-none absolute top-0 h-1.5 w-px bg-separator/50" style={{ left }} />
          ))}
      </div>
    </div>
  );
};
