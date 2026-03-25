import React, { useMemo } from 'react';
import { Menu, Separator } from 'heroui-native';
import { View } from 'react-native';
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
        <Menu.Item className={className} onPress={onPress}>
          {menuIcon && <View className="mr-2">{menuIcon}</View>}
          <NText className={textClassName}>{title}</NText>
          {shortcut && <NText className={cn('text-muted ml-auto text-xs native:text-sm', shortcutClassName)}>{shortcut}</NText>}
        </Menu.Item>
        {hasSeparator && <Separator className="my-1 bg-border" />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
