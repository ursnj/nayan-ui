import React, { memo } from 'react';
import { Control, Controller, FieldError, FieldValues, RegisterOptions } from 'react-hook-form';
import { cn } from '../lib/utils';
import { Input, InputProps } from './ui/input';
import { Label } from './ui/label';

export interface NFormInputProps<TFieldValues extends FieldValues = FieldValues> extends Omit<InputProps, 'name'> {
  id?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  control: Control<TFieldValues>;
  rules?: RegisterOptions;
  name: string;
  error?: FieldError;
}

const NFormInputComponent = <TFieldValues extends FieldValues = FieldValues>({
  control,
  rules,
  error,
  name,
  type = 'text',
  id = 'form-input',
  label = '',
  placeholder = '',
  className = '',
  labelClassName = '',
  inputClassName = '',
  ...remaining
}: NFormInputProps<TFieldValues>) => {
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <Controller
      control={control}
      name={name as any}
      rules={rules as any}
      render={({ field: { onChange, value, onBlur, ref } }) => (
        <div className={cn('nyn-form-input-block', className)}>
          {label && (
            <Label htmlFor={id} className={cn('nyn-form-input-label block pb-2 text-text', labelClassName)}>
              {label}
            </Label>
          )}
          <Input
            id={id}
            type={type}
            onChange={onChange}
            onBlur={onBlur}
            ref={ref}
            value={value ?? ''}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={!!rules?.required}
            className={cn('nyn-form-input w-full rounded bg-card border border-border text-text px-3 py-2', inputClassName)}
            {...remaining}
          />
          {error && (
            <div id={describedBy} role="alert" className="nyn-form-input-error text-xs text-red-600 mt-1">
              {error.message}
            </div>
          )}
        </div>
      )}
    />
  );
};

export const NFormInput = memo(NFormInputComponent) as typeof NFormInputComponent;
