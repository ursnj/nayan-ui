import { useCallback } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Film, Lock, LockOpen, Music, Trash2, Volume2, VolumeX } from 'lucide-react';
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
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [onUpdate, track.height]
  );

  return (
    <div
      style={{ width: HEADER_WIDTH, height: track.height }}
      className="sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-1 border-b border-r border-border bg-editor-chrome px-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
        <input
          value={track.name}
          onChange={event => onUpdate({ name: event.target.value })}
          aria-label={`${track.name} name`}
          className="min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-border focus:border-accent"
        />
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => reorderTrack(track.id, -1)}
            aria-label="Move track up"
            className="text-muted transition-colors hover:text-foreground">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => reorderTrack(track.id, 1)}
            aria-label="Move track down"
            className="text-muted transition-colors hover:text-foreground">
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <IconButton
          label={track.muted ? 'Unmute track' : 'Mute track'}
          onClick={() => onUpdate({ muted: !track.muted })}
          active={track.muted}
          className="h-6 w-6">
          {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </IconButton>

        {track.kind === 'video' && (
          <IconButton
            label={track.hidden ? 'Show track' : 'Hide track'}
            onClick={() => onUpdate({ hidden: !track.hidden })}
            active={track.hidden}
            className="h-6 w-6">
            {track.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </IconButton>
        )}

        <IconButton
          label={track.locked ? 'Unlock track' : 'Lock track'}
          onClick={() => onUpdate({ locked: !track.locked })}
          active={track.locked}
          className="h-6 w-6">
          {track.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        </IconButton>

        {canRemove && (
          <IconButton label="Delete track" onClick={onRemove} danger className="ml-auto h-6 w-6">
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>

      {/* Level fader, visible once the row is tall enough to hold it. */}
      {track.height >= 60 && (
        <input
          type="range"
          min={0}
          max={150}
          value={Math.round(track.volume * 100)}
          onChange={event => onUpdate({ volume: Number(event.target.value) / 100 })}
          aria-label={`${track.name} level`}
          className={cn('h-1 w-full cursor-pointer appearance-none rounded bg-default accent-accent', track.muted && 'opacity-40')}
        />
      )}

      <div
        role="separator"
        aria-label="Resize track height"
        onPointerDown={onResizePointerDown}
        className="absolute inset-x-0 bottom-0 h-1.5 cursor-row-resize hover:bg-accent/40"
      />
    </div>
  );
};
