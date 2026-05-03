import React, { type ReactNode } from 'react';
import { Menu, Separator } from 'heroui-native';
import { cn } from '../helpers/utils';

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
              <Menu.Label className={cn(titleClassName)}>{title}</Menu.Label>
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
