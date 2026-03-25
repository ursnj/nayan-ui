import React, { useMemo } from 'react';
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { NText } from './NText';

export interface NMenuItemProps {
  title: string;
  shortcut?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  onPress: () => void;
  hasSeparator?: boolean;
  className?: string;
  textClassName?: string;
  shortcutClassName?: string;
}

export const NMenuItem = React.memo<NMenuItemProps>(
  ({ title, shortcut = '', hasSeparator = false, icon, className = '', textClassName = '', shortcutClassName = '', onPress }) => {
    const menuIcon = useMemo(() => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return icon;
      }

      const IconComponent = icon as React.ComponentType<any>;
      return <IconComponent size={16} />;
    }, [icon]);

    return (
      <>
        <DropdownMenuItem className={className} onPress={onPress}>
          {menuIcon && <span className="mr-2">{menuIcon}</span>}
          <NText className={textClassName}>{title}</NText>
          {shortcut && <DropdownMenuShortcut className={cn('text-muted', shortcutClassName)}>{shortcut}</DropdownMenuShortcut>}
        </DropdownMenuItem>
        {hasSeparator && <DropdownMenuSeparator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
