import React from 'react';
import { Popover } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NPopoverProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
}

export const NPopover = React.memo<NPopoverProps>(({ trigger, children, className = '', side = 'bottom' }) => {
  return (
    <Popover>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Content presentation="popover" placement={side} className={cn('w-80 p-0', className)}>
        {children}
      </Popover.Content>
    </Popover>
  );
});

NPopover.displayName = 'NPopover';
