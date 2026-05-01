import React, { type ReactNode } from 'react';
import { Menu, Separator } from 'heroui-native';
import { cn } from '../lib/utils';

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
      <Menu.Trigger>{trigger}</Menu.Trigger>
      <Menu.Content className={cn('w-64', className)}>
        {title && (
          <>
            <Menu.Label className={cn(titleClassName)}>{title}</Menu.Label>
            <Separator />
          </>
        )}
        {children}
      </Menu.Content>
    </Menu>
  );
});

NMenu.displayName = 'NMenu';
