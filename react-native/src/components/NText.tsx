import React from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface NTextProps extends TextProps {
  className?: string;
  children: string | React.ReactNode;
}

export const NText = React.memo<NTextProps>(({ children, className, ...props }) => {
  return (
    <Text className={cn('text-text text-base leading-relaxed', className)} {...props}>
      {children}
    </Text>
  );
});

NText.displayName = 'NText';
