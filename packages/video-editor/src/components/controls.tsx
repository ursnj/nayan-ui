import { useCallback, useState } from 'react';
import { NSlider, NTooltip } from '@nayan-ui/react';
import { ChevronDown, Diamond, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEditor } from '../store/editor';

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}

/** Collapsible inspector group. Sections remember their state per mount. */
export const Section = ({ title, icon, defaultOpen = true, onReset, children }: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border/60 last:border-b-0">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex flex-1 items-center gap-1.5 text-left">
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', !open && '-rotate-90')} />
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</span>
        </button>
        {onReset && (
          <NTooltip message={`Reset ${title.toLowerCase()}`}>
            <button
              type="button"
              onClick={onReset}
              aria-label={`Reset ${title}`}
              className="rounded p-1 text-muted transition-colors hover:bg-default hover:text-foreground">
              <RotateCcw className="h-3 w-3" />
            </button>
          </NTooltip>
        )}
      </div>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
};

export const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <span className="shrink-0 text-[11px] text-muted">{label}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ *
 * Keyframe toggle
 * ------------------------------------------------------------------ */

interface KeyframeButtonProps {
  clipId: string;
  path: string;
  value: number;
  /** True when the property has any keys at all. */
  animated: boolean;
  /** True when a key sits exactly under the playhead. */
  active: boolean;
}

/**
 * The diamond every NLE puts beside an animatable property: filled when a key
 * exists at the playhead, outlined when the track is animated elsewhere.
 */
export const KeyframeButton = ({ clipId, path, value, animated, active }: KeyframeButtonProps) => {
  const toggleKeyframe = useEditor(state => state.toggleKeyframe);
  const clearKeyframes = useEditor(state => state.clearKeyframes);

  return (
    <NTooltip message={active ? 'Remove keyframe' : animated ? 'Add keyframe (alt-click to clear track)' : 'Add keyframe'}>
      <button
        type="button"
        aria-label={`Keyframe ${path}`}
        aria-pressed={active}
        onClick={event => {
          if (event.altKey && animated) clearKeyframes(clipId, path);
          else toggleKeyframe(clipId, path, value);
        }}
        className={cn(
          'shrink-0 rounded p-0.5 transition-colors',
          active ? 'text-accent' : animated ? 'text-accent/50 hover:text-accent' : 'text-muted/40 hover:text-muted'
        )}>
        <Diamond className={cn('h-3 w-3', active && 'fill-current')} />
      </button>
    </NTooltip>
  );
};

/* ------------------------------------------------------------------ *
 * Slider
 * ------------------------------------------------------------------ */

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  /** Enables the keyframe diamond for this property. */
  keyframe?: { clipId: string; path: string; animated: boolean; active: boolean };
  /** Double-clicking the readout resets to this. */
  resetTo?: number;
}

/**
 * A slider emits a change on every pointer move, so the whole drag is bracketed
 * as one interaction — otherwise a single adjustment would fill the undo stack.
 */
export const SliderField = ({ label, value, min, max, step = 1, format, onChange, keyframe, resetTo }: SliderFieldProps) => {
  const beginInteraction = useEditor(state => state.beginInteraction);
  const endInteraction = useEditor(state => state.endInteraction);

  const onPointerDown = useCallback(() => {
    beginInteraction();
    window.addEventListener('pointerup', () => endInteraction(), { once: true });
  }, [beginInteraction, endInteraction]);

  const display = format ? format(value) : String(Math.round(value * 100) / 100);

  return (
    <div className="mb-2" onPointerDown={onPointerDown}>
      <div className="mb-1 flex items-center gap-1.5">
        {keyframe && (
          <KeyframeButton clipId={keyframe.clipId} path={keyframe.path} value={value} animated={keyframe.animated} active={keyframe.active} />
        )}
        <span className="flex-1 truncate text-[11px] text-muted">{label}</span>
        <button
          type="button"
          onDoubleClick={() => resetTo !== undefined && onChange(resetTo)}
          title={resetTo !== undefined ? 'Double-click to reset' : undefined}
          className="font-mono text-[11px] tabular-nums text-foreground">
          {display}
        </button>
      </div>
      <NSlider value={value} min={min} max={max} step={step} onChange={onChange} className="mb-0" aria-label={label} />
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

export const ColorField = ({
  label,
  value,
  onChange,
  allowAlpha
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowAlpha?: boolean;
}) => {
  // <input type="color"> can't express alpha, so rgba() values are shown as
  // their opaque equivalent and the transparency toggle lives elsewhere.
  const swatch = value.startsWith('rgba') || value === 'transparent' ? '#000000' : value;
  return (
    <div className="mb-2">
      <span className="mb-1 block text-[11px] text-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={swatch}
          onChange={event => onChange(event.target.value)}
          aria-label={label}
          className="h-7 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          aria-label={`${label} value`}
          spellCheck={false}
          className="min-w-0 flex-1 rounded border border-border bg-field-background px-2 py-1 font-mono text-[11px] text-field-foreground outline-none focus:border-accent"
        />
        {allowAlpha && (
          <NTooltip message="Transparent">
            <button
              type="button"
              onClick={() => onChange('transparent')}
              aria-label="Set transparent"
              className={cn(
                'checkerboard h-7 w-7 shrink-0 rounded border transition-colors',
                value === 'transparent' ? 'border-accent' : 'border-border'
              )}
            />
          </NTooltip>
        )}
      </div>
    </div>
  );
};

export const NumberField = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) => (
  <label className="mb-2 flex items-center gap-2">
    <span className="flex-1 text-[11px] text-muted">{label}</span>
    <span className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
        className="w-20 rounded border border-border bg-field-background px-2 py-1 text-right font-mono text-[11px] tabular-nums text-field-foreground outline-none focus:border-accent"
      />
      {suffix && <span className="w-4 text-[10px] text-muted">{suffix}</span>}
    </span>
  </label>
);

export const TextField = ({
  label,
  value,
  placeholder,
  onChange,
  multiline
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) => {
  const shared =
    'w-full rounded border border-border bg-field-background px-2 py-1.5 text-xs text-field-foreground outline-none transition-colors focus:border-accent placeholder:text-field-placeholder';
  return (
    <div className="mb-2">
      {label && <span className="mb-1 block text-[11px] text-muted">{label}</span>}
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          aria-label={label}
          rows={3}
          className={cn(shared, 'resize-y')}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          aria-label={label}
          className={shared}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

export const ToggleChip = ({
  active,
  onClick,
  label,
  children,
  className
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <NTooltip message={label}>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex items-center justify-center rounded-md border px-2 py-1.5 text-[11px] transition-colors',
        active ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:border-separator hover:text-foreground',
        className
      )}>
      {children}
    </button>
  </NTooltip>
);

/** Compact icon button used across toolbars. */
export const IconButton = ({
  label,
  onClick,
  active,
  disabled,
  danger,
  children,
  className
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <NTooltip message={label}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        disabled && 'cursor-not-allowed opacity-35',
        !disabled && active && 'bg-accent/20 text-accent',
        !disabled && !active && !danger && 'text-muted hover:bg-default hover:text-foreground',
        !disabled && danger && 'text-muted hover:bg-danger hover:text-danger-foreground',
        className
      )}>
      {children}
    </button>
  </NTooltip>
);

/** Segmented control — used for alignment, tools and blend groups. */
export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  className
}: {
  value: T;
  options: { value: T; label: React.ReactNode; title: string }[];
  onChange: (value: T) => void;
  className?: string;
}) => (
  <div className={cn('flex gap-0.5 rounded-md bg-surface-secondary p-0.5', className)} role="group">
    {options.map(option => (
      <NTooltip key={option.value} message={option.title}>
        <button
          type="button"
          onClick={() => onChange(option.value)}
          aria-label={option.title}
          aria-pressed={value === option.value}
          className={cn(
            'flex flex-1 items-center justify-center rounded px-2 py-1 text-[11px] transition-colors',
            value === option.value ? 'bg-surface text-foreground elevate' : 'text-muted hover:text-foreground'
          )}>
          {option.label}
        </button>
      </NTooltip>
    ))}
  </div>
);

/** Native select styled to match the rest of the inspector. */
export const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) => (
  <div className="mb-2">
    {label && <span className="mb-1 block text-[11px] text-muted">{label}</span>}
    <div className="relative">
      <select
        value={value}
        onChange={event => onChange(event.target.value as T)}
        aria-label={label}
        className="w-full appearance-none rounded border border-border bg-field-background py-1.5 pl-2 pr-7 text-xs text-field-foreground outline-none transition-colors focus:border-accent">
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </div>
  </div>
);

export const EmptyState = ({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    <div className="text-muted/50">{icon}</div>
    <p className="text-xs font-medium text-foreground">{title}</p>
    {hint && <p className="text-[11px] leading-relaxed text-muted">{hint}</p>}
  </div>
);
