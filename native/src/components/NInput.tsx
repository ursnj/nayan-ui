import React from 'react';
import {
  Description,
  FieldError,
  Input,
  type InputProps,
  Label,
  TextArea,
  type TextAreaProps,
  TextField,
  type TextFieldRootProps
} from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NInputProps extends Omit<TextFieldRootProps, 'children'> {
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
    return (
      <TextField className={cn('mb-3', containerClassName)} {...props}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        {multiline ? <TextArea className={cn(className)} {...textAreaProps} /> : <Input className={cn(className)} {...inputProps} />}
        {description && <Description className={cn(descriptionClassName)}>{description}</Description>}
        {errorMessage && <FieldError className={cn(errorClassName)}>{errorMessage}</FieldError>}
      </TextField>
    );
  }
);

NInput.displayName = 'NInput';
