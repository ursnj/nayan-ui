import React, { memo } from 'react';
import { Control, Controller, FieldValues, FieldError as RHFFieldError, RegisterOptions } from 'react-hook-form';
import { FieldError, Input, Label, TextField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NFormInputProps<TFieldValues extends FieldValues = FieldValues> {
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
  error?: RHFFieldError;
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
  inputClassName = ''
}: NFormInputProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name as any}
      rules={rules as any}
      render={({ field: { onChange, value, onBlur, ref } }) => (
        <TextField
          id={id}
          name={name}
          type={type}
          isRequired={!!rules?.required}
          isInvalid={!!error}
          className={cn('nyn-form-input-block', className)}>
          {label && <Label className={cn('nyn-form-input-label', labelClassName)}>{label}</Label>}
          <Input
            ref={ref}
            placeholder={placeholder}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            className={cn('nyn-form-input', inputClassName)}
          />
          {error && <FieldError>{error.message}</FieldError>}
        </TextField>
      )}
    />
  );
};

export const NFormInput = memo(NFormInputComponent) as typeof NFormInputComponent;
