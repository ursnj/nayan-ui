import React from 'react';
import { Popover } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NTooltipProps {
  children: React.ReactNode;
  message: string;
  className?: string;
  textClassName?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const NTooltip = React.memo<NTooltipProps>(({ children, message, className, textClassName, placement = 'top' }) => {
  return (
    <Popover presentation="popover">
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Overlay />
        <Popover.Content presentation="popover" placement={placement} className={cn('max-w-[250px]', className)}>
          <Popover.Arrow />
          <Popover.Description className={cn(textClassName)}>{message}</Popover.Description>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
});

NTooltip.displayName = 'NTooltip';
