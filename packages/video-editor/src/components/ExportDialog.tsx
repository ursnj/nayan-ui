import { useEffect, useRef, useState } from 'react';
import { NButton, NDialog, NLink, NProgress, showToast } from '@nayan-ui/react';
import { DialogSize } from '@nayan-ui/react';
import { CheckCircle2, Download, X } from 'lucide-react';
import {
  END_CREDIT_SECONDS,
  END_CREDIT_TITLE,
  EXPORT_FORMATS,
  ExportCanceledError,
  exportProject,
  findFormat,
  isFormatSupported,
  probeExportBytes,
  suggestBitrate
} from '../engine/exporter';
import type { ExportProgress } from '../engine/exporter';
import { pausePlayback, player } from '../engine/playerInstance';
import { download, formatBytes } from '../lib/utils';
import { readEditorState, timelineDurationUs, useEditor } from '../store/editor';
import { US } from '../types';
import type { ExportSettings } from '../types';
import { SelectField, ToggleChip } from './controls';

/** Matches the exporter's mix rate, for the WAV size estimate. */
const MIX_SAMPLE_RATE = 48_000;

/** How long to let the settings settle before measuring the file size. */
const PROBE_DEBOUNCE_MS = 350;
/** Past this, measuring is costing more than the exact number is worth. */
const PROBE_BUDGET_MS = 2500;

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

  const [formatId, setFormatId] = useState('mp4');
  /** Probed on open so a container only offers itself if it can actually encode here. */
  const [supported, setSupported] = useState<Record<string, boolean>>({});
  const [quality, setQuality] = useState('1.2');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [endCredit, setEndCredit] = useState(true);
  const [useRange, setUseRange] = useState(inPointUs !== null || outPointUs !== null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /* Declared with the state it derives from, because the size-probe effect
     below reads it — further down, as it was, it was in its own temporal dead
     zone by the time that effect ran. */
  const running = progress !== null && progress.stage !== 'done';
  /** Measured by a probe encode, and thrown away when any input to it changes. */
  const [measured, setMeasured] = useState<{ key: string; bytes: number } | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const probeRef = useRef<AbortController | null>(null);
  /** Set once a probe has proved too slow here to keep doing automatically. */
  const autoProbeOff = useRef(false);

  // Closing the dialog cancels any run still in flight — the export and the
  // probe alike, since both hold decoders open.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
      probeRef.current?.abort();
      probeRef.current = null;
    },
    []
  );

  const format = findFormat(formatId);
  const audioOnly = format.kind === 'audio';

  /*
   * The frame is the project's, not a choice made here.
   *
   * There were size presets on this dialog — 1080p, 720p, Vertical, Square —
   * and any that disagreed with the project reframed the whole export: every
   * clip is fitted to the output, so a landscape timeline sent to 1080×1920
   * lost its sides or gained bars. Resolution and frame rate belong to Project
   * settings, where changing them re-composes the timeline you can see, rather
   * than to the last dialog before the file is written.
   */
  const { fps } = project;
  // Encoders want even dimensions; odd values fail on several codecs.
  const evenWidth = Math.max(2, Math.round(project.width / 2) * 2);
  const evenHeight = Math.max(2, Math.round(project.height / 2) * 2);
  const bitrate = Math.round(suggestBitrate(evenWidth, evenHeight, fps) * Number(quality));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        EXPORT_FORMATS.map(async option => [option.id, await isFormatSupported(option, evenWidth, evenHeight)] as const)
      );
      if (!cancelled) setSupported(Object.fromEntries(entries));
    })();
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
   * Bitrate x duration is a ceiling, not a prediction — and on its own it was a
   * misleading thing to put in front of someone. WebCodecs encodes at a
   * variable bitrate and treats the figure as a target it is allowed to come in
   * under, which it usually does by a wide margin: a 50s 1080p export budgeted
   * at 33MB lands nearer 6MB. Showing only the ceiling meant the one number on
   * the row was the one number the file would never be.
   *
   * So both ends are shown. The floor is the ceiling scaled by what simple
   * footage — a still, a title, a locked-off shot — actually costs, which is
   * roughly a fifth of its target; demanding material climbs toward the top of
   * the range. It is a rule of thumb rather than a measurement, and the range
   * is the honest way to say that.
   *
   * Audio is left out of the scaling: at a fixed 192kbps it really is close to
   * constant, so only the video part is uncertain. Uncompressed PCM is exact
   * throughout, which is why WAV is measured rather than estimated.
   */
  const VBR_TYPICAL_SHARE = 0.2;
  const exactSize = format.id === 'wav';
  /* The credit is part of the file, so the length and the budget both count it. */
  const creditSeconds = endCredit && !audioOnly ? END_CREDIT_SECONDS : 0;
  const outputSeconds = spanUs / US + creditSeconds;

  const audioBytesPerSecond = format.id === 'wav' ? MIX_SAMPLE_RATE * 2 * 2 : 192_000 / 8;
  const audioBytes = audioOnly || includeAudio ? audioBytesPerSecond * outputSeconds : 0;
  const videoCeilingBytes = audioOnly ? 0 : (bitrate / 8) * outputSeconds;
  const ceilingBytes = audioBytes + videoCeilingBytes;
  const likelyBytes = audioBytes + videoCeilingBytes * VBR_TYPICAL_SHARE;
  /** A range only says something where the video track is the uncertain part. */
  const showRange = !audioOnly && videoCeilingBytes > 0;

  const settings: ExportSettings = {
    width: evenWidth,
    height: evenHeight,
    fps,
    bitrate,
    audioBitrate: 192_000,
    includeAudio,
    endCredit,
    rangeUs: useRange ? { startUs: rangeStart, endUs: rangeEnd } : null
  };

  /*
   * Everything the measured figure depends on. A change to any of it makes the
   * measurement stale, so the key is what the effect below watches — and a
   * stale exact number is worse than an honest range, which is what shows while
   * a fresh measurement is on its way.
   */
  const measureKey = JSON.stringify({ settings, formatId, spanUs });
  const measuredBytes = measured?.key === measureKey ? measured.bytes : null;

  /*
   * Measured on its own, as soon as there is something to measure.
   *
   * Debounced rather than immediate, because the settings above change under
   * the cursor — a couple of clicks through the quality list should not start a
   * couple of encodes. Any probe still running is aborted first, so only the
   * settings you actually stopped on get measured.
   *
   * And bounded: if a probe takes longer than `PROBE_BUDGET_MS` on this machine
   * at this size, the automatic ones stop for the rest of the session and the
   * estimate goes back to showing its range. Measuring is worth a moment of
   * work in the background; it is not worth making the dialog feel broken on a
   * 4K project or a slow laptop.
   */
  useEffect(() => {
    if (!showRange || running || autoProbeOff.current) return;

    const timer = setTimeout(() => {
      const controller = new AbortController();
      probeRef.current = controller;
      setMeasuring(true);
      const began = performance.now();

      void (async () => {
        try {
          const state = readEditorState();
          const bytes = await probeExportBytes(
            { project: state.project, tracks: state.tracks, clips: state.clips },
            settings,
            timelineDurationUs(state.clips),
            formatId,
            controller.signal
          );
          if (controller.signal.aborted) return;
          if (performance.now() - began > PROBE_BUDGET_MS) autoProbeOff.current = true;
          if (bytes !== null) setMeasured({ key: measureKey, bytes });
        } finally {
          if (probeRef.current === controller) {
            probeRef.current = null;
            setMeasuring(false);
          }
          // The probe drove decoders of its own; put a clean frame back.
          player.refresh();
        }
      })();
    }, PROBE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      probeRef.current?.abort();
    };
    // `settings` is rebuilt every render; `measureKey` is its stable digest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureKey, showRange, running]);

  const runExport = async () => {
    const state = readEditorState();
    if (spanUs <= 0) return;

    pausePlayback();

    const controller = new AbortController();
    abortRef.current = controller;
    setResult(null);
    setProgress({ stage: 'preparing', progress: 0, message: 'Starting…' });
    // A probe would fight the export for the same decoders and encoders.
    probeRef.current?.abort();

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

  return (
    <div className="space-y-3">
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
        {/* Hidden for an audio-only bounce, which has no picture to show a card
            on — the exporter skips it there regardless, and offering a switch
            that does nothing is worse than not offering it. */}
        {!audioOnly && (
          <ToggleChip
            active={endCredit}
            onClick={() => setEndCredit(value => !value)}
            label={`Append a ${END_CREDIT_SECONDS}s ${END_CREDIT_TITLE} card after the last frame`}
            className="flex-1">
            {endCredit ? 'Credits on' : 'Credits off'}
          </ToggleChip>
        )}
        <ToggleChip active={useRange} onClick={() => setUseRange(value => !value)} label="Export only the marked in/out range" className="flex-1">
          {useRange ? 'In/out range' : 'Whole timeline'}
        </ToggleChip>
      </div>

      <dl className="rounded-lg bg-surface-secondary px-3 py-2 text-xs">
        <Row label="Output" value={audioOnly ? `${format.label} · audio only` : `${evenWidth} × ${evenHeight} · ${fps} fps`} />
        <Row label="Duration" value={creditSeconds > 0 ? `${outputSeconds.toFixed(1)}s · ${creditSeconds}s credit` : `${outputSeconds.toFixed(1)}s`} />
        {!audioOnly && <Row label="Bitrate" value={`${(bitrate / 1_000_000).toFixed(1)} Mbps ceiling`} />}
        {/* The measured figure replaces the range in place, so the row never
            has two answers on it at once. While a measurement is on its way the
            range stays up — it is still true, just wider than necessary. */}
        <Row
          label={exactSize || measuredBytes !== null ? 'Size' : 'Size estimate'}
          value={
            measuredBytes !== null
              ? `≈ ${formatBytes(measuredBytes)}${measuring ? ' · remeasuring' : ''}`
              : showRange
                ? `${formatBytes(likelyBytes)} – ${formatBytes(ceilingBytes)}${measuring ? ' · measuring' : ''}`
                : formatBytes(ceilingBytes)
          }
        />
      </dl>
      {!exactSize && (
        <p className="-mt-1 px-3 text-[10px] leading-relaxed text-muted">
          {measuredBytes !== null
            ? 'Measured by encoding three short windows of this timeline at these settings — within a few percent unless the footage changes character partway through.'
            : showRange
              ? 'Variable bitrate, so the file lands somewhere in that range — stills and titles near the low end, motion and grain near the high one.'
              : 'Variable bitrate, so the file can finish under this figure.'}
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
