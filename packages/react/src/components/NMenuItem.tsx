import React, { ElementType, ReactNode, isValidElement } from 'react';
import { Dropdown, Kbd, Label, Separator } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NMenuItemProps {
  id?: string;
  title: ReactNode;
  shortcut?: string;
  icon?: ElementType | ReactNode;
  separator?: boolean;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  shortcutClassName?: string;
  disabled?: boolean;
  onAction?: () => void;
}

export const NMenuItem: React.FC<NMenuItemProps> = React.memo(
  ({
    id,
    title,
    shortcut = '',
    separator = false,
    className = '',
    iconClassName = '',
    titleClassName = '',
    shortcutClassName = '',
    icon,
    disabled = false,
    onAction
  }) => {
    /*
     * No `mr-2` on the icon. `.menu-item` is a flex row with `gap-3`, so the
     * margin was adding 8px to a 12px gap the row had already applied — the
     * icon sat nearly twice as far from its label as from the item's edge.
     * `shrink-0` keeps a long label from squashing it.
     */
    let IconElem: ReactNode = null;
    if (icon) {
      if (isValidElement(icon)) {
        IconElem = icon;
      } else if (typeof icon === 'object' && 'displayName' in icon) {
        IconElem = React.createElement(icon as any, { className: cn('h-4 w-4 shrink-0', iconClassName) });
      } else if (typeof icon === 'function') {
        IconElem = React.createElement(icon, { className: cn('h-4 w-4 shrink-0', iconClassName) });
      }
    }
    return (
      <>
        <Dropdown.Item
          id={id}
          textValue={typeof title === 'string' ? title : undefined}
          isDisabled={disabled}
          className={cn('nyn-menu-item', className)}
          onAction={onAction}>
          {IconElem}
          <Label className={cn(titleClassName)}>{title}</Label>
          {/*
           * `ms-auto` puts the shortcut against the item's trailing edge.
           * `.menu-item` is `flex justify-start gap-3` and nothing in HeroUI's
           * CSS targets `slot="keyboard"`, so the shortcut was simply the next
           * flex child — it sat 12px after the label, wherever that happened to
           * end, and a menu of "Edit ⌘E / Copy ⌘C / Delete ⌘D" came out with
           * three shortcuts at three different offsets. The auto margin eats
           * the free space instead, so they line up in a column.
           *
           * `ps-3` rather than relying on the row's gap: with `ms-auto` the gap
           * no longer guarantees a minimum, so a label long enough to fill the
           * row would otherwise touch its shortcut.
           */}
          {shortcut && (
            <Kbd slot="keyboard" className={cn('ms-auto ps-3', shortcutClassName)}>
              {shortcut}
            </Kbd>
          )}
        </Dropdown.Item>
        {separator && <Separator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
