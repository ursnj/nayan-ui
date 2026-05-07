import React, { ReactNode, memo } from 'react';
import { Card } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'transparent' | 'default' | 'secondary' | 'tertiary';
  children: ReactNode;
}

const NCardComponent: React.FC<NCardProps> = memo(({ className = '', variant = 'default', children, ...rest }) => {
  return (
    <Card variant={variant} className={cn('nyn-card', className)} {...(rest as any)}>
      {children}
    </Card>
  );
});

NCardComponent.displayName = 'NCard';

export const NCard = NCardComponent;
