import React from 'react';
import { SubMenu, type SubMenuRootProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NSubMenuProps extends SubMenuRootProps {
  label: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export const NSubMenu = React.memo<NSubMenuProps>(({ label, children, className, triggerClassName, contentClassName, ...props }) => {
  return (
    <SubMenu className={cn(className)} {...props}>
      <SubMenu.Trigger className={cn(triggerClassName)}>{label}</SubMenu.Trigger>
      <SubMenu.Content className={cn(contentClassName)}>{children}</SubMenu.Content>
    </SubMenu>
  );
});

NSubMenu.displayName = 'NSubMenu';
