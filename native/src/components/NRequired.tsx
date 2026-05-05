import React from 'react';
import { cn } from 'heroui-native';
import { NText } from './NText';

export interface NRequiredProps {
  className?: string;
}

export const NRequired = React.memo<NRequiredProps>(({ className = '' }) => {
  return <NText className={cn('text-danger', className)}>*</NText>;
});

NRequired.displayName = 'NRequired';
