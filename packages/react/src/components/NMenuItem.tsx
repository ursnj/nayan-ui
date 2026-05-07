import React, { ElementType, ReactNode, isValidElement } from 'react';
import { cn } from '../lib/utils';
import { NDivider } from './NDivider';

export interface NMenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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
        <div
          role="menuitem"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          className={cn(
            'nyn-menu-item flex items-center text-text hover:bg-border focus:bg-border active:bg-border cursor-pointer py-2 px-2 text-sm rounded',
            disabled && 'opacity-50 pointer-events-none',
            className
          )}
          {...rest}>
          {IconElem}
          <span className={titleClassName}>{title}</span>
          {shortcut && <span className={cn('ml-auto text-xs text-muted', shortcutClassName)}>{shortcut}</span>}
        </div>
        {separator && <NDivider />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
