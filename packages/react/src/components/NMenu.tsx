import React, { ReactNode } from 'react';
import { Dropdown, Header, Separator } from '@heroui/react';
import { cn } from '../lib/utils';
import { MenuSize } from './Types';

/*
 * Minimum widths, not fixed ones.
 *
 * These were `w-[80px]` … `w-[200px]`, which did nothing on a desktop and the
 * wrong thing on a phone: HeroUI's `.dropdown__popover` carries `md:min-w-55`,
 * so from 768px up the popover was 220px wide whatever `size` said, and below
 * that it was clamped to a width too narrow for its own content — a menu of
 * "Edit ⌘E" items in an 80px box.
 *
 * As `min-w-*` the prop sets a floor and lets the content decide the rest, so
 * a long label or a shortcut widens the menu instead of wrapping inside it.
 */
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
            {/*
             * The title needs its own styling: HeroUI has no rule for a bare
             * `Header`, so it inherited the menu's own type and rendered as a
             * row that looked exactly like a menu item but did nothing when
             * clicked. A section label is smaller, quieter and not centred on
             * the item grid.
             */}
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
