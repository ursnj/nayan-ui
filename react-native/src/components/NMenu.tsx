import React, { type ReactNode, useMemo } from 'react';
import { Menu, Separator } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/utils';

export interface NMenuProps {
  children?: ReactNode;
  trigger: ReactNode;
  title?: string;
  className?: string;
  titleClassName?: string;
}

export const NMenu = React.memo<NMenuProps>(({ children, trigger, title = '', className = '', titleClassName = '' }) => {
  const insets = useSafeAreaInsets();

  const contentInsets = useMemo(
    () => ({
      top: insets.top,
      bottom: insets.bottom,
      left: 12,
      right: 12
    }),
    [insets.top, insets.bottom]
  );

  return (
    <Menu>
      <Menu.Trigger>{trigger}</Menu.Trigger>
      <Menu.Content presentation="popover" insets={contentInsets} className={cn('w-64 native:w-64 bg-card border border-border rounded-md', className)}>
        {title && (
          <>
            <Menu.Label className={cn('text-text', titleClassName)}>{title}</Menu.Label>
            <Separator className="my-1 bg-border" />
          </>
        )}
        {children}
      </Menu.Content>
    </Menu>
  );
});

NMenu.displayName = 'NMenu';
