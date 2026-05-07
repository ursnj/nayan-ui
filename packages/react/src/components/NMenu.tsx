import React, { ReactNode } from 'react';
import { Dropdown, Header, Separator } from '@heroui/react';
import { cn } from '../lib/utils';
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
  placement?: 'top' | 'bottom' | 'right' | 'left';
  className?: string;
  triggerClassName?: string;
  titleClassName?: string;
  trigger: ReactNode;
  children: ReactNode;
}

export const NMenu: React.FC<NMenuProps> = React.memo(
  ({ trigger, children, className = '', triggerClassName = '', titleClassName = '', title = '', size = MenuSize.MD, placement = 'bottom' }) => {
    return (
      <Dropdown>
        <Dropdown.Trigger className={cn('nyn-menu-trigger', triggerClassName)}>{trigger}</Dropdown.Trigger>
        <Dropdown.Popover placement={placement} className={cn(menuSizeMapping[size])}>
          <Dropdown.Menu className={cn('nyn-menu-content bg-surface border border-default rounded p-1', className)}>
            {title && (
              <>
                <Header className={cn(titleClassName)}>{title}</Header>
                <Separator />
              </>
            )}
            {children}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
  }
);

NMenu.displayName = 'NMenu';
