import { useCallback } from 'react';
import { NCheck } from '@nayan-ui/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Aperture,
  Crop as CropIcon,
  Layers,
  Move,
  Palette,
  Sparkles,
  Sun,
  Type as TypeIcon,
  Volume2,
  Wand2
} from 'lucide-react';
import { cn, formatTimecode } from '../../lib/utils';
import { primarySelectedClip, useEditor } from '../../store/editor';
import {
  COLOR_PRESETS,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  TRANSITION_LABELS,
  US,
  blendColor,
  clipEndUs,
  isMediaClip,
  isTextClip
} from '../../types';
import type { Clip, ColorPreset, MediaClip, TextAlign, TextAnimation, TextClip, TransitionKind } from '../../types';
import { ColorField, EmptyState, FieldRow, Section, SegmentedControl, SelectField, SliderField, TextField, ToggleChip } from '../controls';

/**
 * Speed runs from half to five times, in half steps.
 *
 * The step is what makes the slider usable without presets beside it: every
 * stop is a speed someone would ask for by name, and there is no way to land
 * on 1.03× while aiming for normal.
 */
const SPEED_MIN = 0.5;
const SPEED_MAX = 6;
const SPEED_STEP = 0.5;

/**
 * The type shelf: families the machine already has, never a web font.
 *
 * Canvas draws with whatever is installed at that instant and falls back
 * silently when a family is missing, so a downloaded font that hadn't arrived
 * yet would export in a different typeface than the one on screen — with
 * nothing to say so. Everything here is present on a stock Windows or macOS
 * install, and each stack names the Windows face, the macOS face and a
 * metric-compatible Linux substitute before giving up to a generic, so a
 * missing font degrades to something of the same shape rather than to Arial.
 *
 * Multi-word names are quoted because `context.font` takes a CSS font
 * shorthand: an unquoted `Trebuchet MS` makes the whole declaration invalid,
 * and canvas responds by keeping the previous font instead of raising.
 *
 * The first five values are kept byte-for-byte as they shipped. They are
 * stored on every text clip ever made, and rewriting them would leave the
 * picker blank on projects that already use them.
 */
const FONTS = [
  // Sans
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', label: 'System' },
  { value: '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif', label: 'Helvetica' },
  { value: 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif', label: 'Arial' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, "DejaVu Sans", sans-serif', label: 'Tahoma' },
  { value: '"Trebuchet MS", "Lucida Grande", "DejaVu Sans", sans-serif', label: 'Trebuchet' },
  { value: '"Lucida Sans Unicode", "Lucida Grande", "DejaVu Sans", sans-serif', label: 'Lucida Sans' },
  { value: 'Futura, "Century Gothic", "URW Gothic", "Trebuchet MS", sans-serif', label: 'Futura' },
  { value: '"Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif', label: 'Gill Sans' },

  // Display — the weight and width a title card wants
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: '"Arial Black", "Arial Bold", Gadget, "DejaVu Sans Bold", sans-serif', label: 'Arial Black' },
  { value: '"Arial Narrow", "Liberation Sans Narrow", "Nimbus Sans Narrow", sans-serif', label: 'Arial Narrow' },

  // Serif
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, "Liberation Serif", serif', label: 'Times New Roman' },
  { value: 'Palatino, "Palatino Linotype", "Book Antiqua", "URW Palladio L", serif', label: 'Palatino' },
  { value: 'Garamond, "Apple Garamond", "URW Garamond", "Times New Roman", serif', label: 'Garamond' },
  { value: 'Baskerville, "Baskerville Old Face", "Libre Baskerville", Georgia, serif', label: 'Baskerville' },
  { value: 'Didot, "Bodoni MT", "Playfair Display", Georgia, serif', label: 'Didot' },

  // Mono
  { value: '"Courier New", monospace', label: 'Courier' },
  { value: 'Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace', label: 'Menlo' },

  // Hand
  { value: '"Brush Script MT", "Segoe Script", "Bradley Hand", cursive', label: 'Brush Script' },
  { value: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive', label: 'Comic Sans' }
];

export const Inspector = () => {
  const clip = useEditor(primarySelectedClip);
  const selectionCount = useEditor(state => state.selectedClipIds.length);
  const updateClip = useEditor(state => state.updateClip);

  const patch = useCallback(
    (changes: Partial<Clip>) => {
      if (!clip) return;
      updateClip(clip.id, changes);
    },
    [clip, updateClip]
  );

  return (
    <aside className="island flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h2 className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Properties</h2>
        {selectionCount > 1 && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">{selectionCount} selected</span>}
      </header>

      {!clip ? (
        <EmptyState icon={<Layers className="h-8 w-8" />} title="Nothing selected" hint="Pick a clip on the timeline to edit it." />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ClipHeader clip={clip} />
          <BasicsSection clip={clip} patch={patch} />
          {isTextClip(clip) && <TextSection clip={clip} patch={patch} />}
          {clip.kind !== 'audio' && (
            <>
              <TransformSection clip={clip} patch={patch} />
              <FilterSection clip={clip} patch={patch} />
              <ColorSection clip={clip} patch={patch} />
              <CropSection clip={clip} patch={patch} />
            </>
          )}
          {isMediaClip(clip) && clip.kind !== 'image' && <AudioSection clip={clip} patch={patch} />}
          {isMediaClip(clip) && clip.kind === 'video' && <ChromaSection clip={clip} patch={patch} />}
          <TransitionSection clip={clip} />
        </div>
      )}
    </aside>
  );
};

type Patch = (changes: Partial<Clip>) => void;

const ClipHeader = ({ clip }: { clip: Clip }) => (
  <div className="border-b border-border px-3 py-2.5">
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: clip.color }} />
      <p data-clarity-mask="true" className="min-w-0 flex-1 truncate text-xs font-medium text-foreground" title={clip.name}>
        {clip.name}
      </p>
      <span className="shrink-0 rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] capitalize text-muted">{clip.kind}</span>
    </div>
    <p className="mt-1 font-mono text-[10px] tabular-nums text-muted">
      {formatTimecode(clip.startUs)} → {formatTimecode(clipEndUs(clip))} · {(clip.durationUs / US).toFixed(2)}s
    </p>
  </div>
);

/** Opacity, fades and speed — reached for on almost every clip. */
const BasicsSection = ({ clip, patch }: { clip: Clip; patch: Patch }) => {
  const maxFadeMs = Math.min(3000, clip.durationUs / 1000);
  const media = isMediaClip(clip) && clip.kind !== 'image' ? clip : null;

  /*
   * Snapped to the nearest half step before it is stored: a slider is free to
   * hand back 2.0000000000000004, and that reaches the clip badge on the
   * timeline, the readout above and every project file saved afterwards.
   */
  const setSpeed = (next: number) => {
    if (!media) return;
    const speed = Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(next / SPEED_STEP) * SPEED_STEP));
    patch({
      speed,
      // Hold the same source range: faster playback, shorter clip. Reading the
      // old pair is safe mid-drag even if a render is skipped, because their
      // product — the source range — is what this preserves.
      durationUs: Math.max(100_000, Math.round((media.durationUs * media.speed) / speed))
    } as Partial<Clip>);
  };

  return (
    <Section title="Basics" icon={<Move className="h-3.5 w-3.5 text-muted" />}>
      <SliderField
        label="Opacity"
        value={Math.round(clip.opacity * 100)}
        min={0}
        max={100}
        format={value => `${value}%`}
        onChange={value => patch({ opacity: value / 100 })}
        resetTo={100}
      />
      <SliderField
        label="Fade in"
        value={clip.fadeInUs / 1000}
        min={0}
        max={maxFadeMs}
        step={10}
        format={value => `${(value / 1000).toFixed(2)}s`}
        onChange={value => patch({ fadeInUs: value * 1000 })}
        resetTo={0}
      />
      <SliderField
        label="Fade out"
        value={clip.fadeOutUs / 1000}
        min={0}
        max={maxFadeMs}
        step={10}
        format={value => `${(value / 1000).toFixed(2)}s`}
        onChange={value => patch({ fadeOutUs: value * 1000 })}
        resetTo={0}
      />

      {media && (
        <>
          {/* Speed reads like Opacity and the fades above it: one label, one
              readout, one track. Half steps the whole way, so the values worth
              naming — half, double, five times — all land on a stop. */}
          <SliderField
            label="Speed"
            value={media.speed}
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={SPEED_STEP}
            format={value => `${value}×`}
            onChange={setSpeed}
            resetTo={1}
          />

          <NCheck
            id={`reverse-${clip.id}`}
            checked={media.reversed}
            onChange={reversed => patch({ reversed } as Partial<Clip>)}
            className="mb-2"
            labelClassName="text-[11px] text-foreground">
            Play backwards
          </NCheck>
        </>
      )}
    </Section>
  );
};

const TransformSection = ({ clip, patch }: { clip: Clip; patch: Patch }) => {
  const t = clip.transform;
  const set = (changes: Partial<typeof t>) => patch({ transform: { ...t, ...changes } } as Partial<Clip>);

  return (
    <Section
      title="Transform"
      icon={<Move className="h-3.5 w-3.5 text-muted" />}
      onReset={() => patch({ transform: { ...DEFAULT_TRANSFORM } } as Partial<Clip>)}>
      <SliderField
        label="Scale"
        value={Math.round(t.scale * 100)}
        min={5}
        max={400}
        format={value => `${value}%`}
        onChange={value => set({ scale: value / 100 })}
        resetTo={100}
      />
      <SliderField
        label="Position X"
        value={Math.round(t.x * 100)}
        min={-100}
        max={100}
        format={value => `${value}%`}
        onChange={value => set({ x: value / 100 })}
        resetTo={0}
      />
      <SliderField
        label="Position Y"
        value={Math.round(t.y * 100)}
        min={-100}
        max={100}
        format={value => `${value}%`}
        onChange={value => set({ y: value / 100 })}
        resetTo={0}
      />
      <SliderField
        label="Rotation"
        value={t.rotation}
        min={-180}
        max={180}
        format={value => `${value}°`}
        onChange={rotation => set({ rotation })}
        resetTo={0}
      />
    </Section>
  );
};

/**
 * The look shelf.
 *
 * Applying a preset overwrites the grade outright and records which look it
 * was, so the strength slider below can keep re-deriving it. Any hand edit in
 * the Colour section clears that record, because the grade is no longer the
 * preset and pretending otherwise would let the strength slider silently
 * discard the user's work.
 */
const FilterSection = ({ clip, patch }: { clip: Clip; patch: Patch }) => {
  const active = clip.filter;

  const applyPreset = (preset: ColorPreset) => {
    if (preset.name === 'None') {
      patch({ colorAdjust: { ...DEFAULT_COLOR }, filter: null } as Partial<Clip>);
      return;
    }
    // Always full strength on pick, the way a filter shelf behaves everywhere
    // else: the tile chooses the look, the slider below adjusts it. Carrying a
    // previous strength over would make re-picking a look at 0% do nothing.
    patch({ colorAdjust: { ...preset.color }, filter: { name: preset.name, intensity: 1 } } as Partial<Clip>);
  };

  const setIntensity = (intensity: number) => {
    const preset = COLOR_PRESETS.find(option => option.name === active?.name);
    if (!preset) return;
    patch({ colorAdjust: blendColor(preset.color, intensity), filter: { name: preset.name, intensity } } as Partial<Clip>);
  };

  return (
    <Section title="Filters" icon={<Sparkles className="h-3.5 w-3.5 text-muted" />}>
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {COLOR_PRESETS.map(preset => {
          const selected = preset.name === 'None' ? active === null : active?.name === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-pressed={selected}
              title={preset.name}
              className={cn(
                'group overflow-hidden rounded-md border transition-colors',
                selected ? 'border-accent' : 'border-border hover:border-separator'
              )}>
              <span
                className="block h-7 w-full"
                style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})` }}
                aria-hidden
              />
              <span
                className={cn(
                  'block truncate px-1 py-0.5 text-[9px] leading-tight transition-colors',
                  selected ? 'text-accent' : 'text-muted group-hover:text-foreground'
                )}>
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <SliderField
          label="Strength"
          value={Math.round(active.intensity * 100)}
          min={0}
          max={100}
          format={value => `${value}%`}
          onChange={value => setIntensity(value / 100)}
          resetTo={100}
        />
      )}
    </Section>
  );
};

/** -100..100 sliders that read as a direction rather than a percentage. */
const signed = (value: number) => (value === 0 ? 'Off' : value > 0 ? `+${value}` : String(value));

const ColorSection = ({ clip, patch }: { clip: Clip; patch: Patch }) => {
  const color = clip.colorAdjust;
  // A hand edit means the grade is no longer the preset, so drop the record.
  const set = (changes: Partial<typeof color>) => patch({ colorAdjust: { ...color, ...changes }, filter: null } as Partial<Clip>);

  return (
    <>
      <Section
        title="Light"
        icon={<Sun className="h-3.5 w-3.5 text-muted" />}
        onReset={() =>
          patch({
            colorAdjust: { ...color, brightness: 1, contrast: 1, highlights: 0, shadows: 0, fade: 0 },
            filter: null
          } as Partial<Clip>)
        }>
        <SliderField
          label="Brightness"
          value={Math.round(color.brightness * 100)}
          min={20}
          max={200}
          format={value => `${value}%`}
          onChange={value => set({ brightness: value / 100 })}
          resetTo={100}
        />
        <SliderField
          label="Contrast"
          value={Math.round(color.contrast * 100)}
          min={0}
          max={200}
          format={value => `${value}%`}
          onChange={value => set({ contrast: value / 100 })}
          resetTo={100}
        />
        <SliderField
          label="Highlights"
          value={Math.round(color.highlights * 100)}
          min={-100}
          max={100}
          format={signed}
          onChange={value => set({ highlights: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Shadows"
          value={Math.round(color.shadows * 100)}
          min={-100}
          max={100}
          format={signed}
          onChange={value => set({ shadows: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Fade"
          value={Math.round(color.fade * 100)}
          min={0}
          max={100}
          format={value => (value === 0 ? 'Off' : `${value}%`)}
          onChange={value => set({ fade: value / 100 })}
          resetTo={0}
        />
      </Section>

      <Section
        title="Colour"
        icon={<Palette className="h-3.5 w-3.5 text-muted" />}
        onReset={() =>
          patch({
            colorAdjust: { ...color, saturation: 1, vibrance: 0, temperature: 0, tint: 0, splitTone: 0, grayscale: 0 },
            filter: null
          } as Partial<Clip>)
        }>
        <SliderField
          label="Saturation"
          value={Math.round(color.saturation * 100)}
          min={0}
          max={300}
          format={value => `${value}%`}
          onChange={value => set({ saturation: value / 100 })}
          resetTo={100}
        />
        <SliderField
          label="Vibrance"
          value={Math.round(color.vibrance * 100)}
          min={-100}
          max={100}
          format={signed}
          onChange={value => set({ vibrance: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Temperature"
          value={Math.round(color.temperature * 100)}
          min={-100}
          max={100}
          format={value => (value === 0 ? 'Neutral' : value < 0 ? `${-value} cool` : `${value} warm`)}
          onChange={value => set({ temperature: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Tint"
          value={Math.round(color.tint * 100)}
          min={-100}
          max={100}
          format={value => (value === 0 ? 'Neutral' : value < 0 ? `${-value} green` : `${value} magenta`)}
          onChange={value => set({ tint: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Split tone"
          value={Math.round(color.splitTone * 100)}
          min={0}
          max={100}
          format={value => (value === 0 ? 'Off' : `${value}%`)}
          onChange={value => set({ splitTone: value / 100 })}
          resetTo={0}
        />
        {color.splitTone > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Shadows" value={color.shadowTint} onChange={shadowTint => set({ shadowTint })} />
            <ColorField label="Highlights" value={color.highlightTint} onChange={highlightTint => set({ highlightTint })} />
          </div>
        )}
      </Section>

      <Section
        title="Texture"
        icon={<Aperture className="h-3.5 w-3.5 text-muted" />}
        defaultOpen={false}
        onReset={() => patch({ colorAdjust: { ...color, sharpen: 0, vignette: 0, grain: 0, blur: 0 }, filter: null } as Partial<Clip>)}>
        <SliderField
          label="Sharpen"
          value={Math.round(color.sharpen * 100)}
          min={0}
          max={100}
          format={value => (value === 0 ? 'Off' : `${value}%`)}
          onChange={value => set({ sharpen: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Vignette"
          value={Math.round(color.vignette * 100)}
          min={0}
          max={100}
          format={value => (value === 0 ? 'Off' : `${value}%`)}
          onChange={value => set({ vignette: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Grain"
          value={Math.round(color.grain * 100)}
          min={0}
          max={100}
          format={value => (value === 0 ? 'Off' : `${value}%`)}
          onChange={value => set({ grain: value / 100 })}
          resetTo={0}
        />
        <SliderField
          label="Blur"
          value={color.blur}
          min={0}
          max={30}
          step={0.5}
          format={value => `${value}px`}
          onChange={blur => set({ blur })}
          resetTo={0}
        />
      </Section>
    </>
  );
};

const CROP_SIDES = ['top', 'right', 'bottom', 'left'] as const;

const CropSection = ({ clip, patch }: { clip: Clip; patch: Patch }) => {
  const crop = clip.crop;
  const set = (changes: Partial<typeof crop>) => patch({ crop: { ...crop, ...changes } } as Partial<Clip>);

  return (
    <Section
      title="Crop"
      icon={<CropIcon className="h-3.5 w-3.5 text-muted" />}
      defaultOpen={false}
      onReset={() => patch({ crop: { ...DEFAULT_CROP } } as Partial<Clip>)}>
      {CROP_SIDES.map(side => (
        <SliderField
          key={side}
          label={side.charAt(0).toUpperCase() + side.slice(1)}
          value={Math.round(crop[side] * 100)}
          min={0}
          max={90}
          format={value => `${value}%`}
          onChange={value => set({ [side]: value / 100 })}
          resetTo={0}
        />
      ))}
    </Section>
  );
};

const AudioSection = ({ clip, patch }: { clip: MediaClip; patch: Patch }) => (
  <Section title="Audio" icon={<Volume2 className="h-3.5 w-3.5 text-muted" />}>
    <SliderField
      label="Volume"
      value={Math.round(clip.volume * 100)}
      min={0}
      max={200}
      format={value => `${value}%`}
      onChange={value => patch({ volume: value / 100 } as Partial<Clip>)}
      resetTo={100}
    />
    <ToggleChip active={clip.muted} onClick={() => patch({ muted: !clip.muted } as Partial<Clip>)} label="Mute this clip" className="w-full">
      {clip.muted ? 'Muted' : 'Mute clip'}
    </ToggleChip>
  </Section>
);

const ChromaSection = ({ clip, patch }: { clip: MediaClip; patch: Patch }) => {
  const key = clip.chromaKey;
  const set = (changes: Partial<typeof key>) => patch({ chromaKey: { ...key, ...changes } } as Partial<Clip>);

  return (
    <Section title="Green screen" icon={<Wand2 className="h-3.5 w-3.5 text-muted" />} defaultOpen={false}>
      <ToggleChip active={key.enabled} onClick={() => set({ enabled: !key.enabled })} label="Remove the key colour" className="mb-2 w-full">
        {key.enabled ? 'Keying on' : 'Enable'}
      </ToggleChip>
      {key.enabled && (
        <>
          <ColorField label="Key colour" value={key.color} onChange={color => set({ color })} />
          <SliderField
            label="Similarity"
            value={Math.round(key.similarity * 100)}
            min={1}
            max={100}
            format={value => `${value}%`}
            onChange={value => set({ similarity: value / 100 })}
            resetTo={40}
          />
          <SliderField
            label="Edge softness"
            value={Math.round(key.smoothness * 100)}
            min={0}
            max={100}
            format={value => `${value}%`}
            onChange={value => set({ smoothness: value / 100 })}
            resetTo={10}
          />
          <SliderField
            label="Spill removal"
            value={Math.round(key.spill * 100)}
            min={0}
            max={100}
            format={value => `${value}%`}
            onChange={value => set({ spill: value / 100 })}
            resetTo={20}
          />
        </>
      )}
    </Section>
  );
};

const TextSection = ({ clip, patch }: { clip: TextClip; patch: Patch }) => {
  return (
    <Section title="Text" icon={<TypeIcon className="h-3.5 w-3.5 text-muted" />}>
      <TextField
        value={clip.text}
        multiline
        placeholder="Type your caption…"
        onChange={text => patch({ text, name: text.split('\n')[0].slice(0, 24) || 'Text' } as Partial<Clip>)}
      />
      <SelectField label="Font" value={clip.fontFamily} options={FONTS} onChange={fontFamily => patch({ fontFamily } as Partial<Clip>)} />

      <FieldRow label="Align">
        <SegmentedControl<TextAlign>
          value={clip.align}
          framed
          onChange={align => patch({ align } as Partial<Clip>)}
          options={[
            { value: 'left', label: <AlignLeft className="h-3.5 w-3.5" />, title: 'Align left' },
            { value: 'center', label: <AlignCenter className="h-3.5 w-3.5" />, title: 'Align centre' },
            { value: 'right', label: <AlignRight className="h-3.5 w-3.5" />, title: 'Align right' }
          ]}
        />
      </FieldRow>

      <SliderField
        label="Size"
        value={Math.round(clip.fontSize * 1000)}
        min={10}
        max={300}
        format={value => `${(value / 10).toFixed(1)}%`}
        onChange={value => patch({ fontSize: value / 1000 } as Partial<Clip>)}
        resetTo={80}
      />

      <div className="mb-2 flex gap-1.5">
        <ToggleChip
          active={clip.fontWeight >= 700}
          onClick={() => patch({ fontWeight: clip.fontWeight >= 700 ? 400 : 700 } as Partial<Clip>)}
          label="Bold"
          className="flex-1">
          Bold
        </ToggleChip>
        <ToggleChip active={clip.italic} onClick={() => patch({ italic: !clip.italic } as Partial<Clip>)} label="Italic" className="flex-1">
          Italic
        </ToggleChip>
      </div>

      <ColorField label="Text colour" value={clip.textColor} onChange={textColor => patch({ textColor } as Partial<Clip>)} />
      <ColorField
        label="Background"
        value={clip.backgroundColor}
        allowAlpha
        onChange={backgroundColor => patch({ backgroundColor } as Partial<Clip>)}
      />

      <SliderField
        label="Outline"
        value={clip.strokeWidth}
        min={0}
        max={10}
        step={0.5}
        format={value => (value === 0 ? 'None' : String(value))}
        onChange={strokeWidth => patch({ strokeWidth } as Partial<Clip>)}
        resetTo={0}
      />
      {clip.strokeWidth > 0 && (
        <ColorField label="Outline colour" value={clip.strokeColor} onChange={strokeColor => patch({ strokeColor } as Partial<Clip>)} />
      )}

      <SelectField
        label="Animation"
        value={clip.animation}
        options={[
          { value: 'none', label: 'None' },
          { value: 'fade', label: 'Fade in' },
          { value: 'rise', label: 'Rise up' },
          { value: 'pop', label: 'Pop' },
          { value: 'typewriter', label: 'Typewriter' }
        ]}
        onChange={(animation: TextAnimation) => patch({ animation } as Partial<Clip>)}
      />

      <SliderField
        label="Position X"
        value={Math.round(clip.x * 100)}
        min={-70}
        max={70}
        format={value => `${value}%`}
        onChange={value => patch({ x: value / 100 } as Partial<Clip>)}
        resetTo={0}
      />
      <SliderField
        label="Position Y"
        value={Math.round(clip.y * 100)}
        min={-70}
        max={70}
        format={value => `${value}%`}
        onChange={value => patch({ y: value / 100 } as Partial<Clip>)}
        resetTo={0}
      />
    </Section>
  );
};

const TransitionSection = ({ clip }: { clip: Clip }) => {
  const setTransition = useEditor(state => state.setTransition);
  const transition = clip.transitionIn;

  return (
    <Section title="Transition in" defaultOpen={false}>
      <SelectField
        label="Type"
        value={(transition?.kind ?? 'none') as TransitionKind | 'none'}
        options={[
          { value: 'none' as const, label: 'None' },
          ...(Object.keys(TRANSITION_LABELS) as TransitionKind[]).map(kind => ({ value: kind, label: TRANSITION_LABELS[kind] }))
        ]}
        onChange={value => setTransition(clip.id, value === 'none' ? null : (value as TransitionKind), transition?.durationUs ?? 500_000)}
      />
      {transition && (
        <SliderField
          label="Duration"
          value={transition.durationUs / 1000}
          min={100}
          max={Math.min(2000, clip.durationUs / 1000)}
          step={50}
          format={value => `${(value / 1000).toFixed(2)}s`}
          onChange={value => setTransition(clip.id, transition.kind, value * 1000)}
          resetTo={500}
        />
      )}
    </Section>
  );
};
