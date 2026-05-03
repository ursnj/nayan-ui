import React from 'react';
import { Popover } from 'heroui-native';
import { cn } from '../helpers/utils';

export type NPopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface NPopoverProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  placement?: NPopoverPlacement;
  className?: string;
}

export const NPopover = React.memo<NPopoverProps>(({ trigger, children, isOpen, onOpenChange, placement = 'bottom', className = '' }) => {
  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Overlay />
        <Popover.Content presentation="popover" placement={placement} className={cn('w-80 p-0 px-2', className)}>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
});

NPopover.displayName = 'NPopover';
