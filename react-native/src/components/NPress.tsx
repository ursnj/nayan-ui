import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface NPressProps extends PressableProps {
  children: React.ReactNode;
  className?: string;
}

export const NPress = React.memo<NPressProps>(({ children, className = '', ...props }) => {
  return (
    <Pressable className={cn('active:opacity-80', className)} {...props}>
      {children}
    </Pressable>
  );
});

NPress.displayName = 'NPress';
