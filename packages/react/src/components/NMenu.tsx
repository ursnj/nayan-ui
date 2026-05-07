import React, { ReactNode } from 'react';
import { Popover } from '@heroui/react';
import { cn } from '../lib/utils';
import { NDivider } from './NDivider';
import { MenuSize } from './Types';

export const menuSizeMapping = {
  [MenuSize.XS]: 'w-[80px]',
  [MenuSize.SM]: 'w-[100px]',
  [MenuSize.MD]: 'w-[150px]',
  [MenuSize.LG]: 'w-[200px]'
} as const;

export interface NMenuProps {
  size?: MenuSize;
  title?: ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
  align?: 'start' | 'end' | 'center';
  className?: string;
  triggerClassName?: string;
  titleClassName?: string;
  trigger: ReactNode;
  children: ReactNode;
}

export const NMenu: React.FC<NMenuProps> = React.memo(
  ({
    trigger,
    children,
    className = '',
    triggerClassName = '',
    titleClassName = '',
    title = '',
    size = MenuSize.MD,
    side = 'bottom',
    align = 'end'
  }) => {
    return (
      <Popover>
        <Popover.Trigger className={cn('nyn-menu-trigger', triggerClassName)} aria-haspopup="menu">
          {trigger}
        </Popover.Trigger>
        <Popover.Content className={cn('nyn-menu-content rounded bg-card border border-border shadow-lg p-1', menuSizeMapping[size], className)}>
          {title && (
            <>
              <div className={cn('text-text px-2 py-1.5 text-sm font-semibold', titleClassName)}>{title}</div>
              <NDivider />
            </>
          )}
          <div role="group">{children}</div>
        </Popover.Content>
      </Popover>
    );
  }
);

NMenu.displayName = 'NMenu';
