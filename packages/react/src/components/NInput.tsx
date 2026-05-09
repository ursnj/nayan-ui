import React, { ReactNode, forwardRef } from 'react';
import { Description, FieldError, Input, Label, TextField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NInputProps {
  id?: string;
  name?: string;
  label?: ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  error?: ReactNode;
  helperText?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NInput = React.memo(
  forwardRef<HTMLInputElement, NInputProps>(
    (
      {
        id,
        name,
        label,
        type = 'text',
        placeholder,
        value,
        defaultValue,
        isRequired = false,
        isDisabled = false,
        isReadOnly = false,
        className = '',
        wrapperClassName = '',
        labelClassName = '',
        inputClassName = '',
        error,
        helperText,
        onChange
      },
      ref
    ) => {
      return (
        <TextField
          id={id}
          name={name}
          type={type}
          isRequired={isRequired}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isInvalid={!!error}
          className={cn('nyn-input-block mb-3', wrapperClassName, className)}>
          {label && <Label className={cn(labelClassName)}>{label}</Label>}
          <Input ref={ref} placeholder={placeholder} value={value} defaultValue={defaultValue} onChange={onChange} className={cn(inputClassName)} />
          {helperText && <Description>{helperText}</Description>}
          {error && <FieldError>{error}</FieldError>}
        </TextField>
      );
    }
  )
);

NInput.displayName = 'NInput';
