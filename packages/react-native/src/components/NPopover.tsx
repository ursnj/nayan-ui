import React from 'react';
import { Popover } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NPopoverProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const NPopover = React.memo<NPopoverProps>(({ trigger, children, className = '', placement = 'bottom' }) => {
  return (
    <Popover presentation="popover">
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Overlay />
        <Popover.Content presentation="popover" placement={placement} className={cn(className)}>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
});

NPopover.displayName = 'NPopover';
