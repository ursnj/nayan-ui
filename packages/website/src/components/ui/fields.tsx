'use client';

import {
  NCheck as EngineCheck,
  NInput as EngineInput,
  NSelect as EngineSelect,
  NSlider as EngineSlider,
  NTextarea as EngineTextarea,
  NText,
  NView,
  type ComponentInputProps,
  type ComponentOption
} from 'nayan-ui/components';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from './controls';

type FieldFrame = {
  label?: ReactNode;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: ReactNode;
  helperText?: ReactNode;
  isRequired?: boolean;
  isReadOnly?: boolean;
};
const field =
  'block h-9 w-full min-w-0 rounded-lg border border-default bg-field-background px-3 py-2 text-sm text-field-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50';

function Frame({ id, label, labelClassName, wrapperClassName, error, helperText, children }: FieldFrame & { id: string; children: ReactNode }) {
  return (
    <NView className={cn('min-w-0', wrapperClassName)}>
      {label && (
        <NView tag="label" htmlFor={id} className={cn('mb-1 block text-sm font-medium', labelClassName)}>
          {label}
        </NView>
      )}
      {children}
      {(error || helperText) && (
        <NText id={`${id}-description`} className={cn('mt-1 block text-xs', error ? 'text-danger' : 'text-muted')}>
          {error ?? helperText}
        </NText>
      )}
    </NView>
  );
}

export function NInput({
  id,
  label,
  labelClassName,
  wrapperClassName,
  inputClassName,
  className,
  error,
  helperText,
  isRequired,
  isReadOnly,
  ...props
}: FieldFrame & ComponentPropsWithRef<'input'> & { inputClassName?: string }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Frame id={inputId} {...{ label, labelClassName, wrapperClassName: cn(className, wrapperClassName), error, helperText }}>
      <EngineInput
        {...(props as ComponentInputProps)}
        id={inputId}
        required={isRequired ?? props.required}
        readOnly={isReadOnly ?? props.readOnly}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={error || helperText ? `${inputId}-description` : props['aria-describedby']}
        className={cn(field, inputClassName)}
      />
    </Frame>
  );
}

export function NTextarea({
  id,
  label,
  labelClassName,
  wrapperClassName,
  textareaClassName,
  className,
  error,
  helperText,
  isRequired,
  isReadOnly,
  ...props
}: FieldFrame & ComponentPropsWithRef<'textarea'> & { textareaClassName?: string }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Frame id={inputId} {...{ label, labelClassName, wrapperClassName: cn(className, wrapperClassName), error, helperText }}>
      <EngineTextarea
        {...(props as ComponentInputProps)}
        id={inputId}
        required={isRequired ?? props.required}
        readOnly={isReadOnly ?? props.readOnly}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={error || helperText ? `${inputId}-description` : props['aria-describedby']}
        className={cn(field, 'h-auto min-h-20', textareaClassName)}
      />
    </Frame>
  );
}

export type ReactSelectOption = ComponentOption;

export function NSelect<Option extends ComponentOption = ComponentOption>({
  label,
  options,
  items,
  value,
  onChange,
  onChangeOptions,
  className,
  labelClassName,
  selectClassName,
  inputId,
  ...props
}: {
  label?: string;
  options?: Option[];
  items?: Option[];
  value: Option | null;
  onChange?: (value: Option | null) => void;
  onChangeOptions?: (value: Option | null) => void;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  name?: string;
  'aria-label'?: string;
}) {
  const generated = useId();
  const id = inputId ?? generated;
  return (
    <Frame id={id} label={label} labelClassName={labelClassName} wrapperClassName={className}>
      <EngineSelect<Option>
        {...props}
        id={id}
        label={label}
        options={options ?? items ?? []}
        value={value?.value ?? null}
        onChangeOptions={onChangeOptions ?? onChange}
        className={cn(field, selectClassName)}
      />
    </Frame>
  );
}

export function NCheck({
  id,
  checked,
  disabled,
  onChange,
  children,
  label,
  className,
  ...props
}: {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
  label?: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <NView tag="label" htmlFor={inputId} className={cn('flex cursor-pointer items-center gap-2 text-sm', className)}>
      <EngineCheck {...props} id={inputId} checked={checked} disabled={disabled} onChange={onChange} className="size-4 accent-accent" />
      {label ?? children}
    </NView>
  );
}

export function NSlider({
  id,
  label,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  onChange,
  showOutput,
  output,
  className,
  sliderClassName,
  labelClassName,
  ...props
}: {
  id?: string;
  label?: ReactNode;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  showOutput?: boolean;
  output?: (value: number) => ReactNode;
  className?: string;
  sliderClassName?: string;
  labelClassName?: string;
  orientation?: string;
  'aria-label'?: string;
}) {
  const generated = useId();
  const inputId = id ?? generated;
  const current = value ?? defaultValue ?? min;
  return (
    <Frame id={inputId} label={label} labelClassName={labelClassName} wrapperClassName={className}>
      <EngineSlider
        aria-label={props['aria-label'] ?? (typeof label === 'string' ? label : 'Value')}
        id={inputId}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onValueChange={onChange}
        className={cn('w-full min-w-0 accent-accent', sliderClassName)}
      />
      {showOutput && (
        <NView tag="output" htmlFor={inputId} className="text-xs text-muted">
          {output?.(current) ?? current}
        </NView>
      )}
    </Frame>
  );
}

export function NNumberField({
  minValue,
  maxValue,
  value,
  defaultValue,
  onChange,
  label,
  className,
  step,
  disabled,
  'aria-label': ariaLabel
}: {
  fullWidth?: boolean;
  'aria-label'?: string;
  minValue?: number;
  maxValue?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
  step?: number;
  disabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}) {
  return (
    <NInput
      type="number"
      aria-label={ariaLabel}
      {...{ label, className, step, disabled }}
      min={minValue}
      max={maxValue}
      value={value === undefined ? undefined : String(value)}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      onChange={(event) => {
        if (Number.isFinite(event.currentTarget.valueAsNumber)) onChange?.(event.currentTarget.valueAsNumber);
      }}
    />
  );
}

export function NSearchField({
  onChange,
  onClear,
  ...props
}: {
  onClear?: () => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
  className?: string;
  fullWidth?: boolean;
  'aria-label'?: string;
}) {
  const { fullWidth: _fullWidth, ...input } = props;
  return (
    <NInput
      {...input}
      type="search"
      onChange={(event) => {
        const value = event.currentTarget.value;
        onChange?.(value);
        if (!value) onClear?.();
      }}
    />
  );
}

export function NRadioGroup({
  items,
  value,
  onChange,
  label,
  orientation,
  className
}: {
  items: { value: string; label: ReactNode; disabled?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  orientation?: string;
  className?: string;
}) {
  const name = useId();
  return (
    <NView tag="fieldset" className={className}>
      {label && <NView tag="legend" className="mb-1 text-sm font-medium">{label}</NView>}
      <NView tag="div" className={cn('flex gap-2', orientation === 'horizontal' ? 'flex-row' : 'flex-col')}>
        {items.map((item) => (
          <NView tag="label" key={item.value} className="flex items-center gap-2 text-sm">
            <NView tag="input"
              type="radio"
              name={name}
              value={item.value}
              checked={value === item.value}
              disabled={item.disabled}
              onChange={() => onChange(item.value)}
              className="accent-accent"
            />
            {item.label}
          </NView>
        ))}
      </NView>
    </NView>
  );
}
