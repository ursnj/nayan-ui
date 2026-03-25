import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface NPopoverProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
}

export const NPopover = React.memo<NPopoverProps>(({ trigger, children, className = '', side }) => {
  const insets = useSafeAreaInsets();

  const contentInsets = useMemo(
    () => ({
      top: insets.top,
      bottom: insets.bottom,
      left: 12,
      right: 12
    }),
    [insets.top, insets.bottom]
  );

  const popoverSide = side || (Platform.OS === 'web' ? 'bottom' : 'top');

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side={popoverSide} insets={contentInsets} className={cn('w-80 bg-card p-0 shadow-sm', className)}>
        {children}
      </PopoverContent>
    </Popover>
  );
});

NPopover.displayName = 'NPopover';
