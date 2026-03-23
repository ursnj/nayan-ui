import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Menu, Separator } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NMenuItemProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  onPress: () => void;
  hasSeparator?: boolean;
  className?: string;
  textClassName?: string;
}

export const NMenuItem = React.memo<NMenuItemProps>(
  ({ title, description, hasSeparator = false, icon, className = '', textClassName = '', onPress }) => {
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
        <Menu.Item className={cn(className)} onPress={onPress}>
          {menuIcon}
          <View className="flex-1">
            <Menu.ItemTitle className={cn(textClassName)}>{title}</Menu.ItemTitle>
            {description && <Menu.ItemDescription>{description}</Menu.ItemDescription>}
          </View>
        </Menu.Item>
        {hasSeparator && <Separator />}
      </>
    );
  }
);

NMenuItem.displayName = 'NMenuItem';
