import React, { useMemo } from 'react';
import { Popover } from 'heroui-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Content
        presentation="popover"
        placement={popoverSide}
        insets={contentInsets}
        className={cn('w-80 bg-card p-0 shadow-sm border border-border rounded-md', className)}>
        {children}
      </Popover.Content>
    </Popover>
  );
});

NPopover.displayName = 'NPopover';
