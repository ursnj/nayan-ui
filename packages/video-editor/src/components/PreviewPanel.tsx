import { useEffect, useRef, useState } from 'react';
import { NButton, NSlider, NTooltip } from '@nayan-ui/react';
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { player, seekTo, stepFrames, togglePlayback } from '../engine/playerInstance';
import { formatTimecode } from '../lib/utils';
import { timelineDurationUs, useEditor } from '../store/editor';

export const PreviewPanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const project = useEditor(state => state.project);
  const isPlaying = useEditor(state => state.isPlaying);
  const durationUs = useEditor(state => timelineDurationUs(state.clips));
  // Any edit to a clip should repaint the frame under the playhead.
  const clips = useEditor(state => state.clips);
  const tracks = useEditor(state => state.tracks);

  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);

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

  useEffect(() => () => player.dispose(), []);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-background">
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div
          className="relative max-h-full max-w-full overflow-hidden rounded-lg border border-border bg-black shadow-lg"
          style={{ aspectRatio: `${project.width} / ${project.height}` }}>
          <canvas ref={canvasRef} width={project.width} height={project.height} className="block h-full w-full object-contain" />
          {durationUs === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-white/50">Add media to the timeline to start editing</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-surface px-4 py-2">
        <NTooltip message="Jump to start (Home)">
          <NButton isOutline onClick={() => seekTo(0)} className="h-8 w-9 px-0" aria-label="Jump to start">
            <SkipBack className="h-4 w-4" />
          </NButton>
        </NTooltip>
        <NTooltip message="Previous frame (←)">
          <NButton isOutline onClick={() => stepFrames(-1)} className="h-8 w-9 px-0" aria-label="Previous frame">
            <ChevronLeft className="h-4 w-4" />
          </NButton>
        </NTooltip>
        <NTooltip message={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
          <NButton
            onClick={() => void togglePlayback()}
            disabled={durationUs === 0}
            className="h-8 w-10 px-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </NButton>
        </NTooltip>
        <NTooltip message="Next frame (→)">
          <NButton isOutline onClick={() => stepFrames(1)} className="h-8 w-9 px-0" aria-label="Next frame">
            <ChevronRight className="h-4 w-4" />
          </NButton>
        </NTooltip>
        <NTooltip message="Jump to end (End)">
          <NButton isOutline onClick={() => seekTo(durationUs)} className="h-8 w-9 px-0" aria-label="Jump to end">
            <SkipForward className="h-4 w-4" />
          </NButton>
        </NTooltip>

        <TimeReadout durationUs={durationUs} fps={project.fps} />

        <div className="ml-auto flex w-44 items-center gap-2">
          <NTooltip message={muted ? 'Unmute' : 'Mute'}>
            <button
              type="button"
              onClick={() => setMuted(value => !value)}
              aria-label={muted ? 'Unmute preview' : 'Mute preview'}
              className="rounded p-1 text-muted hover:text-foreground">
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </NTooltip>
          <NSlider value={volume} min={0} max={100} onChange={setVolume} className="mb-0 flex-1" aria-label="Preview volume" />
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
      <span className="text-foreground">{formatTimecode(playheadUs, true, fps)}</span> / {formatTimecode(durationUs, true, fps)}
    </span>
  );
};
