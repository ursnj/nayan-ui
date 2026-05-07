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
    let IconElem: ReactNode = null;
    if (icon) {
      if (isValidElement(icon)) {
        IconElem = icon;
      } else if (typeof icon === 'object' && 'displayName' in icon) {
        IconElem = React.createElement(icon as any, { className: cn('mr-2 h-4 w-4', iconClassName) });
      } else if (typeof icon === 'function') {
        IconElem = React.createElement(icon, { className: cn('mr-2 h-4 w-4', iconClassName) });
      }
    }
    return (
      <>
        <Dropdown.Item
          id={id}
          textValue={typeof title === 'string' ? title : undefined}
          className={cn('nyn-menu-item text-foreground hover:bg-default/50 rounded px-2 py-1.5 cursor-pointer', className)}
          onAction={onAction}>
          {IconElem}
          <Label className={cn(titleClassName)}>{title}</Label>
          {shortcut && (
            <Kbd slot="keyboard" className={cn(shortcutClassName)}>
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
