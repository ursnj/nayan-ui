import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Menu, Separator } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

export interface NMenuItemProps {
  title: string;
  shortcut?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  onPress: () => void;
  isDisabled?: boolean;
  hasSeparator?: boolean;
  className?: string;
  textClassName?: string;
  shortcutClassName?: string;
}

export const NMenuItem = React.memo<NMenuItemProps>(
  ({ title, shortcut = '', hasSeparator = false, icon, isDisabled, className = '', textClassName = '', shortcutClassName = '', onPress }) => {
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
        <Menu.Item className={className} onPress={onPress} isDisabled={isDisabled}>
          {menuIcon && <View className="mr-2">{menuIcon}</View>}
          <NText className={textClassName}>{title}</NText>
          {shortcut && <NText className={cn('text-muted ml-auto', shortcutClassName)}>{shortcut}</NText>}
        </Menu.Item>
        {hasSeparator && <Separator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
