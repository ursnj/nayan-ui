import React from 'react';
import { Popover } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../helpers/utils';

export interface NTooltipProps {
  children: React.ReactNode;
  message: string;
  className?: string;
  textClassName?: string;
}

export const NTooltip = React.memo<NTooltipProps>(({ children, message, className, textClassName }) => {
  return (
    <Popover>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content presentation="popover" className={cn('max-w-[250px] p-2 bg-surface', className)}>
        <NText className={cn('text-sm', textClassName)}>{message}</NText>
      </Popover.Content>
    </Popover>
  );
});

NTooltip.displayName = 'NTooltip';
