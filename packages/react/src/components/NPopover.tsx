import React, { ReactElement, ReactNode, forwardRef, memo, useId } from 'react';
import { Popover } from '@heroui/react';
import { cn } from '../lib/utils';
import { PopoverSize } from './Types';

const sizeMapping = {
  [PopoverSize.XS]: 'w-[150px]',
  [PopoverSize.SM]: 'w-[200px]',
  [PopoverSize.MD]: 'w-[250px]',
  [PopoverSize.LG]: 'w-[300px]'
};

export interface NPopoverProps {
  size?: PopoverSize;
  className?: string;
  triggerClassName?: string;
  trigger: ReactElement;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
  align?: 'start' | 'end' | 'center';
  popoverId?: string;
  popoverLabel?: string;
}

export const NPopover = memo(
  forwardRef<HTMLDivElement, NPopoverProps>((props, ref) => {
    const {
      trigger,
      children,
      size = PopoverSize.SM,
      className = '',
      triggerClassName = '',
      side = 'bottom',
      align = 'end',
      popoverId,
      popoverLabel
    } = props;
    const id = popoverId || useId();
    const triggerNode = React.cloneElement(trigger as any, {
      'aria-controls': id,
      'aria-haspopup': 'dialog',
      className: cn('nyn-popover', triggerClassName, (trigger.props as any)?.className)
    });
    return (
      <Popover>
        <Popover.Trigger>{triggerNode}</Popover.Trigger>
        <Popover.Content className={cn('nyn-popover-content rounded bg-surface border border-default shadow-lg p-0', sizeMapping[size], className)}>
          {children}
        </Popover.Content>
      </Popover>
    );
  })
);
NPopover.displayName = 'NPopover';
