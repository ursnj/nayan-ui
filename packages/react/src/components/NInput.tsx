import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';

export interface NInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id?: string;
  label?: ReactNode;
  labelClassName?: string;
  inputClassName?: string;
  wrapperClassName?: string;
  error?: ReactNode;
  helperText?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NInput = React.memo(
  forwardRef<HTMLInputElement, NInputProps>(
    (
      {
        id,
        label,
        labelClassName = '',
        inputClassName = '',
        wrapperClassName = '',
        error,
        helperText,
        className = '',
        type = 'text',
        onChange,
        ...rest
      },
      ref
    ) => {
      const inputId = id || `ninput-${Math.random().toString(36).slice(2, 10)}`;
      const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;
      return (
        <div className={cn('nyn-input-block mb-3', wrapperClassName, className)}>
          {label && (
            <Label htmlFor={inputId} className={cn('nyn-input-label block pb-2 text-text', labelClassName)}>
              {label}
            </Label>
          )}
          <Input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={onChange}
            className={cn('nyn-input w-full rounded bg-card border border-border text-text px-3 py-2', inputClassName)}
            {...rest}
          />
          {error ? (
            <div id={`${inputId}-error`} className="mt-1 text-xs text-red-600" role="alert">
              {error}
            </div>
          ) : helperText ? (
            <div id={`${inputId}-helper`} className="mt-1 text-xs text-muted">
              {helperText}
            </div>
          ) : null}
        </div>
      );
    }
  )
);

NInput.displayName = 'NInput';
