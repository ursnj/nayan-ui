import { useEffect, useRef } from 'react';
import { Music, Type, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { US, isTextClip } from '../../types';
import type { Clip, MediaClip } from '../../types';
import { TRIM_HANDLE_WIDTH } from './constants';
import { useFilmstrip, useWaveform } from './useClipPreviews';

export type TrimEdge = 'start' | 'end';

interface ClipViewProps {
  clip: Clip;
  pxPerSec: number;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
  onMoveStart: (event: React.PointerEvent) => void;
  onTrimStart: (event: React.PointerEvent, edge: TrimEdge) => void;
}

export const ClipView = ({ clip, pxPerSec, selected, locked, onSelect, onMoveStart, onTrimStart }: ClipViewProps) => {
  const left = (clip.startUs / US) * pxPerSec;
  const width = Math.max(2, (clip.durationUs / US) * pxPerSec);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${clip.name} clip`}
      aria-pressed={selected}
      onPointerDown={event => {
        if (event.button !== 0) return;
        onSelect();
        if (!locked) onMoveStart(event);
      }}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      style={{ left, width }}
      className={cn(
        'group absolute top-1 bottom-1 select-none overflow-hidden rounded-md border text-left',
        locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        selected ? 'border-accent ring-2 ring-accent/60' : 'border-border hover:border-accent/60',
        clip.kind === 'audio' ? 'bg-success/25' : clip.kind === 'text' ? 'bg-warning/25' : 'bg-surface-tertiary'
      )}>
      <ClipBody clip={clip} width={width} />

      <FadeOverlay clip={clip} width={width} pxPerSec={pxPerSec} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1 truncate bg-gradient-to-b from-black/55 to-transparent px-1.5 py-0.5">
        {clip.kind === 'text' && <Type className="h-3 w-3 shrink-0 text-white" />}
        {clip.kind === 'audio' && <Music className="h-3 w-3 shrink-0 text-white" />}
        <span className="truncate text-[10px] font-medium text-white">{clip.name}</span>
        {!isTextClip(clip) &&
          clip.kind !== 'image' &&
          (clip.muted || clip.volume === 0 ? <VolumeX className="h-3 w-3 shrink-0 text-white/70" /> : null)}
        {!isTextClip(clip) && clip.speed !== 1 && <span className="shrink-0 text-[9px] text-white/80">{clip.speed}×</span>}
      </div>

      {!locked && (
        <>
          <TrimHandle side="start" onPointerDown={event => onTrimStart(event, 'start')} />
          <TrimHandle side="end" onPointerDown={event => onTrimStart(event, 'end')} />
        </>
      )}
    </div>
  );
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
    className={cn(
      'absolute inset-y-0 z-10 cursor-ew-resize bg-accent/0 transition-colors hover:bg-accent/70',
      side === 'start' ? 'left-0' : 'right-0'
    )}
  />
);

const ClipBody = ({ clip, width }: { clip: Clip; width: number }) => {
  if (isTextClip(clip)) {
    return (
      <div className="flex h-full items-center px-2 pt-3">
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
    context.fillStyle = 'rgba(34, 197, 94, 0.85)';

    for (let x = 0; x < cssWidth; x += barWidth) {
      const ratio = x / cssWidth;
      const sourceUs = sourceStart + (sourceEnd - sourceStart) * ratio;
      const index = Math.min(peaks.length - 1, Math.max(0, Math.floor((sourceUs / totalUs) * peaks.length)));
      const amplitude = peaks[index] * (cssHeight * 0.42);
      context.fillRect(x, middle - amplitude, barWidth - 0.5, amplitude * 2 || 1);
    }
  }, [peaks, width, clip.inUs, clip.durationUs, clip.speed]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};

/** Visualises the fade ramps as translucent wedges, like a NLE's rubber band. */
const FadeOverlay = ({ clip, width, pxPerSec }: { clip: Clip; width: number; pxPerSec: number }) => {
  const fadeInPx = Math.min(width, (clip.fadeInUs / US) * pxPerSec);
  const fadeOutPx = Math.min(width - fadeInPx, (clip.fadeOutUs / US) * pxPerSec);
  if (fadeInPx <= 0 && fadeOutPx <= 0) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {fadeInPx > 0 && <polygon points={`0,0 ${fadeInPx},0 0,100%`} fill="rgba(0,0,0,0.55)" />}
      {fadeOutPx > 0 && <polygon points={`${width},0 ${width - fadeOutPx},0 ${width},100%`} fill="rgba(0,0,0,0.55)" />}
    </svg>
  );
};
