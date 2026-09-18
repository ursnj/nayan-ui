import React from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import {
  Description,
  FieldError,
  Input,
  type InputProps,
  Label,
  TextArea,
  type TextAreaProps,
  TextField,
  type TextFieldRootProps,
  cn
} from 'heroui-native';

export interface NInputProps extends Omit<TextFieldRootProps, 'children'> {
  value?: string;
  onChange?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  label?: string;
  description?: string;
  /** Alias of `description`, as the React package names it. */
  helperText?: string;
  errorMessage?: string;
  /** Alias of `errorMessage`. */
  error?: string;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  multiline?: boolean;
  inputProps?: InputProps;
  textAreaProps?: TextAreaProps;
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
}

export const NInput = React.memo<NInputProps>(
  ({
    value,
    onChange,
    placeholder,
    keyboardType,
    secureTextEntry,
    label,
    description,
    helperText,
    error,
    disabled,
    errorMessage,
    multiline = false,
    inputProps,
    textAreaProps,
    className,
    containerClassName,
    labelClassName,
    descriptionClassName,
    errorClassName,
    ...props
  }) => {
    const help = description ?? helperText;
    const errorText = errorMessage ?? error;
    const sharedInputProps = { value, onChangeText: onChange, placeholder, keyboardType, secureTextEntry, editable: disabled ? false : undefined };

    return (
      <TextField className={cn('mb-3', containerClassName)} {...props}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        {multiline ? (
          <TextArea className={cn('text-[16px] rounded-xl py-3', className)} {...sharedInputProps} {...textAreaProps} />
        ) : (
          <Input className={cn('text-[16px] rounded-xl', className)} {...sharedInputProps} {...inputProps} />
        )}
        {help && <Description className={cn(descriptionClassName)}>{help}</Description>}
        {errorText && <FieldError className={cn(errorClassName)}>{errorText}</FieldError>}
      </TextField>
    );
  }
);

NInput.displayName = 'NInput';
