import { useCallback } from 'react';
import { NDivider, NSelect, NSlider, NSwitch, NTextarea, NTooltip } from '@nayan-ui/react';
import { AlignCenter, AlignLeft, AlignRight, Bold, FlipHorizontal, FlipVertical, Italic, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn, formatTimecode } from '../lib/utils';
import { useEditor } from '../store/editor';
import { DEFAULT_FILTERS, DEFAULT_TRANSFORM, FILTER_PRESETS, US, clipEndUs, isTextClip } from '../types';
import type { Clip, Filters, MediaClip, TextAlign, TextClip, Transform } from '../types';

const SPEEDS = [
  { label: '0.25×', value: '0.25' },
  { label: '0.5×', value: '0.5' },
  { label: '1×', value: '1' },
  { label: '1.5×', value: '1.5' },
  { label: '2×', value: '2' },
  { label: '4×', value: '4' }
];

const FONTS = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' }
];

export const Inspector = () => {
  const selectedClipId = useEditor(state => state.selectedClipId);
  const clip = useEditor(state => state.clips.find(entry => entry.id === state.selectedClipId) ?? null);
  const updateClip = useEditor(state => state.updateClip);

  const patch = useCallback(
    (changes: Partial<Clip>) => {
      if (!selectedClipId) return;
      updateClip(selectedClipId, changes);
    },
    [selectedClipId, updateClip]
  );

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-muted" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Properties</h2>
      </div>

      {!clip ? (
        <p className="px-4 py-8 text-center text-xs text-muted">Select a clip on the timeline to edit it.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <ClipSummary clip={clip} />
          <NDivider className="my-3" />

          <Section title="Timing">
            <SliderField
              label="Fade in"
              value={clip.fadeInUs / 1000}
              min={0}
              max={Math.min(5000, clip.durationUs / 1000)}
              step={50}
              format={value => `${(value / 1000).toFixed(2)}s`}
              onChange={value => patch({ fadeInUs: value * 1000 })}
            />
            <SliderField
              label="Fade out"
              value={clip.fadeOutUs / 1000}
              min={0}
              max={Math.min(5000, clip.durationUs / 1000)}
              step={50}
              format={value => `${(value / 1000).toFixed(2)}s`}
              onChange={value => patch({ fadeOutUs: value * 1000 })}
            />
            <SliderField
              label="Opacity"
              value={Math.round(clip.opacity * 100)}
              min={0}
              max={100}
              format={value => `${value}%`}
              onChange={value => patch({ opacity: value / 100 })}
            />
          </Section>

          {isTextClip(clip) ? <TextControls clip={clip} patch={patch} /> : <MediaControls clip={clip} patch={patch} />}
        </div>
      )}
    </aside>
  );
};

const ClipSummary = ({ clip }: { clip: Clip }) => (
  <div className="rounded-md bg-surface-secondary px-2.5 py-2">
    <p className="truncate text-xs font-medium text-foreground" title={clip.name}>
      {clip.name}
    </p>
    <p className="mt-0.5 font-mono text-[11px] text-muted">
      {formatTimecode(clip.startUs)} → {formatTimecode(clipEndUs(clip))} · {(clip.durationUs / US).toFixed(2)}s
    </p>
  </div>
);

const MediaControls = ({ clip, patch }: { clip: MediaClip; patch: (changes: Partial<MediaClip>) => void }) => {
  const assets = useEditor(state => state.assets);
  const asset = assets.find(entry => entry.id === clip.assetId);
  const hasPicture = clip.kind !== 'audio';
  const hasSound = clip.kind !== 'image' && (asset?.hasAudio ?? false);

  const setTransform = (changes: Partial<Transform>) => patch({ transform: { ...clip.transform, ...changes } });
  const setFilters = (changes: Partial<Filters>) => patch({ filters: { ...clip.filters, ...changes } });

  const speedOption = SPEEDS.find(option => option.value === String(clip.speed)) ?? { label: `${clip.speed}×`, value: String(clip.speed) };

  return (
    <>
      {clip.kind !== 'image' && (
        <Section title="Playback">
          <NSelect
            label="Speed"
            value={speedOption}
            options={SPEEDS}
            className="mb-2"
            onChange={option => {
              if (!option) return;
              const speed = Number(option.value);
              // Hold the same source range: faster playback means a shorter clip.
              patch({ speed, durationUs: Math.max(100_000, Math.round((clip.durationUs * clip.speed) / speed)) });
            }}
          />
        </Section>
      )}

      {hasSound && (
        <Section title="Audio">
          <SliderField
            label="Volume"
            value={Math.round(clip.volume * 100)}
            min={0}
            max={200}
            format={value => `${value}%`}
            onChange={value => patch({ volume: value / 100 })}
          />
          <NSwitch label="Mute clip" enabled={clip.muted} onChange={muted => patch({ muted })} className="py-1" />
        </Section>
      )}

      {hasPicture && (
        <>
          <Section title="Transform" onReset={() => patch({ transform: { ...DEFAULT_TRANSFORM } })}>
            <SliderField
              label="Scale"
              value={Math.round(clip.transform.scale * 100)}
              min={10}
              max={400}
              format={value => `${value}%`}
              onChange={value => setTransform({ scale: value / 100 })}
            />
            <SliderField
              label="Position X"
              value={Math.round(clip.transform.x * 100)}
              min={-100}
              max={100}
              format={value => `${value}%`}
              onChange={value => setTransform({ x: value / 100 })}
            />
            <SliderField
              label="Position Y"
              value={Math.round(clip.transform.y * 100)}
              min={-100}
              max={100}
              format={value => `${value}%`}
              onChange={value => setTransform({ y: value / 100 })}
            />
            <SliderField
              label="Rotation"
              value={clip.transform.rotation}
              min={-180}
              max={180}
              format={value => `${value}°`}
              onChange={rotation => setTransform({ rotation })}
            />
            <div className="mt-1 flex gap-1.5">
              <ToggleChip active={clip.transform.flipH} onClick={() => setTransform({ flipH: !clip.transform.flipH })} label="Flip horizontally">
                <FlipHorizontal className="h-3.5 w-3.5" />
              </ToggleChip>
              <ToggleChip active={clip.transform.flipV} onClick={() => setTransform({ flipV: !clip.transform.flipV })} label="Flip vertically">
                <FlipVertical className="h-3.5 w-3.5" />
              </ToggleChip>
            </div>
          </Section>

          <Section title="Filters" onReset={() => patch({ filters: { ...DEFAULT_FILTERS } })}>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {FILTER_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => patch({ filters: { ...preset.filters } })}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-accent hover:text-foreground">
                  {preset.name}
                </button>
              ))}
            </div>
            <SliderField
              label="Brightness"
              value={Math.round(clip.filters.brightness * 100)}
              min={0}
              max={200}
              format={value => `${value}%`}
              onChange={value => setFilters({ brightness: value / 100 })}
            />
            <SliderField
              label="Contrast"
              value={Math.round(clip.filters.contrast * 100)}
              min={0}
              max={200}
              format={value => `${value}%`}
              onChange={value => setFilters({ contrast: value / 100 })}
            />
            <SliderField
              label="Saturation"
              value={Math.round(clip.filters.saturation * 100)}
              min={0}
              max={300}
              format={value => `${value}%`}
              onChange={value => setFilters({ saturation: value / 100 })}
            />
            <SliderField
              label="Hue"
              value={clip.filters.hueRotate}
              min={-180}
              max={180}
              format={value => `${value}°`}
              onChange={hueRotate => setFilters({ hueRotate })}
            />
            <SliderField
              label="Blur"
              value={clip.filters.blur}
              min={0}
              max={30}
              step={0.5}
              format={value => `${value}px`}
              onChange={blur => setFilters({ blur })}
            />
            <SliderField
              label="Grayscale"
              value={Math.round(clip.filters.grayscale * 100)}
              min={0}
              max={100}
              format={value => `${value}%`}
              onChange={value => setFilters({ grayscale: value / 100 })}
            />
          </Section>
        </>
      )}
    </>
  );
};

const TextControls = ({ clip, patch }: { clip: TextClip; patch: (changes: Partial<TextClip>) => void }) => {
  const fontOption = FONTS.find(option => option.value === clip.fontFamily) ?? FONTS[0];

  return (
    <>
      <Section title="Content">
        <NTextarea
          value={clip.text}
          onChange={event => patch({ text: event.target.value, name: event.target.value.split('\n')[0].slice(0, 24) || 'Text' })}
          placeholder="Type your caption…"
          className="mb-2"
          textareaClassName="min-h-20 text-sm"
          aria-label="Text content"
        />
        <NSelect
          label="Font"
          value={fontOption}
          options={FONTS}
          className="mb-2"
          onChange={option => option && patch({ fontFamily: option.value })}
        />

        <div className="mb-2 flex gap-1.5">
          <ToggleChip active={clip.bold} onClick={() => patch({ bold: !clip.bold })} label="Bold">
            <Bold className="h-3.5 w-3.5" />
          </ToggleChip>
          <ToggleChip active={clip.italic} onClick={() => patch({ italic: !clip.italic })} label="Italic">
            <Italic className="h-3.5 w-3.5" />
          </ToggleChip>
          <div className="mx-1 w-px bg-separator" />
          {(['left', 'center', 'right'] as TextAlign[]).map(align => (
            <ToggleChip key={align} active={clip.align === align} onClick={() => patch({ align })} label={`Align ${align}`}>
              {align === 'left' ? (
                <AlignLeft className="h-3.5 w-3.5" />
              ) : align === 'center' ? (
                <AlignCenter className="h-3.5 w-3.5" />
              ) : (
                <AlignRight className="h-3.5 w-3.5" />
              )}
            </ToggleChip>
          ))}
        </div>
      </Section>

      <Section title="Style">
        <SliderField
          label="Size"
          value={Math.round(clip.fontSize * 1000)}
          min={10}
          max={300}
          format={value => `${(value / 10).toFixed(1)}%`}
          onChange={value => patch({ fontSize: value / 1000 })}
        />
        <div className="mb-2 grid grid-cols-2 gap-2">
          <ColorField label="Text" value={clip.color} onChange={color => patch({ color })} />
          <ColorField
            label="Background"
            value={clip.backgroundColor === 'transparent' ? '#000000' : clip.backgroundColor}
            onChange={backgroundColor => patch({ backgroundColor })}
          />
        </div>
        <NSwitch
          label="Transparent background"
          enabled={clip.backgroundColor === 'transparent'}
          onChange={enabled => patch({ backgroundColor: enabled ? 'transparent' : '#000000' })}
          className="py-1"
        />
        <SliderField
          label="Outline"
          value={clip.strokeWidth}
          min={0}
          max={10}
          step={0.5}
          format={value => (value === 0 ? 'None' : String(value))}
          onChange={strokeWidth => patch({ strokeWidth })}
        />
        {clip.strokeWidth > 0 && <ColorField label="Outline colour" value={clip.strokeColor} onChange={strokeColor => patch({ strokeColor })} />}
      </Section>

      <Section title="Position">
        <SliderField
          label="Position X"
          value={Math.round(clip.x * 100)}
          min={-50}
          max={50}
          format={value => `${value}%`}
          onChange={value => patch({ x: value / 100 })}
        />
        <SliderField
          label="Position Y"
          value={Math.round(clip.y * 100)}
          min={-50}
          max={50}
          format={value => `${value}%`}
          onChange={value => patch({ y: value / 100 })}
        />
      </Section>
    </>
  );
};

const Section = ({ title, onReset, children }: { title: string; onReset?: () => void; children: React.ReactNode }) => (
  <section className="mb-4">
    <div className="mb-1.5 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {onReset && (
        <NTooltip message={`Reset ${title.toLowerCase()}`}>
          <button type="button" onClick={onReset} aria-label={`Reset ${title}`} className="rounded p-0.5 text-muted hover:text-foreground">
            <RotateCcw className="h-3 w-3" />
          </button>
        </NTooltip>
      )}
    </div>
    {children}
  </section>
);

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/**
 * A slider emits a change on every pointer move, so the whole drag is bracketed
 * as one interaction — otherwise a single adjustment would fill the undo stack.
 */
const SliderField = ({ label, value, min, max, step = 1, format, onChange }: SliderFieldProps) => {
  const beginInteraction = useEditor(state => state.beginInteraction);
  const endInteraction = useEditor(state => state.endInteraction);

  return (
    <div
      className="mb-2"
      onPointerDown={() => {
        beginInteraction();
        window.addEventListener('pointerup', () => endInteraction(), { once: true });
      }}>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">{format(value)}</span>
      </div>
      <NSlider value={value} min={min} max={max} step={step} onChange={onChange} className="mb-0" aria-label={label} />
    </div>
  );
};

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div>
    <span className="mb-0.5 block text-[11px] text-muted">{label}</span>
    <input
      type="color"
      value={value}
      onChange={event => onChange(event.target.value)}
      aria-label={label}
      className="h-8 w-full cursor-pointer rounded border border-border bg-field-background"
    />
  </div>
);

const ToggleChip = ({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) => (
  <NTooltip message={label}>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'rounded border px-2 py-1 transition-colors',
        active ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:text-foreground'
      )}>
      {children}
    </button>
  </NTooltip>
);
