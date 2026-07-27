import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Menu, Separator, cn, useThemeColor } from 'heroui-native';
import { type NIcon, resolveIcon } from '../helpers/icons';
import { NText } from './NText';

export interface NMenuItemProps {
  title: string;
  shortcut?: string;
  icon?: NIcon;
  onPress: () => void;
  isDisabled?: boolean;
  hasSeparator?: boolean;
  className?: string;
  titleClassName?: string;
  shortcutClassName?: string;
}

export const NMenuItem = React.memo<NMenuItemProps>(
  ({ title, shortcut = '', hasSeparator = false, icon, isDisabled, className = '', titleClassName = '', shortcutClassName = '', onPress }) => {
    const foregroundColor = useThemeColor('foreground');
    const menuIcon = useMemo(() => resolveIcon(icon, { color: foregroundColor }), [icon, foregroundColor]);

    return (
      <>
        <Menu.Item className={className} onPress={onPress} isDisabled={isDisabled}>
          {menuIcon && <View className="mr-2">{menuIcon}</View>}
          <Menu.ItemTitle className={titleClassName}>{title}</Menu.ItemTitle>
          {shortcut && <NText className={cn('text-muted text-xs ml-auto', shortcutClassName)}>{shortcut}</NText>}
        </Menu.Item>
        {hasSeparator && <Separator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
