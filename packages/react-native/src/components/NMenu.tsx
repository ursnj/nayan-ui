import React, { type ReactNode, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
    <DropdownMenu>
      <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent insets={contentInsets} className={cn('w-64 native:w-64 bg-card', className)}>
        {title && (
          <>
            <DropdownMenuLabel className={cn('text-text', titleClassName)}>{title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

NMenu.displayName = 'NMenu';
