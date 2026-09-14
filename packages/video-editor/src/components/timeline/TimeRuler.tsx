import { formatTimecode, pickTickInterval } from '../../lib/utils';
import { US } from '../../types';
import { RULER_HEIGHT } from './constants';

interface TimeRulerProps {
  width: number;
  pxPerSec: number;
  onScrub: (event: React.PointerEvent) => void;
}

/**
 * Time ruler. Tick spacing adapts to zoom so labels never collide — see
 * `pickTickInterval`, which walks a 1/2/5 ladder until ticks are ≥70px apart.
 */
export const TimeRuler = ({ width, pxPerSec, onScrub }: TimeRulerProps) => {
  const interval = pickTickInterval(pxPerSec);
  const totalSeconds = width / pxPerSec;
  const tickCount = Math.ceil(totalSeconds / interval) + 1;

  return (
    <div
      role="slider"
      tabIndex={-1}
      aria-label="Timeline position"
      aria-valuemin={0}
      aria-valuemax={Math.round(totalSeconds)}
      aria-valuenow={0}
      onPointerDown={onScrub}
      style={{ width, height: RULER_HEIGHT }}
      className="relative cursor-ew-resize border-b border-border bg-surface-secondary">
      {Array.from({ length: tickCount }, (_, index) => {
        const seconds = index * interval;
        const left = seconds * pxPerSec;
        return (
          <div key={index} className="absolute top-0 h-full" style={{ left }}>
            <div className="h-2 w-px bg-separator" />
            <span className="absolute left-1 top-1 whitespace-nowrap font-mono text-[10px] text-muted">{formatTimecode(seconds * US)}</span>
          </div>
        );
      })}
      {/* Half-interval minor ticks for finer visual reference. */}
      {Array.from({ length: tickCount }, (_, index) => (
        <div key={`minor-${index}`} className="absolute top-0 h-1.5 w-px bg-separator/50" style={{ left: (index + 0.5) * interval * pxPerSec }} />
      ))}
    </div>
  );
};
