import React from 'react';
import { Card, type CardRootProps, cn } from 'heroui-native';

export interface NCardProps extends CardRootProps {}

export const NCard = React.memo<NCardProps>(({ children, className, ...props }) => {
  return (
    <Card className={cn('overflow-hidden rounded-xl border border-border bg-surface px-4 py-3', className)} {...props}>
      {children}
    </Card>
  );
});

NCard.displayName = 'NCard';
