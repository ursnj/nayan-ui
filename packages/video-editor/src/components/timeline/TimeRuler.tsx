import { formatTimecode, pickTickInterval } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import { US } from '../../types';
import { MARKER_LANE_HEIGHT, RULER_HEIGHT } from './constants';

interface TimeRulerProps {
  width: number;
  pxPerSec: number;
  onScrub: (event: React.PointerEvent) => void;
}

/**
 * Time ruler, marker lane and the in/out range band.
 *
 * Tick spacing adapts to zoom via `pickTickInterval`, which walks a 1/2/5
 * ladder until labels are at least 70px apart — so the ruler stays readable
 * from a whole-project overview down to single frames.
 */
export const TimeRuler = ({ width, pxPerSec, onScrub }: TimeRulerProps) => {
  const markers = useEditor(state => state.markers);
  const inPointUs = useEditor(state => state.inPointUs);
  const outPointUs = useEditor(state => state.outPointUs);
  const removeMarker = useEditor(state => state.removeMarker);

  const interval = pickTickInterval(pxPerSec);
  const totalSeconds = width / pxPerSec;
  const tickCount = Math.ceil(totalSeconds / interval) + 1;

  const rangeLeft = ((inPointUs ?? 0) / US) * pxPerSec;
  const rangeRight = outPointUs !== null ? (outPointUs / US) * pxPerSec : width;
  const hasRange = inPointUs !== null || outPointUs !== null;

  return (
    <div style={{ width }} className="relative">
      <div
        role="presentation"
        onPointerDown={onScrub}
        style={{ height: RULER_HEIGHT }}
        className="relative cursor-ew-resize border-b border-border bg-editor-ruler">
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
              <span className="absolute left-1 top-1.5 whitespace-nowrap font-mono text-[10px] tabular-nums text-muted">
                {formatTimecode(seconds * US)}
              </span>
            </div>
          );
        })}

        {/* Half-interval minor ticks for finer visual reference. */}
        {Array.from({ length: tickCount }, (_, index) => (
          <div
            key={`minor-${index}`}
            className="pointer-events-none absolute top-0 h-1.5 w-px bg-separator/50"
            style={{ left: (index + 0.5) * interval * pxPerSec }}
          />
        ))}
      </div>

      <div style={{ height: MARKER_LANE_HEIGHT }} className="relative border-b border-border bg-editor-chrome">
        {markers.map(marker => (
          <button
            key={marker.id}
            type="button"
            title={marker.label ? `${marker.label} — double-click to remove` : 'Marker — double-click to remove'}
            aria-label={marker.label || 'Marker'}
            onDoubleClick={() => removeMarker(marker.id)}
            style={{ left: (marker.atUs / US) * pxPerSec, borderTopColor: marker.color }}
            className="absolute top-0 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[9px] border-x-transparent transition-transform hover:scale-125"
          />
        ))}
        {markers.map(marker =>
          marker.label ? (
            <span
              key={`${marker.id}-label`}
              style={{ left: (marker.atUs / US) * pxPerSec + 7 }}
              className="pointer-events-none absolute top-0 whitespace-nowrap text-[9px] leading-[14px] text-muted">
              {marker.label}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
};
