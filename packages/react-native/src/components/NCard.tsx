import React from 'react';
import { Card } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NCardProps {
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  [key: string]: any;
}

export const NCard = React.memo<NCardProps>(({ children, className, bodyClassName, ...props }) => {
  return (
    <Card className={cn(className)} {...props}>
      <Card.Body className={cn(bodyClassName)}>{children}</Card.Body>
    </Card>
  );
});

NCard.displayName = 'NCard';
