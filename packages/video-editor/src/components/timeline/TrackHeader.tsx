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

/**
 * The controls for one track, in two rows that fit the shortest row height.
 *
 * The fader used to be hidden below 60px, which meant audio tracks — created
 * at 56px, and the ones that most need a level control — never showed one.
 * Laying the toggles and the fader out side by side instead of stacking them
 * makes everything fit at every height, so nothing has to be conditional.
 */
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
      className="group/header sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-1 overflow-hidden border-b border-r border-border bg-editor-chrome px-2 py-1">
      <div className="flex h-5 items-center gap-1">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', track.hidden ? 'text-muted/50' : 'text-muted')} />
        <input
          value={track.name}
          onChange={event => onUpdate({ name: event.target.value })}
          aria-label={`${track.name} name`}
          className="min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-border focus:border-accent focus:bg-field-background"
        />
        {/* Revealed on hover so the resting state stays quiet, but the width is
            always reserved — otherwise the name would jump as you move around. */}
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

        <input
          type="range"
          min={0}
          max={150}
          value={Math.round(track.volume * 100)}
          onChange={event => onUpdate({ volume: Number(event.target.value) / 100 })}
          aria-label={`${track.name} level`}
          title={`Level ${Math.round(track.volume * 100)}%`}
          className={cn(
            'ml-1 h-1.5 min-w-0 flex-1 cursor-pointer rounded-full bg-default accent-accent',
            track.muted && 'pointer-events-none opacity-40'
          )}
        />
      </div>

      <div
        role="separator"
        aria-label="Resize track height"
        onPointerDown={onResizePointerDown}
        className="absolute inset-x-0 bottom-0 flex h-1.5 cursor-row-resize items-end justify-center">
        <span className="h-0.5 w-6 rounded-full bg-transparent transition-colors group-hover/header:bg-separator" />
      </div>
    </div>
  );
};
