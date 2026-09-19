import { memo } from 'react';
import { cn } from '@nayan-ui/react';
import { pickTickInterval } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import { US } from '../../types';
import { HEADER_WIDTH, RULER_HEIGHT, VIRTUALISE_OVERSCAN_PX } from './constants';

interface TimeRulerProps {
  width: number;
  pxPerSec: number;
  viewportLeft: number;
  viewportWidth: number;
  onScrub: (event: React.PointerEvent) => void;
}

const pad = (value: number) => String(value).padStart(2, '0');

const rulerLabel = (seconds: number, interval: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  if (interval >= 1) return `${pad(minutes)}:${pad(Math.round(rest))}`;
  return `${pad(minutes)}:${rest.toFixed(2).padStart(5, '0')}`;
};

export const TimeRuler = memo(({ width, pxPerSec, viewportLeft, viewportWidth, onScrub }: TimeRulerProps) => {
  const inPointUs = useEditor(state => state.inPointUs);
  const outPointUs = useEditor(state => state.outPointUs);

  const interval = pickTickInterval(pxPerSec);
  const tickSpacing = interval * pxPerSec;
  const tickCount = Math.floor(width / tickSpacing) + 1;
  /** Rough width of a label; one nearer the edge than this would spill. */
  const labelWidth = interval >= 1 ? 36 : 48;

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

        {Array.from({ length: visibleTicks }, (_, offset) => {
          const index = firstTick + offset;
          const seconds = index * interval;
          const left = seconds * pxPerSec;
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
