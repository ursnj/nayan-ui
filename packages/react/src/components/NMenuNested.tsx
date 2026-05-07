import React, { ReactElement, ReactNode } from 'react';
import { Popover } from '@heroui/react';
import { cn } from '../lib/utils';
import { menuSizeMapping } from './NMenu';
import { Size } from './Types';

export interface NMenuNestedProps {
  size?: Size;
  className?: string;
  triggerClassName?: string;
  trigger: ReactElement;
  children: ReactNode;
  'aria-label'?: string;
}

export const NMenuNested: React.FC<NMenuNestedProps> = React.memo(
  ({ trigger, children, className = '', triggerClassName = '', size = Size.MD, 'aria-label': ariaLabel }) => {
    return (
      <Popover>
        <Popover.Trigger
          aria-haspopup="menu"
          aria-label={ariaLabel}
          className={cn(
            'nyn-menu-nested-trigger text-muted hover:bg-border focus:bg-border active:bg-border py-2.5 w-full text-left px-2 text-sm rounded cursor-pointer',
            triggerClassName
          )}>
          {trigger}
        </Popover.Trigger>
        <Popover.Content
          className={cn('nyn-menu-nested-content rounded bg-card border border-border shadow-lg p-1', menuSizeMapping[size], className)}>
          {children}
        </Popover.Content>
      </Popover>
    );
  }
);
NMenuNested.displayName = 'NMenuNested';
