import { useEffect, useRef, useState } from 'react';
import { NButton, NDialog, NLink, NProgress, showToast } from '@nayan-ui/react';
import { DialogSize } from '@nayan-ui/react';
import { CheckCircle2, Download, X } from 'lucide-react';
import {
  EXPORT_FORMATS,
  EXPORT_PRESETS,
  ExportCanceledError,
  exportProject,
  findFormat,
  isFormatSupported,
  suggestBitrate
} from '../engine/exporter';
import type { ExportPreset, ExportProgress } from '../engine/exporter';
import { pausePlayback, player } from '../engine/playerInstance';
import { cn, download, formatBytes } from '../lib/utils';
import { readEditorState, timelineDurationUs, useEditor } from '../store/editor';
import { US } from '../types';
import type { ExportSettings } from '../types';
import { SelectField, ToggleChip } from './controls';

/** Matches the exporter's mix rate, for the WAV size estimate. */
const MIX_SAMPLE_RATE = 48_000;

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

const QUALITY_OPTIONS = [
  { value: '1.6', label: 'Maximum' },
  { value: '1.2', label: 'High' },
  { value: '1', label: 'Balanced' },
  { value: '0.7', label: 'Small file' }
];

const ExportForm = ({ onClose }: { onClose: () => void }) => {
  const project = useEditor(state => state.project);
  const durationUs = useEditor(state => timelineDurationUs(state.clips));
  const inPointUs = useEditor(state => state.inPointUs);
  const outPointUs = useEditor(state => state.outPointUs);

  const [width, setWidth] = useState(project.width);
  const [height, setHeight] = useState(project.height);
  const [fps, setFps] = useState(project.fps);
  const [formatId, setFormatId] = useState('mp4');
  /** Probed on open so a container only offers itself if it can actually encode here. */
  const [supported, setSupported] = useState<Record<string, boolean>>({});
  const [quality, setQuality] = useState('1.2');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [useRange, setUseRange] = useState(inPointUs !== null || outPointUs !== null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Closing the dialog cancels any run still in flight.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    []
  );

  /*
   * The highlight is derived rather than stored. Tracking a `preset` alongside
   * the real width/height let them disagree: the dialog opened showing 1080p
   * selected while a vertical project would actually export 1080x1920.
   */
  const activePreset = EXPORT_PRESETS.find(option => option.width === width && option.height === height && option.fps === fps) ?? null;
  const format = findFormat(formatId);
  const audioOnly = format.kind === 'audio';

  const applyPreset = (next: ExportPreset) => {
    setWidth(next.width);
    setHeight(next.height);
    setFps(next.fps);
    setQuality(String(next.qualityScale));
  };

  // Encoders want even dimensions; odd values fail on several codecs.
  const evenWidth = Math.max(2, Math.round(width / 2) * 2);
  const evenHeight = Math.max(2, Math.round(height / 2) * 2);
  const bitrate = Math.round(suggestBitrate(evenWidth, evenHeight, fps) * Number(quality));

  useEffect(() => {
    let cancelled = false;
    void Promise.all(EXPORT_FORMATS.map(async option => [option.id, await isFormatSupported(option, evenWidth, evenHeight)] as const)).then(
      entries => {
        if (!cancelled) setSupported(Object.fromEntries(entries));
      }
    );
    return () => {
      cancelled = true;
    };
    // Probed once for the size the dialog opened at; re-probing per keystroke
    // would spin up encoders on every change for no practical benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rangeStart = useRange ? (inPointUs ?? 0) : 0;
  const rangeEnd = useRange ? (outPointUs ?? durationUs) : durationUs;
  const spanUs = Math.max(0, rangeEnd - rangeStart);
  /*
   * Bitrate x duration is a budget, not a prediction. WebCodecs encodes at a
   * variable bitrate by default and treats the figure below as a target, so
   * anything that compresses well — a still, a title card, a locked-off shot —
   * finishes far under it. Uncompressed PCM is the one case that lands on the
   * number exactly, which is why WAV is measured rather than estimated.
   */
  const audioBytesPerSecond = format.id === 'wav' ? MIX_SAMPLE_RATE * 2 * 2 : 192_000 / 8;
  const exactSize = format.id === 'wav';
  const estimatedBytes = audioOnly ? audioBytesPerSecond * (spanUs / US) : ((bitrate + (includeAudio ? 192_000 : 0)) / 8) * (spanUs / US);

  const runExport = async () => {
    const state = readEditorState();
    if (spanUs <= 0) return;

    pausePlayback();

    const controller = new AbortController();
    abortRef.current = controller;
    setResult(null);
    setProgress({ stage: 'preparing', progress: 0, message: 'Starting…' });

    const settings: ExportSettings = {
      width: evenWidth,
      height: evenHeight,
      fps,
      bitrate,
      audioBitrate: 192_000,
      includeAudio,
      rangeUs: useRange ? { startUs: rangeStart, endUs: rangeEnd } : null
    };

    try {
      const blob = await exportProject(
        { project: state.project, tracks: state.tracks, clips: state.clips },
        settings,
        timelineDurationUs(state.clips),
        setProgress,
        controller.signal,
        formatId
      );
      const filename = `${state.project.name.replace(/[^\w\-. ]+/g, '_') || 'export'}.${format.extension}`;
      setResult({ blob, filename });
      // Hand the file over immediately; the dialog keeps a link for a second go.
      download(blob, filename);
    } catch (error) {
      if (!(error instanceof ExportCanceledError)) {
        showToast(error instanceof Error ? error.message : 'Export failed', 'Export failed');
      }
      setProgress(null);
    } finally {
      abortRef.current = null;
      // Decoders were driven hard during export; drop back to a clean frame.
      player.refresh();
    }
  };

  const running = progress !== null && progress.stage !== 'done';

  return (
    <div className="space-y-3">
      {!audioOnly && (
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Preset</span>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPORT_PRESETS.map(option => (
              <button
                key={option.name}
                type="button"
                disabled={running}
                onClick={() => applyPreset(option)}
                aria-pressed={activePreset?.name === option.name}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-left transition-colors disabled:opacity-50',
                  activePreset?.name === option.name ? 'border-accent bg-accent/10' : 'border-border hover:border-separator'
                )}>
                <span className="block text-[11px] font-medium text-foreground">{option.name}</span>
                <span className="block text-[10px] text-muted">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Quality" value={quality} options={QUALITY_OPTIONS} onChange={setQuality} />
        <SelectField
          label="Format"
          value={formatId}
          options={EXPORT_FORMATS.filter(option => supported[option.id] !== false).map(option => ({
            value: option.id,
            label: `${option.label} — ${option.detail}`
          }))}
          disabled={running}
          onChange={setFormatId}
        />
      </div>

      <div className="flex gap-1.5">
        {!audioOnly && (
          <ToggleChip active={includeAudio} onClick={() => setIncludeAudio(value => !value)} label="Include the audio mix" className="flex-1">
            {includeAudio ? 'Audio on' : 'Audio off'}
          </ToggleChip>
        )}
        <ToggleChip active={useRange} onClick={() => setUseRange(value => !value)} label="Export only the marked in/out range" className="flex-1">
          {useRange ? 'In/out range' : 'Whole timeline'}
        </ToggleChip>
      </div>

      <dl className="rounded-lg bg-surface-secondary px-3 py-2 text-xs">
        <Row label="Output" value={audioOnly ? `${format.label} · audio only` : `${evenWidth} × ${evenHeight} · ${fps} fps`} />
        <Row label="Duration" value={`${(spanUs / US).toFixed(1)}s`} />
        {!audioOnly && <Row label="Bitrate" value={`${(bitrate / 1_000_000).toFixed(1)} Mbps`} />}
        <Row label={exactSize ? 'Size' : 'Size budget'} value={`${exactSize ? '' : 'up to '}${formatBytes(estimatedBytes)}`} />
      </dl>
      {!exactSize && (
        <p className="-mt-1 px-3 text-[10px] leading-relaxed text-muted">
          Variable bitrate — simple footage finishes well under the budget. Stills and titles can come out a hundred times smaller.
        </p>
      )}

      {progress && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-muted">{progress.message}</span>
            <span className="shrink-0 font-mono tabular-nums text-foreground">{Math.round(progress.progress * 100)}%</span>
          </div>
          <NProgress value={progress.progress * 100} label="Export progress" showLabel />
          {progress.fps !== undefined && (
            <p className="mt-1 text-[10px] tabular-nums text-muted">
              {progress.fps.toFixed(1)} fps
              {progress.etaSeconds !== undefined && progress.etaSeconds > 1 && ` · about ${formatEta(progress.etaSeconds)} left`}
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 rounded-lg border border-success bg-success/10 px-3 py-2 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span className="min-w-0 flex-1 truncate">
            {result.filename} · {formatBytes(result.blob.size)}
          </span>
          <NLink href="#" onPress={() => download(result.blob, result.filename)} className="shrink-0 text-xs font-medium">
            Save again
          </NLink>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
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
            <NButton onClick={() => void runExport()} disabled={spanUs <= 0}>
              <Download className="mr-1.5 h-4 w-4" />
              {result ? 'Export again' : 'Export'}
            </NButton>
          </>
        )}
      </div>
    </div>
  );
};

const formatEta = (seconds: number) => (seconds < 60 ? `${Math.ceil(seconds)}s` : `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-0.5">
    <dt className="text-muted">{label}</dt>
    <dd className="font-mono tabular-nums text-foreground">{value}</dd>
  </div>
);
