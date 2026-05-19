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
  errorMessage?: string;
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
    const sharedInputProps = { value, onChangeText: onChange, placeholder, keyboardType, secureTextEntry };

    return (
      <TextField className={cn('mb-3', containerClassName)} {...props}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        {multiline ? (
          <TextArea className={cn('text-[16px]', className)} {...sharedInputProps} {...textAreaProps} />
        ) : (
          <Input className={cn('text-[16px]', className)} {...sharedInputProps} {...inputProps} />
        )}
        {description && <Description className={cn(descriptionClassName)}>{description}</Description>}
        {errorMessage && <FieldError className={cn(errorClassName)}>{errorMessage}</FieldError>}
      </TextField>
    );
  }
);

NInput.displayName = 'NInput';
