import React from 'react';
import { View } from 'react-native';
import { InputGroup, type InputGroupProps, type InputProps, cn } from 'heroui-native';
import { NText } from './NText';

export interface NInputGroupProps extends InputGroupProps {
  label?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputProps?: InputProps;
}

export const NInputGroup = React.memo<NInputGroupProps>(
  ({ label, prefix, suffix, containerClassName, labelClassName, className, children, inputProps, ...props }) => {
    return (
      <View className={cn('flex mb-3', containerClassName)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <InputGroup className={cn(className)} {...props}>
          {prefix && <InputGroup.Prefix>{prefix}</InputGroup.Prefix>}
          <InputGroup.Input {...inputProps} />
          {suffix && <InputGroup.Suffix>{suffix}</InputGroup.Suffix>}
        </InputGroup>
      </View>
    );
  }
);

NInputGroup.displayName = 'NInputGroup';
