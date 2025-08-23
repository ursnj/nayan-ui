import React, { ElementType, ReactNode, isValidElement } from 'react';
import { cn } from '../lib/utils';
import { NDivider } from './NDivider';
import { DropdownMenuItem, DropdownMenuShortcut } from './ui/dropdown-menu';

export interface NMenuItemProps extends Omit<React.ComponentPropsWithoutRef<typeof DropdownMenuItem>, 'title'> {
  title: ReactNode;
  shortcut?: string;
  icon?: ElementType | ReactNode;
  separator?: boolean;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  shortcutClassName?: string;
  disabled?: boolean;
}

export const NMenuItem: React.FC<NMenuItemProps> = React.memo(
  ({
    title,
    shortcut = '',
    separator = false,
    className = '',
    titleClassName = '',
    iconClassName = '',
    shortcutClassName = '',
    icon,
    disabled = false,
    ...rest
  }) => {
    let IconElem: ReactNode = null;
    if (icon) {
      // If icon is a valid React element, render as is
      if (isValidElement(icon)) {
        IconElem = icon;
      } else if (typeof icon === 'object' && 'displayName' in icon) {
        // Defensive: if someone passes a React.forwardRef or memo component
        IconElem = React.createElement(icon as any, { className: cn('mr-2 h-4 w-4', iconClassName) });
      } else if (typeof icon === 'function') {
        // If icon is a component type (e.g., lucide-react icon), render it as an element
        IconElem = React.createElement(icon, { className: cn('mr-2 h-4 w-4', iconClassName) });
      }
    }
    return (
      <>
        <DropdownMenuItem
          className={cn('nyn-menu-item text-text hover:bg-border focus:bg-border active:bg-border cursor-pointer py-2', className)}
          disabled={disabled}
          {...rest}>
          {IconElem}
          <span className={titleClassName}>{title}</span>
          {shortcut && <DropdownMenuShortcut className={cn('text-muted', shortcutClassName)}>{shortcut}</DropdownMenuShortcut>}
        </DropdownMenuItem>
        {separator && <NDivider />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
