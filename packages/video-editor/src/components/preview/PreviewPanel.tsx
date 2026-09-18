import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NButton, NSlider, NTooltip } from '@nayan-ui/react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Maximize,
  Minimize,
  MousePointer2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX
} from 'lucide-react';
import { player, seekTo, stepFrames, togglePlayback } from '../../engine/playerInstance';
import { clamp, download, formatTimecode } from '../../lib/utils';
import { primarySelectedClip, timelineDurationUs, useEditor } from '../../store/editor';
import { US } from '../../types';
import { IconButton } from '../controls';
import { TransformOverlay } from './TransformOverlay';

export const PreviewPanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const project = useEditor(state => state.project);
  const isPlaying = useEditor(state => state.isPlaying);
  const durationUs = useEditor(state => timelineDurationUs(state.clips));
  const clips = useEditor(state => state.clips);
  const tracks = useEditor(state => state.tracks);
  const selected = useEditor(primarySelectedClip);

  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [loop, setLoop] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    player.attach(canvasRef.current);
    return () => player.attach(null);
  }, []);

  useEffect(() => {
    player.audio.setVolume(muted ? 0 : volume / 100);
  }, [muted, volume]);

  useEffect(() => {
    player.refresh();
  }, [clips, tracks, project]);

  // The player owns the end-of-playback moment, so it owns looping too.
  useEffect(() => {
    player.setLoop(loop);
  }, [loop]);

  // The transform overlay works in CSS pixels, so it needs the rendered size.
  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setDisplaySize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void stageRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (blob) download(blob, `${project.name.replace(/[^\w\-. ]+/g, '_') || 'frame'}.png`);
    }, 'image/png');
  }, [project.name]);

  const overlayVisible = showOverlay && selected !== null && selected.kind !== 'audio' && displaySize.width > 0;

  return (
    <section className="island @container flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-border bg-editor-panel px-2 py-1">
        <IconButton label="Transform handles" onClick={() => setShowOverlay(value => !value)} active={showOverlay}>
          <MousePointer2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Safe zones" onClick={() => setShowSafeZones(value => !value)} active={showSafeZones}>
          <Square className="h-4 w-4" />
        </IconButton>
        <IconButton label="Grid" onClick={() => setShowGrid(value => !value)} active={showGrid}>
          <Grid3x3 className="h-4 w-4" />
        </IconButton>

        <span className="mx-1 h-4 w-px bg-separator" />

        <IconButton label="Save current frame as PNG" onClick={snapshot}>
          <Camera className="h-4 w-4" />
        </IconButton>

        <span className="ml-auto hidden whitespace-nowrap font-mono text-[10px] tabular-nums text-muted @[420px]:inline">
          {project.width} × {project.height} · {project.fps}fps
        </span>
      </div>

      <div ref={stageRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-editor-canvas">
        <div
          ref={frameRef}
          className="checkerboard relative max-h-full max-w-full overflow-hidden"
          style={{ aspectRatio: `${project.width} / ${project.height}` }}>
          <canvas ref={canvasRef} width={project.width} height={project.height} data-clarity-mask="true" className="block h-full w-full" />

          {showSafeZones && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-[5%] border border-white/40" />
              <div className="absolute inset-[10%] border border-dashed border-white/30" />
            </div>
          )}

          {showGrid && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
            </div>
          )}

          {overlayVisible && (
            <TransformOverlay clip={selected} project={project} displayWidth={displaySize.width} displayHeight={displaySize.height} />
          )}

          {durationUs === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
              <p className="px-4 text-center text-sm text-white/60">Add media to the timeline to start editing</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border bg-editor-panel px-3 py-1.5">
        <span className="hidden @[470px]:contents">
          <IconButton label="Jump to start (Home)" onClick={() => seekTo(0)}>
            <SkipBack className="h-4 w-4" />
          </IconButton>
        </span>
        <IconButton label="Previous frame (←)" onClick={() => stepFrames(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>

        <NTooltip message={isPlaying ? 'Pause' : 'Play'}>
          <NButton
            onClick={() => void togglePlayback()}
            disabled={durationUs === 0}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="mx-1 h-8 w-8 rounded-full px-0">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </NButton>
        </NTooltip>

        <IconButton label="Next frame (→)" onClick={() => stepFrames(1)}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <span className="hidden @[470px]:contents">
          <IconButton label="Jump to end (End)" onClick={() => seekTo(durationUs)}>
            <SkipForward className="h-4 w-4" />
          </IconButton>
        </span>
        <span className="hidden @[400px]:contents">
          <IconButton label="Loop playback" onClick={() => setLoop(value => !value)} active={loop}>
            <Repeat className="h-4 w-4" />
          </IconButton>
        </span>

        <TimeReadout durationUs={durationUs} fps={project.fps} />

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <NSlider
            value={volume}
            min={0}
            max={100}
            onChange={setVolume}
            className="mb-0 hidden w-16 @[370px]:block @[600px]:w-24"
            aria-label="Preview volume"
          />
          <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(value => !value)} active={muted}>
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </IconButton>
          <IconButton label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen} active={fullscreen}>
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </IconButton>
        </div>
      </div>
    </section>
  );
};

const TimeReadout = ({ durationUs, fps }: { durationUs: number; fps: number }) => {
  const playheadUs = useEditor(state => state.playheadUs);
  /** Non-null while typing; the playhead is ignored until the edit resolves. */
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = parseTimecode(draft, fps);
    setDraft(null);
    if (parsed !== null) seekTo(clamp(parsed, 0, durationUs));
  };

  if (draft !== null) {
    return (
      <input
        value={draft}
        autoFocus
        onFocus={event => event.target.select()}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(null);
          }
        }}
        aria-label="Go to time"
        className="ml-3 w-[5.5rem] shrink-0 rounded border border-accent bg-surface-secondary px-1 py-0.5 font-mono text-xs tabular-nums text-foreground outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(formatTimecode(playheadUs, true, fps))}
      title="Click to jump to a time — mm:ss:ff, mm:ss, or plain seconds"
      className="ml-3 shrink-0 whitespace-nowrap rounded px-1 font-mono text-xs tabular-nums text-muted transition-colors hover:bg-default">
      <span className="text-foreground">{formatTimecode(playheadUs, true, fps)}</span>
      <span className="mx-1 hidden opacity-50 @[560px]:inline">/</span>
      <span className="hidden @[560px]:inline">{formatTimecode(durationUs, true, fps)}</span>
    </button>
  );
};

const parseTimecode = (text: string, fps: number): number | null => {
  const parts = text.trim().split(':');
  if (parts.length > 4 || parts.some(part => part.trim() === '')) return null;

  const numbers = parts.map(part => Number(part));
  if (numbers.some(value => !Number.isFinite(value) || value < 0)) return null;

  const [seconds, frames] =
    numbers.length === 1
      ? [numbers[0], 0]
      : numbers.length === 2
        ? [numbers[0] * 60 + numbers[1], 0]
        : numbers.length === 3
          ? [numbers[0] * 60 + numbers[1], numbers[2]]
          : [numbers[0] * 3600 + numbers[1] * 60 + numbers[2], numbers[3]];

  return Math.round((seconds + frames / Math.max(1, fps)) * US);
};
