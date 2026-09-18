import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Menu, Separator, cn, useThemeColor } from 'heroui-native';
import { type NIcon, resolveIcon } from '../helpers/icons';
import { NText } from './NText';

export interface NMenuItemProps {
  title: string;
  shortcut?: string;
  icon?: NIcon;
  onPress?: () => void;
  /** Alias of `onPress`, as the React package names it. */
  onAction?: () => void;
  isDisabled?: boolean;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  hasSeparator?: boolean;
  /** Alias of `hasSeparator`: draws a divider after the item. */
  separator?: boolean;
  className?: string;
  titleClassName?: string;
  shortcutClassName?: string;
}

export const NMenuItem = React.memo<NMenuItemProps>(
  ({
    title,
    shortcut = '',
    hasSeparator,
    separator,
    icon,
    isDisabled,
    disabled,
    className = '',
    titleClassName = '',
    shortcutClassName = '',
    onPress,
    onAction
  }) => {
    const divider = hasSeparator ?? separator ?? false;
    const off = disabled ?? isDisabled;
    const press = onPress ?? onAction;
    const foregroundColor = useThemeColor('foreground');
    const menuIcon = useMemo(() => resolveIcon(icon, { color: foregroundColor }), [icon, foregroundColor]);

    return (
      <>
        <Menu.Item className={className} onPress={press} isDisabled={off}>
          {menuIcon && <View className="mr-2">{menuIcon}</View>}
          <Menu.ItemTitle className={titleClassName}>{title}</Menu.ItemTitle>
          {shortcut && <NText className={cn('text-muted text-xs ml-auto', shortcutClassName)}>{shortcut}</NText>}
        </Menu.Item>
        {divider && <Separator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
