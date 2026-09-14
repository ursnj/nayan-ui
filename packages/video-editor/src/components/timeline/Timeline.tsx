import { useCallback, useEffect, useRef } from 'react';
import { NButton, NTooltip } from '@nayan-ui/react';
import { Copy, Film, Magnet, Music, Plus, Scissors, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { player, seekTo } from '../../engine/playerInstance';
import { clamp, cn } from '../../lib/utils';
import { readEditorState, timelineDurationUs, useEditor } from '../../store/editor';
import { US, clipEndUs } from '../../types';
import type { Track } from '../../types';
import { ClipView } from './ClipView';
import type { TrimEdge } from './ClipView';
import { TimeRuler } from './TimeRuler';
import { TrackHeader } from './TrackHeader';
import { HEADER_WIDTH, ROW_HEIGHT, RULER_HEIGHT, SNAP_RADIUS_PX, TAIL_PADDING_PX } from './constants';

type DragState = { kind: 'scrub' } | { kind: 'move'; clipId: string; grabOffsetUs: number } | { kind: 'trim'; clipId: string; edge: TrimEdge };

const ASSET_MIME = 'application/x-nayan-asset';

export const Timeline = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const tracks = useEditor(state => state.tracks);
  const clips = useEditor(state => state.clips);
  const pxPerSec = useEditor(state => state.pxPerSec);
  const snapEnabled = useEditor(state => state.snapEnabled);
  const selectedClipId = useEditor(state => state.selectedClipId);
  const durationUs = useEditor(state => timelineDurationUs(state.clips));

  const selectClip = useEditor(state => state.selectClip);
  const splitAtPlayhead = useEditor(state => state.splitAtPlayhead);
  const duplicateClip = useEditor(state => state.duplicateClip);
  const deleteClip = useEditor(state => state.deleteClip);
  const addTrack = useEditor(state => state.addTrack);
  const updateTrack = useEditor(state => state.updateTrack);
  const removeTrack = useEditor(state => state.removeTrack);
  const addClipFromAsset = useEditor(state => state.addClipFromAsset);
  const setZoom = useEditor(state => state.setZoom);
  const toggleSnap = useEditor(state => state.toggleSnap);

  // Always leave room after the last clip so it can be dragged further out.
  const contentWidth = Math.max(1200, (durationUs / US) * pxPerSec + TAIL_PADDING_PX);

  /** Pointer x → timeline time. Accounts for scroll and the sticky header column. */
  const timeAt = useCallback((clientX: number) => {
    const element = scrollRef.current;
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left + element.scrollLeft - HEADER_WIDTH;
    return Math.max(0, (x / readEditorState().pxPerSec) * US);
  }, []);

  /** Pointer y → track row. Rows are a fixed height, so this is pure arithmetic. */
  const trackAt = useCallback((clientY: number): Track | null => {
    const element = scrollRef.current;
    if (!element) return null;
    const state = readEditorState();
    const rect = element.getBoundingClientRect();
    const y = clientY - rect.top + element.scrollTop - RULER_HEIGHT;
    const index = clamp(Math.floor(y / ROW_HEIGHT), 0, state.tracks.length - 1);
    return state.tracks[index] ?? null;
  }, []);

  /** Snaps to zero, the playhead and every other clip edge within the radius. */
  const snapTime = useCallback((timeUs: number, excludeClipId?: string) => {
    const state = readEditorState();
    if (!state.snapEnabled) return timeUs;

    const threshold = (SNAP_RADIUS_PX / state.pxPerSec) * US;
    let best = timeUs;
    let bestDelta = threshold;
    const consider = (candidate: number) => {
      const delta = Math.abs(candidate - timeUs);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = candidate;
      }
    };

    consider(0);
    consider(state.playheadUs);
    for (const clip of state.clips) {
      if (clip.id === excludeClipId) continue;
      consider(clip.startUs);
      consider(clipEndUs(clip));
    }
    return best;
  }, []);

  const handleDragMove = useCallback(
    (event: PointerEvent | React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const state = readEditorState();

      if (drag.kind === 'scrub') {
        seekTo(timeAt(event.clientX));
        return;
      }

      const clip = state.clips.find(entry => entry.id === drag.clipId);
      if (!clip) return;

      if (drag.kind === 'trim') {
        state.setClipEdge(clip.id, drag.edge, snapTime(timeAt(event.clientX), clip.id));
        return;
      }

      const proposedStart = Math.max(0, timeAt(event.clientX) - drag.grabOffsetUs);
      // Snap whichever edge of the clip lands closest to a guide.
      const startSnap = snapTime(proposedStart, clip.id);
      const endSnap = snapTime(proposedStart + clip.durationUs, clip.id) - clip.durationUs;
      const startUs = Math.abs(startSnap - proposedStart) <= Math.abs(endSnap - proposedStart) ? startSnap : endSnap;

      // Only retarget the row when the hovered track can actually hold the clip.
      const wantedKind = clip.kind === 'audio' ? 'audio' : 'video';
      const hovered = trackAt(event.clientY);
      const target = hovered && hovered.kind === wantedKind && !hovered.locked ? hovered : state.tracks.find(entry => entry.id === clip.trackId);
      if (!target) return;

      state.moveClip(clip.id, Math.max(0, startUs), target.id);
    },
    [snapTime, timeAt, trackAt]
  );

  const beginDrag = useCallback(
    (drag: DragState, event: React.PointerEvent) => {
      event.preventDefault();
      dragRef.current = drag;
      // One history entry for the whole gesture rather than one per pointer move.
      if (drag.kind !== 'scrub') readEditorState().beginInteraction();

      const onMove = (moveEvent: PointerEvent) => handleDragMove(moveEvent);
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        dragRef.current = null;
        readEditorState().endInteraction();
        player.refresh();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      handleDragMove(event);
    },
    [handleDragMove]
  );

  const zoomToFit = useCallback(() => {
    const element = scrollRef.current;
    const state = readEditorState();
    const total = timelineDurationUs(state.clips);
    if (!element || total <= 0) return;
    state.setZoom(((element.clientWidth - HEADER_WIDTH - 32) / total) * US);
  }, []);

  const videoTrackCount = tracks.filter(track => track.kind === 'video').length;
  const audioTrackCount = tracks.filter(track => track.kind === 'audio').length;

  return (
    <section className="flex h-80 shrink-0 flex-col border-t border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5">
        <NTooltip message="Split at playhead (S)">
          <NButton isOutline onClick={splitAtPlayhead} className="h-7 w-8 px-0" aria-label="Split at playhead">
            <Scissors className="h-3.5 w-3.5" />
          </NButton>
        </NTooltip>
        <NTooltip message="Duplicate clip (⌘D)">
          <NButton
            isOutline
            onClick={() => selectedClipId && duplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className="h-7 w-8 px-0"
            aria-label="Duplicate clip">
            <Copy className="h-3.5 w-3.5" />
          </NButton>
        </NTooltip>
        <NTooltip message="Delete clip (⌫)">
          <NButton
            isOutline
            onClick={() => selectedClipId && deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            className="h-7 w-8 px-0"
            aria-label="Delete clip">
            <Trash2 className="h-3.5 w-3.5" />
          </NButton>
        </NTooltip>

        <div className="mx-1 h-4 w-px bg-separator" />

        <NTooltip message="Add video track">
          <NButton isOutline onClick={() => addTrack('video')} className="h-7 px-2 text-[11px]" aria-label="Add video track">
            <Plus className="mr-0.5 h-3 w-3" />
            <Film className="h-3.5 w-3.5" />
          </NButton>
        </NTooltip>
        <NTooltip message="Add audio track">
          <NButton isOutline onClick={() => addTrack('audio')} className="h-7 px-2 text-[11px]" aria-label="Add audio track">
            <Plus className="mr-0.5 h-3 w-3" />
            <Music className="h-3.5 w-3.5" />
          </NButton>
        </NTooltip>

        <NTooltip message={snapEnabled ? 'Snapping on' : 'Snapping off'}>
          <NButton
            isOutline
            onClick={toggleSnap}
            className={cn('h-7 w-8 px-0', snapEnabled && 'border-accent text-accent')}
            aria-label="Toggle snapping"
            aria-pressed={snapEnabled}>
            <Magnet className="h-3.5 w-3.5" />
          </NButton>
        </NTooltip>

        <div className="ml-auto flex items-center gap-1.5">
          <NButton isOutline onClick={zoomToFit} className="h-7 px-2 text-[11px]">
            Fit
          </NButton>
          <NTooltip message="Zoom out">
            <NButton isOutline onClick={() => setZoom(pxPerSec / 1.4)} className="h-7 w-8 px-0" aria-label="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </NButton>
          </NTooltip>
          <NTooltip message="Zoom in">
            <NButton isOutline onClick={() => setZoom(pxPerSec * 1.4)} className="h-7 w-8 px-0" aria-label="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </NButton>
          </NTooltip>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto"
        onPointerDown={event => {
          // Clicking empty timeline space clears the selection.
          if (event.target === event.currentTarget) selectClip(null);
        }}>
        <div className="relative" style={{ width: HEADER_WIDTH + contentWidth }}>
          <div className="sticky top-0 z-30 flex">
            <div
              style={{ width: HEADER_WIDTH, height: RULER_HEIGHT }}
              className="sticky left-0 z-40 shrink-0 border-b border-r border-border bg-surface"
            />
            <TimeRuler width={contentWidth} pxPerSec={pxPerSec} onScrub={event => beginDrag({ kind: 'scrub' }, event)} />
          </div>

          {tracks.map(track => {
            const trackClips = clips.filter(clip => clip.trackId === track.id);
            const sameKindCount = track.kind === 'video' ? videoTrackCount : audioTrackCount;

            return (
              <div key={track.id} className="flex">
                <TrackHeader
                  track={track}
                  canRemove={sameKindCount > 1}
                  onUpdate={patch => updateTrack(track.id, patch)}
                  onRemove={() => removeTrack(track.id)}
                />
                <div
                  style={{ width: contentWidth, height: ROW_HEIGHT }}
                  className={cn('relative border-b border-border', track.locked && 'opacity-60')}
                  onDragOver={event => {
                    if (!event.dataTransfer.types.includes(ASSET_MIME)) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={event => {
                    const assetId = event.dataTransfer.getData(ASSET_MIME);
                    if (!assetId) return;
                    event.preventDefault();
                    addClipFromAsset(assetId, timeAt(event.clientX), track.id);
                  }}>
                  {trackClips.map(clip => (
                    <ClipView
                      key={clip.id}
                      clip={clip}
                      pxPerSec={pxPerSec}
                      selected={clip.id === selectedClipId}
                      locked={track.locked}
                      onSelect={() => selectClip(clip.id)}
                      onMoveStart={event => beginDrag({ kind: 'move', clipId: clip.id, grabOffsetUs: timeAt(event.clientX) - clip.startUs }, event)}
                      onTrimStart={(event, edge) => beginDrag({ kind: 'trim', clipId: clip.id, edge }, event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <Playhead scrollRef={scrollRef} height={RULER_HEIGHT + tracks.length * ROW_HEIGHT} />
        </div>
      </div>
    </section>
  );
};

/**
 * Subscribes to `playheadUs` on its own so the per-frame time update during
 * playback re-renders this marker instead of the entire timeline.
 */
const Playhead = ({ scrollRef, height }: { scrollRef: React.RefObject<HTMLDivElement | null>; height: number }) => {
  const playheadUs = useEditor(state => state.playheadUs);
  const pxPerSec = useEditor(state => state.pxPerSec);
  const isPlaying = useEditor(state => state.isPlaying);
  const left = HEADER_WIDTH + (playheadUs / US) * pxPerSec;

  useEffect(() => {
    if (!isPlaying) return;
    const element = scrollRef.current;
    if (!element) return;
    // Keep the playhead in view during playback, nudging rather than centring.
    const visibleLeft = element.scrollLeft + HEADER_WIDTH;
    const visibleRight = element.scrollLeft + element.clientWidth;
    if (left < visibleLeft || left > visibleRight - 80) {
      element.scrollLeft = Math.max(0, left - HEADER_WIDTH - element.clientWidth / 3);
    }
  }, [left, isPlaying, scrollRef]);

  return (
    <div className="pointer-events-none absolute top-0" style={{ left, height, zIndex: 25 }}>
      <div className="h-full w-px bg-danger" />
      <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-sm bg-danger" />
    </div>
  );
};
