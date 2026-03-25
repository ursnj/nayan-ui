import React from 'react';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface NRequiredProps {
  className?: string;
}

export const NRequired = React.memo<NRequiredProps>(({ className = '' }) => {
  return <NText className={cn('text-red-500', className)}>*</NText>;
});

NRequired.displayName = 'NRequired';
