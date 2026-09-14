import { NTooltip } from '@nayan-ui/react';
import { Eye, EyeOff, Film, Lock, LockOpen, Music, Trash2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Track } from '../../types';
import { HEADER_WIDTH, ROW_HEIGHT } from './constants';

interface TrackHeaderProps {
  track: Track;
  canRemove: boolean;
  onUpdate: (patch: Partial<Track>) => void;
  onRemove: () => void;
}

export const TrackHeader = ({ track, canRemove, onUpdate, onRemove }: TrackHeaderProps) => {
  const Icon = track.kind === 'video' ? Film : Music;

  return (
    <div
      style={{ width: HEADER_WIDTH, height: ROW_HEIGHT }}
      className="sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-1 border-b border-r border-border bg-surface px-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
        <span className="truncate text-xs font-medium text-foreground">{track.name}</span>
      </div>

      <div className="flex items-center gap-0.5">
        <HeaderToggle label={track.muted ? 'Unmute track' : 'Mute track'} active={track.muted} onClick={() => onUpdate({ muted: !track.muted })}>
          {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </HeaderToggle>

        {track.kind === 'video' && (
          <HeaderToggle label={track.hidden ? 'Show track' : 'Hide track'} active={track.hidden} onClick={() => onUpdate({ hidden: !track.hidden })}>
            {track.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </HeaderToggle>
        )}

        <HeaderToggle label={track.locked ? 'Unlock track' : 'Lock track'} active={track.locked} onClick={() => onUpdate({ locked: !track.locked })}>
          {track.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        </HeaderToggle>

        {canRemove && (
          <NTooltip message="Delete track">
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Delete ${track.name}`}
              className="ml-auto rounded p-1 text-muted hover:bg-danger hover:text-danger-foreground">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </NTooltip>
        )}
      </div>
    </div>
  );
};

const HeaderToggle = ({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <NTooltip message={label}>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn('rounded p-1 hover:bg-default', active ? 'text-warning' : 'text-muted hover:text-foreground')}>
      {children}
    </button>
  </NTooltip>
);
