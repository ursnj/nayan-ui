import React, { ReactNode, forwardRef, memo } from 'react';
import { Description, FieldError, Label, TextArea, TextField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTextareaProps {
  id?: string;
  name?: string;
  label?: ReactNode;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
  labelClassName?: string;
  textareaClassName?: string;
  error?: ReactNode;
  helperText?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const NTextarea = memo(
  forwardRef<HTMLTextAreaElement, NTextareaProps>(
    (
      {
        id,
        name,
        label,
        placeholder,
        value,
        defaultValue,
        isRequired = false,
        isDisabled = false,
        isReadOnly = false,
        className = '',
        labelClassName = '',
        textareaClassName = '',
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
          isRequired={isRequired}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isInvalid={!!error}
          className={cn('nyn-textarea-block', className)}>
          {label && <Label className={cn('nyn-textarea-label', labelClassName)}>{label}</Label>}
          <TextArea
            ref={ref}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            className={cn('nyn-textarea', textareaClassName)}
          />
          {helperText && <Description>{helperText}</Description>}
          {error && <FieldError>{error}</FieldError>}
        </TextField>
      );
    }
  )
);

NTextarea.displayName = 'NTextarea';
