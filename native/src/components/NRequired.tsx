import React from 'react';
import { NText } from './NText';
import { cn } from '../lib/utils';

export interface NRequiredProps {
  className?: string;
}

export const NRequired = React.memo<NRequiredProps>(({ className = '' }) => {
  return <NText className={cn('text-danger', className)}>*</NText>;
});

NRequired.displayName = 'NRequired';
