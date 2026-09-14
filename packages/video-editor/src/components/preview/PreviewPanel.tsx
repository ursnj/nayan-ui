import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NSlider, NTooltip } from '@nayan-ui/react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Maximize2,
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
import { pausePlayback, player, seekTo, stepFrames, togglePlayback } from '../../engine/playerInstance';
import { cn, download, formatTimecode } from '../../lib/utils';
import { primarySelectedClip, timelineDurationUs, useEditor } from '../../store/editor';
import { IconButton } from '../controls';
import { TransformOverlay } from './TransformOverlay';

export const PreviewPanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    player.attach(canvasRef.current);
    // Detach but don't dispose: the player is a page-lifetime singleton, and
    // tearing down its AudioContext on a StrictMode remount would be wasteful.
    return () => player.attach(null);
  }, []);

  useEffect(() => {
    player.audio.setVolume(muted ? 0 : volume / 100);
  }, [muted, volume]);

  useEffect(() => {
    player.refresh();
  }, [clips, tracks, project]);

  // Restart from the top when looping is on and playback reaches the end.
  useEffect(() => {
    if (!loop || isPlaying || durationUs <= 0) return;
    const state = useEditor.getState();
    if (state.playheadUs < durationUs - 1000) return;
    seekTo(0);
    void togglePlayback();
  }, [loop, isPlaying, durationUs]);

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

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (blob) download(blob, `${project.name.replace(/[^\w\-. ]+/g, '_') || 'frame'}.png`);
    }, 'image/png');
  }, [project.name]);

  const overlayVisible = showOverlay && selected !== null && selected.kind !== 'audio' && displaySize.width > 0;

  return (
    <section className="island flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-border bg-editor-chrome px-2 py-1">
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

        <span className="ml-auto font-mono text-[10px] tabular-nums text-muted">
          {project.width} × {project.height} · {project.fps}fps
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-editor-canvas p-4">
        <div
          ref={frameRef}
          className="checkerboard relative max-h-full max-w-full overflow-hidden rounded-md elevate"
          style={{ aspectRatio: `${project.width} / ${project.height}` }}>
          <canvas ref={canvasRef} width={project.width} height={project.height} className="block h-full w-full" />

          {showSafeZones && (
            <div className="pointer-events-none absolute inset-0">
              {/* 90% action-safe and 80% title-safe, the broadcast convention. */}
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
              <p className="text-sm text-white/60">Add media to the timeline to start editing</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border bg-editor-chrome px-3 py-1.5">
        <IconButton label="Jump to start" onClick={() => seekTo(0)}>
          <SkipBack className="h-4 w-4" />
        </IconButton>
        <IconButton label="Previous frame" onClick={() => stepFrames(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>

        <NTooltip message={isPlaying ? 'Pause' : 'Play'}>
          <button
            type="button"
            onClick={() => void togglePlayback()}
            disabled={durationUs === 0}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={cn(
              'mx-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              durationUs === 0 ? 'cursor-not-allowed bg-default text-muted opacity-50' : 'bg-accent text-accent-foreground hover:opacity-90'
            )}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
        </NTooltip>

        <IconButton label="Next frame" onClick={() => stepFrames(1)}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <IconButton label="Jump to end" onClick={() => seekTo(durationUs)}>
          <SkipForward className="h-4 w-4" />
        </IconButton>
        <IconButton label="Loop playback" onClick={() => setLoop(value => !value)} active={loop}>
          <Repeat className="h-4 w-4" />
        </IconButton>

        <TimeReadout durationUs={durationUs} fps={project.fps} />

        <div className="ml-auto flex items-center gap-2">
          <AudioMeter />
          <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(value => !value)} active={muted}>
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </IconButton>
          <NSlider value={volume} min={0} max={100} onChange={setVolume} className="mb-0 w-24" aria-label="Preview volume" />
          <IconButton
            label="Stop and rewind"
            onClick={() => {
              pausePlayback();
              seekTo(0);
            }}>
            <Maximize2 className="h-4 w-4 rotate-45" />
          </IconButton>
        </div>
      </div>
    </section>
  );
};

/**
 * Isolated so the playhead update on every animation frame re-renders this
 * readout alone rather than the whole preview panel.
 */
const TimeReadout = ({ durationUs, fps }: { durationUs: number; fps: number }) => {
  const playheadUs = useEditor(state => state.playheadUs);
  return (
    <span className="ml-3 font-mono text-xs tabular-nums text-muted">
      <span className="text-foreground">{formatTimecode(playheadUs, true, fps)}</span>
      <span className="mx-1 opacity-50">/</span>
      {formatTimecode(durationUs, true, fps)}
    </span>
  );
};

/** Live output level, sampled from the audio graph's analyser while playing. */
const AudioMeter = () => {
  const isPlaying = useEditor(state => state.isPlaying);
  return isPlaying ? <LiveMeter /> : <MeterBars level={0} />;
};

/**
 * Split out so the rAF sampling loop only exists while audio is playing, and
 * so stopping resets the meter by unmounting rather than by clearing state.
 */
const LiveMeter = () => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let frame = requestAnimationFrame(function tick() {
      setLevel(player.audio.peakLevel());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <MeterBars level={level} />;
};

const MeterBars = ({ level }: { level: number }) => {
  return (
    <div className="flex h-4 w-14 items-end gap-px" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => {
        const threshold = (index + 1) / 12;
        const lit = level >= threshold;
        return (
          <span
            key={index}
            className={cn(
              'h-full flex-1 rounded-[1px] transition-colors',
              !lit ? 'bg-default' : threshold > 0.9 ? 'bg-danger' : threshold > 0.75 ? 'bg-warning' : 'bg-success'
            )}
          />
        );
      })}
    </div>
  );
};
