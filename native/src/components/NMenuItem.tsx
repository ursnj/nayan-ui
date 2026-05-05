import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Menu, Separator, cn } from 'heroui-native';
import { NText } from './NText';

export interface NMenuItemProps {
  title: string;
  shortcut?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  onPress: () => void;
  isDisabled?: boolean;
  hasSeparator?: boolean;
  className?: string;
  titleClassName?: string;
  shortcutClassName?: string;
}

export const NMenuItem = React.memo<NMenuItemProps>(
  ({ title, shortcut = '', hasSeparator = false, icon, isDisabled, className = '', titleClassName = '', shortcutClassName = '', onPress }) => {
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
          <Menu.ItemTitle className={titleClassName}>{title}</Menu.ItemTitle>
          {shortcut && <NText className={cn('text-muted-foreground text-xs ml-auto', shortcutClassName)}>{shortcut}</NText>}
        </Menu.Item>
        {hasSeparator && <Separator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
