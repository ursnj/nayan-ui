import { useCallback } from 'react';
import { NInput, NSlider } from '@nayan-ui/react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Film, Lock, LockOpen, Music, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useHeldInteraction } from '../../lib/shortcuts';
import { clamp, cn } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import type { Track } from '../../types';
import { IconButton } from '../controls';
import { HEADER_WIDTH, MAX_ROW_HEIGHT, MIN_ROW_HEIGHT } from './constants';

interface TrackHeaderProps {
  track: Track;
  canRemove: boolean;
  onUpdate: (patch: Partial<Track>) => void;
  onRemove: () => void;
}

export const TrackHeader = ({ track, canRemove, onUpdate, onRemove }: TrackHeaderProps) => {
  const reorderTrack = useEditor(state => state.reorderTrack);
  const Icon = track.kind === 'video' ? Film : Music;
  const held = useHeldInteraction();

  /** Drag the bottom edge of the header to change the row height. */
  const onResizePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const startY = event.clientY;
      const startHeight = track.height;

      const move = (moveEvent: PointerEvent) => {
        onUpdate({ height: clamp(startHeight + (moveEvent.clientY - startY), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT) });
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [onUpdate, track.height]
  );

  return (
    <div
      style={{ width: HEADER_WIDTH, height: track.height }}
      className="group/header sticky left-0 z-40 flex shrink-0 flex-col justify-center gap-1 overflow-hidden border-b border-r border-border bg-editor-panel px-2 py-1">
      <div className="flex h-5 items-center gap-1">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', track.hidden ? 'text-muted/50' : 'text-muted')} />
        <NInput
          value={track.name}
          onChange={event => onUpdate({ name: event.target.value })}
          wrapperClassName="mb-0 min-w-0 flex-1"
          inputClassName="h-5 px-1 py-0 text-[11px] font-medium"
          aria-label={`${track.name} name`}
        />
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/header:opacity-100 focus-within:opacity-100">
          <IconButton label="Move track up" onClick={() => reorderTrack(track.id, -1)} className="h-5 w-5">
            <ChevronUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Move track down" onClick={() => reorderTrack(track.id, 1)} className="h-5 w-5">
            <ChevronDown className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            label={canRemove ? 'Delete track' : 'The last track of a kind cannot be deleted'}
            onClick={onRemove}
            disabled={!canRemove}
            danger
            className="h-5 w-5">
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="flex h-5 items-center gap-0.5">
        <IconButton
          label={track.muted ? 'Unmute track' : 'Mute track'}
          onClick={() => onUpdate({ muted: !track.muted })}
          active={track.muted}
          className="h-5 w-5">
          {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </IconButton>

        {track.kind === 'video' && (
          <IconButton
            label={track.hidden ? 'Show track' : 'Hide track'}
            onClick={() => onUpdate({ hidden: !track.hidden })}
            active={track.hidden}
            className="h-5 w-5">
            {track.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </IconButton>
        )}

        <IconButton
          label={track.locked ? 'Unlock track' : 'Lock track'}
          onClick={() => onUpdate({ locked: !track.locked })}
          active={track.locked}
          className="h-5 w-5">
          {track.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        </IconButton>

        <NSlider
          value={Math.round(track.volume * 100)}
          min={0}
          max={150}
          disabled={track.muted}
          onChange={value => onUpdate({ volume: value / 100 })}
          className={cn('mb-0 ml-1 min-w-0 flex-1', track.muted && 'opacity-40')}
          aria-label={`${track.name} level`}
        />
      </div>

      <div
        role="separator"
        aria-label="Resize track height"
        aria-orientation="horizontal"
        aria-valuenow={track.height}
        aria-valuemin={MIN_ROW_HEIGHT}
        aria-valuemax={MAX_ROW_HEIGHT}
        tabIndex={0}
        onPointerDown={onResizePointerDown}
        onKeyDown={event => {
          const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
          if (direction === 0 || event.metaKey || event.ctrlKey || event.altKey) return;
          // Claims the key from the global handler, which would jump the playhead.
          event.preventDefault();
          held.begin();
          const step = event.shiftKey ? 16 : 4;
          onUpdate({ height: clamp(track.height + direction * step, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT) });
        }}
        onKeyUp={held.end}
        onBlur={held.end}
        className="absolute inset-x-0 bottom-0 flex h-1.5 cursor-row-resize items-end justify-center outline-none focus-visible:bg-accent/40">
        <span className="h-0.5 w-6 rounded-full bg-transparent transition-colors group-hover/header:bg-separator" />
      </div>
    </div>
  );
};
