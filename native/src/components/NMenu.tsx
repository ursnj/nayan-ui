import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { Menu, Separator, SubMenu, type SubMenuRootProps, cn } from 'heroui-native';
import { NText } from './NText';

export interface NMenuProps {
  children?: ReactNode;
  trigger: ReactNode;
  title?: string;
  width?: number;
  className?: string;
  titleClassName?: string;
}

export const NMenu = React.memo<NMenuProps>(({ children, trigger, title = '', width = 220, className = '', titleClassName = '' }) => {
  return (
    <Menu>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" width={width} className={cn(className)}>
          {title && (
            <>
              <View className="mb-2">
                <Menu.Label className={cn(titleClassName)}>{title}</Menu.Label>
              </View>
              <Separator />
            </>
          )}
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
});

NMenu.displayName = 'NMenu';

export interface NSubMenuProps extends SubMenuRootProps {
  label: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  triggerClassName?: string;
  contentClassName?: string;
}

export const NSubMenu = React.memo<NSubMenuProps>(({ label, icon, children, className, triggerClassName, contentClassName, ...props }) => {
  const menuIcon = React.useMemo(() => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent size={16} />;
  }, [icon]);

  return (
    <SubMenu className={cn(className)} {...props}>
      <SubMenu.Trigger className={cn(triggerClassName)}>
        {menuIcon && <View className="mr-2">{menuIcon}</View>}
        <NText className="flex-1">{label}</NText>
        <SubMenu.TriggerIndicator />
      </SubMenu.Trigger>
      <SubMenu.Content className={cn(contentClassName)}>{children}</SubMenu.Content>
    </SubMenu>
  );
});

NSubMenu.displayName = 'NSubMenu';
