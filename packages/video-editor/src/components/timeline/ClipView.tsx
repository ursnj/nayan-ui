import { memo, useEffect, useRef } from 'react';
import { Diamond, Link2, Lock, Music, Type, VolumeX } from 'lucide-react';
import { allKeyTimes } from '../../lib/keyframes';
import { cn } from '../../lib/utils';
import { TRANSITION_LABELS, US, isMediaClip, isTextClip } from '../../types';
import type { Clip, MediaClip } from '../../types';
import { TRIM_HANDLE_WIDTH } from './constants';
import { useFilmstrip, useWaveform } from './useClipPreviews';

export type TrimEdge = 'start' | 'end';

interface ClipViewProps {
  clip: Clip;
  pxPerSec: number;
  rowHeight: number;
  selected: boolean;
  trackLocked: boolean;
  onSelect: (clip: Clip, additive: boolean) => void;
  onMoveStart: (clip: Clip, event: React.PointerEvent) => void;
  onTrimStart: (clip: Clip, event: React.PointerEvent, edge: TrimEdge) => void;
  onContextMenu: (clip: Clip, event: React.MouseEvent) => void;
}

/**
 * A single clip on the timeline.
 *
 * Memoised on its own props: a timeline can hold hundreds of these, and a
 * drag on one clip must not re-render the rest. That only works because every
 * callback below is a stable reference from the parent and receives the clip
 * as an argument — passing `() => onSelect(clip)` from the parent would mint a
 * new function per clip per render and defeat the memo entirely.
 */
export const ClipView = memo(
  ({ clip, pxPerSec, rowHeight, selected, trackLocked, onSelect, onMoveStart, onTrimStart, onContextMenu }: ClipViewProps) => {
    const left = (clip.startUs / US) * pxPerSec;
    const width = Math.max(3, (clip.durationUs / US) * pxPerSec);
    const locked = trackLocked || clip.locked;
    const keyTimes = allKeyTimes(clip.animations);

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${clip.name} clip`}
        aria-pressed={selected}
        onPointerDown={event => {
          if (event.button !== 0) return;
          onSelect(clip, event.shiftKey || event.metaKey || event.ctrlKey);
          if (!locked) onMoveStart(clip, event);
        }}
        onContextMenu={event => onContextMenu(clip, event)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(clip, event.shiftKey);
          }
        }}
        data-clip-id={clip.id}
        style={{ left, width, borderColor: selected ? undefined : `${clip.color}66` }}
        className={cn(
          'group gpu-layer absolute top-1 select-none overflow-hidden rounded-md border text-left transition-shadow',
          locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
          selected ? 'z-10 border-accent ring-2 ring-accent/70 elevate' : 'hover:elevate'
        )}>
        {/* Row height is user-adjustable, so the body is sized rather than inset. */}
        <div style={{ height: rowHeight - 8 }} className="relative w-full">
          <ClipBody clip={clip} width={width} />

          {/* Colour spine, so a glance identifies the clip even when zoomed out. */}
          <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: clip.color }} />

          <FadeOverlay clip={clip} width={width} pxPerSec={pxPerSec} />

          {clip.transitionIn && width > 30 && (
            <div
              title={TRANSITION_LABELS[clip.transitionIn.kind]}
              style={{ width: Math.min(width, (clip.transitionIn.durationUs / US) * pxPerSec) }}
              className="pointer-events-none absolute inset-y-0 left-0 border-r border-white/40 bg-gradient-to-r from-white/35 to-transparent"
            />
          )}

          {/* Below ~44px the label is unreadable and only adds noise, so the
              colour spine and filmstrip carry the identification instead. */}
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1 truncate bg-gradient-to-b from-black/60 to-transparent px-1.5 py-0.5',
              width < 44 && 'hidden'
            )}>
            <ClipIcon clip={clip} />
            <span className="truncate text-[10px] font-medium text-white drop-shadow">{clip.name}</span>
            {clip.groupId && <Link2 className="h-3 w-3 shrink-0 text-white/70" />}
            {clip.locked && <Lock className="h-3 w-3 shrink-0 text-white/70" />}
            {isMediaClip(clip) && clip.kind !== 'image' && (clip.muted || clip.volume === 0) && (
              <VolumeX className="h-3 w-3 shrink-0 text-white/70" />
            )}
            {isMediaClip(clip) && clip.speed !== 1 && <span className="shrink-0 text-[9px] text-white/80">{clip.speed}×</span>}
            {isMediaClip(clip) && clip.reversed && <span className="shrink-0 text-[9px] text-white/80">REV</span>}
          </div>

          {keyTimes.length > 0 && width > 24 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0.5 h-2">
              {keyTimes.map(atUs => (
                <Diamond
                  key={atUs}
                  className="absolute h-2 w-2 -translate-x-1/2 fill-accent text-accent drop-shadow"
                  style={{ left: (atUs / US) * pxPerSec }}
                />
              ))}
            </div>
          )}
        </div>

        {!locked && (
          <>
            <TrimHandle side="start" onPointerDown={event => onTrimStart(clip, event, 'start')} />
            <TrimHandle side="end" onPointerDown={event => onTrimStart(clip, event, 'end')} />
          </>
        )}
      </div>
    );
  }
);

ClipView.displayName = 'ClipView';

const ClipIcon = ({ clip }: { clip: Clip }) => {
  const className = 'h-3 w-3 shrink-0 text-white';
  if (isTextClip(clip)) return <Type className={className} />;
  if (clip.kind === 'audio') return <Music className={className} />;
  return null;
};

const TrimHandle = ({ side, onPointerDown }: { side: TrimEdge; onPointerDown: (event: React.PointerEvent) => void }) => (
  <div
    role="separator"
    aria-label={`Trim clip ${side}`}
    onPointerDown={event => {
      if (event.button !== 0) return;
      // Stop the clip body from starting a move drag.
      event.stopPropagation();
      onPointerDown(event);
    }}
    style={{ width: TRIM_HANDLE_WIDTH }}
    className={cn('absolute inset-y-0 z-20 cursor-ew-resize transition-colors hover:bg-accent/80', side === 'start' ? 'left-0' : 'right-0')}>
    <span
      className={cn(
        'absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-white/0 group-hover:bg-white/70',
        side === 'start' ? 'left-1' : 'right-1'
      )}
    />
  </div>
);

const ClipBody = ({ clip, width }: { clip: Clip; width: number }) => {
  if (isTextClip(clip)) {
    return (
      <div className="flex h-full items-center px-2 pt-3" style={{ background: `${clip.color}33` }}>
        <span className="truncate text-[11px] text-foreground/80">{clip.text.split('\n')[0]}</span>
      </div>
    );
  }
  if (clip.kind === 'audio') return <Waveform clip={clip} width={width} />;
  return <Filmstrip clip={clip} width={width} />;
};

const Filmstrip = ({ clip, width }: { clip: MediaClip; width: number }) => {
  const frames = useFilmstrip(clip, width);
  if (frames.length === 0) return <div className="h-full w-full bg-surface-tertiary" />;

  return (
    <div className="flex h-full w-full">
      {frames.map((frame, index) => (
        <div
          key={index}
          className="h-full min-w-0 flex-1 bg-surface-tertiary bg-cover bg-center"
          style={frame ? { backgroundImage: `url(${frame})` } : undefined}
        />
      ))}
    </div>
  );
};

/**
 * Peaks are drawn to a canvas rather than SVG: a few thousand bars as DOM nodes
 * would dominate render time on a busy timeline.
 */
const Waveform = ({ clip, width }: { clip: MediaClip; width: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaks = useWaveform(clip.assetId, true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssWidth = Math.max(1, Math.round(width));
    const cssHeight = canvas.clientHeight || 48;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);
    if (!peaks || peaks.length === 0) return;

    // Map the clip's source range onto the asset-wide peak array.
    const sourceStart = clip.inUs;
    const sourceEnd = clip.inUs + clip.durationUs * clip.speed;
    const totalUs = Math.max(1, sourceEnd);

    const middle = cssHeight / 2;
    const barWidth = 2;
    context.fillStyle = `${clip.color}dd`;

    for (let x = 0; x < cssWidth; x += barWidth) {
      const ratio = x / cssWidth;
      const sourceUs = sourceStart + (sourceEnd - sourceStart) * ratio;
      const index = Math.min(peaks.length - 1, Math.max(0, Math.floor((sourceUs / totalUs) * peaks.length)));
      const amplitude = peaks[index] * (cssHeight * 0.42);
      context.fillRect(x, middle - amplitude, barWidth - 0.5, amplitude * 2 || 1);
    }
  }, [peaks, width, clip.inUs, clip.durationUs, clip.speed, clip.color]);

  return <canvas ref={canvasRef} className="h-full w-full" style={{ background: `${clip.color}22` }} />;
};

/** Visualises the fade ramps as translucent wedges, like a NLE's rubber band. */
const FadeOverlay = ({ clip, width, pxPerSec }: { clip: Clip; width: number; pxPerSec: number }) => {
  const fadeInPx = Math.min(width, (clip.fadeInUs / US) * pxPerSec);
  const fadeOutPx = Math.min(width - fadeInPx, (clip.fadeOutUs / US) * pxPerSec);
  if (fadeInPx <= 0 && fadeOutPx <= 0) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {fadeInPx > 0 && <polygon points={`0,0 ${fadeInPx},0 0,100%`} fill="rgba(0,0,0,0.6)" />}
      {fadeOutPx > 0 && <polygon points={`${width},0 ${width - fadeOutPx},0 ${width},100%`} fill="rgba(0,0,0,0.6)" />}
    </svg>
  );
};
