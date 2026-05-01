import React from 'react';
import { TextField, Label, Input, Description, FieldError, type TextFieldRootProps, type InputProps } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NTextFieldProps extends TextFieldRootProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  inputProps?: InputProps;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
}

export const NTextField = React.memo<NTextFieldProps>(
  ({ label, description, errorMessage, inputProps, className, labelClassName, descriptionClassName, errorClassName, ...props }) => {
    return (
      <TextField className={cn('mb-3', className)} {...props}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        <Input {...inputProps} />
        {description && <Description className={cn(descriptionClassName)}>{description}</Description>}
        {errorMessage && <FieldError className={cn(errorClassName)}>{errorMessage}</FieldError>}
      </TextField>
    );
  }
);

NTextField.displayName = 'NTextField';
