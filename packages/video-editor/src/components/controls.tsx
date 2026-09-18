import { useCallback, useState } from 'react';
import { NInput, NNumberField, NSelect, NSlider, NTextarea, NToggleButton, NTooltip } from '@nayan-ui/react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEditor } from '../store/editor';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  onReset?: () => void;
  children: React.ReactNode;
}

export const Section = ({ title, icon, onReset, children }: SectionProps) => {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-b border-border/60 last:border-b-0">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex flex-1 items-center gap-1.5 text-left">
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', !open && '-rotate-90')} />
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</span>
        </button>
        {onReset && (
          <IconButton label={`Reset ${title.toLowerCase()}`} onClick={onReset}>
            <RotateCcw className="h-3 w-3" />
          </IconButton>
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

export const EmptyState = ({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    <div className="text-muted/50">{icon}</div>
    <p className="text-xs font-medium text-foreground">{title}</p>
    {hint && <p className="text-[11px] leading-relaxed text-muted">{hint}</p>}
  </div>
);

export const IconButton = ({
  label,
  onClick,
  active = false,
  disabled,
  danger,
  children,
  className
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Tints the hover state for destructive actions. */
  danger?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <NTooltip message={label}>
    <NToggleButton
      isSelected={active}
      disabled={disabled}
      isIconOnly
      variant="ghost"
      size="sm"
      onChange={onClick}
      aria-label={label}
      className={cn('h-7 w-7 shrink-0', danger && 'hover:bg-danger hover:text-danger-foreground', className)}>
      {children}
    </NToggleButton>
  </NTooltip>
);

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
    <NToggleButton isSelected={active} variant="default" size="sm" onChange={onClick} aria-label={label} className={cn('text-[11px]', className)}>
      {children}
    </NToggleButton>
  </NTooltip>
);

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  disabled,
  framed = false,
  className
}: {
  /** No segment is lit when the value is null — a mixed or empty selection. */
  value: T | null;
  options: { value: T; label: React.ReactNode; title: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  framed?: boolean;
  className?: string;
}) => (
  <div className={cn('flex gap-0.5 rounded-md', framed && 'bg-surface-secondary p-0.5', className)} role="group">
    {options.map(option => (
      <NTooltip key={option.value} message={option.title}>
        <NToggleButton
          isSelected={value === option.value}
          disabled={disabled}
          isIconOnly
          variant="ghost"
          size="sm"
          onChange={() => onChange(option.value)}
          aria-label={option.title}
          className={cn('flex-1', framed ? 'h-6' : 'h-7')}>
          {option.label}
        </NToggleButton>
      </NTooltip>
    ))}
  </div>
);

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  /** Double-clicking the readout resets to this. */
  resetTo?: number;
}

export const SliderField = ({ label, value, min, max, step = 1, format, onChange, resetTo }: SliderFieldProps) => {
  const beginInteraction = useEditor(state => state.beginInteraction);
  const endInteraction = useEditor(state => state.endInteraction);

  const onPointerDown = useCallback(() => {
    beginInteraction();
    const finish = () => {
      endInteraction();
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, [beginInteraction, endInteraction]);

  const display = format ? format(value) : String(Math.round(value * 100) / 100);

  return (
    <div className="mb-2" onPointerDown={onPointerDown}>
      <div className="mb-1 flex items-center gap-1.5">
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

export const NumberField = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) => (
  <NNumberField
    label={label}
    value={value}
    minValue={min}
    maxValue={max}
    step={step}
    onChange={onChange}
    fullWidth
    className="mb-2"
    aria-label={label}
  />
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
}) =>
  multiline ? (
    <div data-clarity-mask="true">
      <NTextarea
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="mb-2"
        textareaClassName="min-h-20 text-xs"
      />
    </div>
  ) : (
    <NInput
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      wrapperClassName="mb-2"
      inputClassName="h-[var(--field-height)] text-xs"
    />
  );

export const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange,
  disabled
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) => (
  <NSelect
    label={label}
    value={options.find(option => option.value === value) ?? null}
    options={options}
    disabled={disabled}
    isSearchable={false}
    className="mb-2"
    onChange={option => option && onChange(option.value as T)}
  />
);

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
          className="h-[var(--field-height)] w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
        <NInput
          value={value}
          onChange={event => onChange(event.target.value)}
          label={undefined}
          wrapperClassName="mb-0 flex-1 min-w-0"
          inputClassName="h-[var(--field-height)] font-mono text-[11px]"
        />
        {allowAlpha && (
          <NTooltip message="Transparent">
            <button
              type="button"
              onClick={() => onChange('transparent')}
              aria-label="Set transparent"
              className={cn(
                'checkerboard h-[var(--field-height)] w-8 shrink-0 rounded border transition-colors',
                value === 'transparent' ? 'border-accent' : 'border-border'
              )}
            />
          </NTooltip>
        )}
      </div>
    </div>
  );
};
