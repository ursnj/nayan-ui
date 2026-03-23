import React, { type ReactNode } from 'react';
import { Menu } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NMenuProps {
  children?: ReactNode;
  trigger: ReactNode;
  title?: string;
  className?: string;
  titleClassName?: string;
}

export const NMenu = React.memo<NMenuProps>(({ children, trigger, title = '', className = '', titleClassName = '' }) => {
  return (
    <Menu>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" width={256} className={cn(className)}>
          {title && <Menu.Label className={cn(titleClassName)}>{title}</Menu.Label>}
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
});

NMenu.displayName = 'NMenu';
