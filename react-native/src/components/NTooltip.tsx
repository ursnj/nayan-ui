import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NText } from '@/components/NText';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface NTooltipProps {
  children: React.ReactNode;
  message: string;
  className?: string;
  textClassName?: string;
}

export const NTooltip = React.memo<NTooltipProps>(({ children, message, className, textClassName }) => {
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

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent insets={contentInsets} className={cn('bg-card border border-border max-w-[250px]', className)}>
        <NText className={textClassName}>{message}</NText>
      </TooltipContent>
    </Tooltip>
  );
});

NTooltip.displayName = 'NTooltip';
