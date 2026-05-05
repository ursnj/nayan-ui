import React from 'react';
import { Popover, cn } from 'heroui-native';
import { NText } from './NText';

export interface NTooltipProps {
  children: React.ReactNode;
  message: string;
  className?: string;
  textClassName?: string;
}

export const NTooltip = React.memo<NTooltipProps>(({ children, message, className, textClassName }) => {
  return (
    <Popover>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Overlay />
        <Popover.Content presentation="popover" className={cn('max-w-[250px] p-2', className)}>
          <NText className={cn('text-sm', textClassName)}>{message}</NText>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
});

NTooltip.displayName = 'NTooltip';
