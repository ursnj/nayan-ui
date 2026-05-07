import React, { ReactNode, forwardRef, memo } from 'react';
import { Tooltip } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tooltip message or node */
  message: ReactNode;
  /** Class for the tooltip content */
  className?: string;
  /** Class for the trigger */
  triggerClassName?: string;
  /** Tooltip trigger element */
  children: ReactNode;
  /** Placement of the tooltip */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing/hiding */
  delayShow?: number;
  delayHide?: number;
  /** Optional id for accessibility */
  id?: string;
  /** aria-label for accessibility (if message is not string) */
  ariaLabel?: string;
  /** Props for TooltipTrigger */
  triggerProps?: React.HTMLAttributes<HTMLElement>;
  /** Props for TooltipContent */
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * NTooltip is a memoized, accessible tooltip component.
 */
export const NTooltip: React.FC<NTooltipProps> = memo(
  forwardRef<HTMLDivElement, NTooltipProps>(
    (
      {
        message,
        className = '',
        triggerClassName = '',
        children,
        placement = 'top',
        delayShow = 0,
        delayHide = 0,
        id,
        ariaLabel,
        triggerProps = {},
        contentProps = {},
        ...rest
      },
      ref
    ) => {
      return (
        <Tooltip>
          <Tooltip.Trigger className={triggerClassName} aria-describedby={id} {...triggerProps}>
            {children}
          </Tooltip.Trigger>
          <Tooltip.Content id={id} className={cn('nyn-tooltip', className)} {...contentProps}>
            {message}
          </Tooltip.Content>
        </Tooltip>
      );
    }
  )
);
NTooltip.displayName = 'NTooltip';
