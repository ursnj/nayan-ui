import React from 'react';
import { type ViewProps } from 'react-native';
import { Card } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NCardProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export const NCard = React.memo<NCardProps>(({ children, className, ...props }) => {
  return (
    <Card className={cn('p-4', className)} {...props}>
      {children}
    </Card>
  );
});

NCard.displayName = 'NCard';
