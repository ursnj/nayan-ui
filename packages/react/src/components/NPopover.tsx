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
    const generatedId = useId();
    const id = popoverId || `nyn-popover-${generatedId}`;
    const alignedPlacement = side === 'left' || side === 'right' ? `${side} ${align === 'start' ? 'top' : 'bottom'}` : `${side} ${align}`;
    const placement = (align === 'center' ? side : alignedPlacement) as
      | 'top'
      | 'bottom'
      | 'right'
      | 'left'
      | 'top start'
      | 'top end'
      | 'bottom start'
      | 'bottom end'
      | 'right top'
      | 'right bottom'
      | 'left top'
      | 'left bottom';
    const triggerNode = React.cloneElement(trigger as any, {
      'aria-controls': id,
      'aria-haspopup': 'dialog',
      className: cn('nyn-popover', triggerClassName, (trigger.props as any)?.className)
    });
    return (
      <Popover>
        <Popover.Trigger>{triggerNode}</Popover.Trigger>
        <Popover.Content placement={placement} className={cn('nyn-popover-content', sizeMapping[size], className)}>
          <Popover.Dialog ref={ref} id={id} aria-label={popoverLabel || 'Popover'}>
            {children}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
  })
);
NPopover.displayName = 'NPopover';
