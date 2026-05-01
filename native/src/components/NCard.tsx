import React from 'react';
import { Card, type CardRootProps } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NCardProps extends CardRootProps {}

export const NCard = React.memo<NCardProps>(({ children, className, ...props }) => {
  return (
    <Card className={cn('p-4', className)} {...props}>
      {children}
    </Card>
  );
});

NCard.displayName = 'NCard';
