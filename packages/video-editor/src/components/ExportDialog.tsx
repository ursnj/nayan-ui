import { useEffect, useRef, useState } from 'react';
import { NButton, NDialog, NProgress, NSelect, NSwitch, showToast } from '@nayan-ui/react';
import { DialogSize } from '@nayan-ui/react';
import { CheckCircle2, Download, X } from 'lucide-react';
import { ExportCanceledError, exportProject, suggestBitrate } from '../engine/exporter';
import type { ExportProgress } from '../engine/exporter';
import { player } from '../engine/playerInstance';
import { download, formatBytes } from '../lib/utils';
import { readEditorState, timelineDurationUs, useEditor } from '../store/editor';
import { US } from '../types';
import type { ExportSettings } from '../types';

const RESOLUTION_SCALES = [
  { label: 'Project resolution', value: '1' },
  { label: 'Half resolution', value: '0.5' },
  { label: 'Quarter resolution', value: '0.25' }
];

const QUALITY_PRESETS = [
  { label: 'High', value: '1.5' },
  { label: 'Balanced', value: '1' },
  { label: 'Small file', value: '0.6' }
];

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The form is mounted only while the dialog is open, so closing it resets the
 * settings and progress by unmounting rather than by clearing state in an
 * effect — and the in-flight export is aborted by the unmount cleanup.
 */
export const ExportDialog = ({ isOpen, onClose }: ExportDialogProps) => (
  <NDialog isOpen={isOpen} title="Export video" size={DialogSize.SM} onClose={onClose}>
    {isOpen ? <ExportForm onClose={onClose} /> : null}
  </NDialog>
);

const ExportForm = ({ onClose }: { onClose: () => void }) => {
  const project = useEditor(state => state.project);
  const durationUs = useEditor(state => timelineDurationUs(state.clips));

  const [scale, setScale] = useState(RESOLUTION_SCALES[0]);
  const [quality, setQuality] = useState(QUALITY_PRESETS[1]);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Encoders want even dimensions; odd values fail on several codecs.
  const width = Math.max(2, Math.round((project.width * Number(scale.value)) / 2) * 2);
  const height = Math.max(2, Math.round((project.height * Number(scale.value)) / 2) * 2);
  const bitrate = Math.round(suggestBitrate(width, height, project.fps) * Number(quality.value));
  const estimatedBytes = ((bitrate + (includeAudio ? 128_000 : 0)) / 8) * (durationUs / US);

  // Closing the dialog cancels any run still in flight.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    []
  );

  const runExport = async () => {
    const state = readEditorState();
    if (timelineDurationUs(state.clips) <= 0) return;

    player.pause();
    useEditor.setState({ isPlaying: false });

    const controller = new AbortController();
    abortRef.current = controller;
    setResult(null);
    setProgress({ stage: 'preparing', progress: 0, message: 'Starting…' });

    const settings: ExportSettings = {
      width,
      height,
      fps: project.fps,
      bitrate,
      audioBitrate: 128_000,
      includeAudio
    };

    try {
      const blob = await exportProject(
        { project: state.project, tracks: state.tracks, clips: state.clips },
        settings,
        timelineDurationUs(state.clips),
        setProgress,
        controller.signal
      );
      const filename = `${state.project.name.replace(/[^\w\-. ]+/g, '_') || 'export'}.mp4`;
      setResult({ blob, filename });
      // Hand the file over immediately; the dialog keeps a link for a second go.
      download(blob, filename);
    } catch (error) {
      if (error instanceof ExportCanceledError) {
        setProgress(null);
      } else {
        showToast(error instanceof Error ? error.message : 'Export failed', 'Export failed');
        setProgress(null);
      }
    } finally {
      abortRef.current = null;
      // Decoders were driven hard during export; drop back to a clean frame.
      player.refresh();
    }
  };

  const running = progress !== null && progress.stage !== 'done';

  return (
    <div className="space-y-1">
      <NSelect label="Resolution" value={scale} options={RESOLUTION_SCALES} isDisabled={running} onChange={option => option && setScale(option)} />
      <NSelect label="Quality" value={quality} options={QUALITY_PRESETS} isDisabled={running} onChange={option => option && setQuality(option)} />
      <NSwitch label="Include audio" enabled={includeAudio} disabled={running} onChange={setIncludeAudio} className="py-2" />

      <dl className="rounded-md bg-surface-secondary px-3 py-2 text-xs">
        <Row label="Output" value={`${width} × ${height} · ${project.fps} fps`} />
        <Row label="Duration" value={`${(durationUs / US).toFixed(1)}s`} />
        <Row label="Estimated size" value={`~${formatBytes(estimatedBytes)}`} />
      </dl>

      {progress && (
        <div className="pt-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted">{progress.message}</span>
            <span className="font-mono tabular-nums text-foreground">{Math.round(progress.progress * 100)}%</span>
          </div>
          <NProgress value={progress.progress * 100} label="Export progress" showLabel />
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 rounded-md border border-success bg-success/10 px-3 py-2 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span className="flex-1 truncate">
            {result.filename} · {formatBytes(result.blob.size)}
          </span>
          <button type="button" onClick={() => download(result.blob, result.filename)} className="shrink-0 font-medium text-accent hover:underline">
            Save again
          </button>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3">
        {running ? (
          <NButton isOutline onClick={() => abortRef.current?.abort()}>
            <X className="mr-1.5 h-4 w-4" />
            Cancel
          </NButton>
        ) : (
          <>
            <NButton isOutline onClick={onClose}>
              Close
            </NButton>
            <NButton onClick={() => void runExport()} disabled={durationUs <= 0}>
              <Download className="mr-1.5 h-4 w-4" />
              {result ? 'Export again' : 'Export MP4'}
            </NButton>
          </>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-0.5">
    <dt className="text-muted">{label}</dt>
    <dd className="font-mono tabular-nums text-foreground">{value}</dd>
  </div>
);
