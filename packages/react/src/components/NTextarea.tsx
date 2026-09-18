import React, { ReactNode, forwardRef, memo } from 'react';
import { Description, FieldError, Label, TextArea, TextField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children' | 'className' | 'defaultValue' | 'disabled' | 'onChange' | 'readOnly' | 'required' | 'value'
> {
  id?: string;
  name?: string;
  label?: ReactNode;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  isRequired?: boolean;
  disabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
  wrapperClassName?: string;
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
        disabled = false,
        isReadOnly = false,
        className = '',
        wrapperClassName = '',
        labelClassName = '',
        textareaClassName = '',
        error,
        helperText,
        onChange,
        ...textareaProps
      },
      ref
    ) => {
      return (
        <TextField
          id={id}
          name={name}
          isRequired={isRequired}
          isDisabled={disabled}
          isReadOnly={isReadOnly}
          isInvalid={!!error}
          className={cn('nyn-textarea-block', wrapperClassName, className)}>
          {label && <Label className={cn(labelClassName)}>{label}</Label>}
          <TextArea
            {...textareaProps}
            ref={ref}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            className={cn(textareaClassName)}
          />
          {helperText && <Description>{helperText}</Description>}
          {error && <FieldError>{error}</FieldError>}
        </TextField>
      );
    }
  )
);

NTextarea.displayName = 'NTextarea';
