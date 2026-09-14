import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NButton, NMeter, NSlider, NTooltip } from '@nayan-ui/react';
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
import { download, formatTimecode } from '../../lib/utils';
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

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (blob) download(blob, `${project.name.replace(/[^\w\-. ]+/g, '_') || 'frame'}.png`);
    }, 'image/png');
  }, [project.name]);

  const overlayVisible = showOverlay && selected !== null && selected.kind !== 'audio' && displaySize.width > 0;

  return (
    /*
     * A container, not a media query: the transport has to fit the *pane*,
     * which the user resizes independently of the window. Its full set of
     * controls needs about 650px, and at 1024px the preview gets 372 — so the
     * row sheds controls as it narrows, least useful first, keeping transport
     * and the current time to the end.
     */
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

      {/*
        The stage runs edge to edge — no padding, no rounded corners and no
        shadow on the frame itself, which would only be clipped by the island
        now that the two touch. Whatever the project's aspect ratio doesn't
        fill shows as the canvas colour either side of it.
      */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-editor-canvas">
        <div
          ref={frameRef}
          className="checkerboard relative max-h-full max-w-full overflow-hidden"
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

      <div className="flex items-center gap-1 border-t border-border bg-editor-panel px-3 py-1.5">
        {/* `contents` so the wrapper vanishes from the flex row when shown. */}
        <span className="hidden @[380px]:contents">
          <IconButton label="Jump to start" onClick={() => seekTo(0)}>
            <SkipBack className="h-4 w-4" />
          </IconButton>
        </span>
        <IconButton label="Previous frame" onClick={() => stepFrames(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>

        <NTooltip message={isPlaying ? 'Pause' : 'Play'}>
          <NButton
            onClick={() => void togglePlayback()}
            disabled={durationUs === 0}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="mx-1 h-8 w-8 rounded-full px-0">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </NButton>
        </NTooltip>

        <IconButton label="Next frame" onClick={() => stepFrames(1)}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <span className="hidden @[380px]:contents">
          <IconButton label="Jump to end" onClick={() => seekTo(durationUs)}>
            <SkipForward className="h-4 w-4" />
          </IconButton>
        </span>
        <IconButton label="Loop playback" onClick={() => setLoop(value => !value)} active={loop}>
          <Repeat className="h-4 w-4" />
        </IconButton>

        <TimeReadout durationUs={durationUs} fps={project.fps} />

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <span className="hidden @[640px]:contents">
            <AudioMeter />
          </span>
          <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(value => !value)} active={muted}>
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </IconButton>
          {/* Mute stays to the end; the slider is the first thing to go. */}
          <NSlider value={volume} min={0} max={100} onChange={setVolume} className="mb-0 hidden w-24 @[560px]:block" aria-label="Preview volume" />
          <span className="hidden @[680px]:contents">
            <IconButton
              label="Stop and rewind"
              onClick={() => {
                pausePlayback();
                seekTo(0);
              }}>
              <Maximize2 className="h-4 w-4 rotate-45" />
            </IconButton>
          </span>
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
    <span className="ml-3 shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-muted">
      <span className="text-foreground">{formatTimecode(playheadUs, true, fps)}</span>
      {/* The duration is the half you can do without when space is short. */}
      <span className="mx-1 hidden opacity-50 @[470px]:inline">/</span>
      <span className="hidden @[470px]:inline">{formatTimecode(durationUs, true, fps)}</span>
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
    // A level meter reads fine at 20fps, and this is a React render each time.
    let last = 0;
    let frame = requestAnimationFrame(function tick(now: number) {
      if (now - last >= 50) {
        last = now;
        setLevel(player.audio.peakLevel());
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <MeterBars level={level} />;
};

const MeterBars = ({ level }: { level: number }) => (
  <NMeter
    value={Math.round(level * 100)}
    size="sm"
    showOutput={false}
    // Warn as the signal approaches clipping.
    color={level > 0.9 ? 'danger' : level > 0.75 ? 'warning' : 'success'}
    className="w-16"
    aria-label="Output level"
  />
);
