import React, { ReactNode } from 'react';
import { Dropdown, Header, Separator } from '@heroui/react';
import { cn } from '../lib/utils';
import { MenuSize } from './Types';

// Minimum widths: HeroUI's .dropdown__popover sets md:min-w-55, so a fixed width is ignored from 768px up.
export const menuSizeMapping = {
  [MenuSize.XS]: 'min-w-[8rem]',
  [MenuSize.SM]: 'min-w-[10rem]',
  [MenuSize.MD]: 'min-w-[13rem]',
  [MenuSize.LG]: 'min-w-[16rem]'
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
        <Dropdown.Popover placement={placement} className={cn('nyn-menu-popover', menuSizeMapping[size])}>
          <Dropdown.Menu className={cn('nyn-menu-content', className)}>
            {title && (
              <>
                <Header className={cn('px-2.5 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wider text-muted', titleClassName)}>
                  {title}
                </Header>
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
