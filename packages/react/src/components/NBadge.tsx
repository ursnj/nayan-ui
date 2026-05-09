import React, { ReactNode, memo } from 'react';
import { Badge } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NBadgeProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  variant?: 'primary' | 'secondary' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  role?: string;
}

const NBadgeComponent: React.FC<NBadgeProps> = memo(
  ({ className = '', color = 'default', variant = 'soft', size = 'md', children, role = 'status', ...rest }) => {
    return (
      <Badge
        color={color}
        variant={variant}
        size={size}
        className={cn('nyn-badge relative static translate-0 px-2.5 py-0.5', className)}
        {...(rest as any)}>
        <Badge.Label>{children}</Badge.Label>
      </Badge>
    );
  }
);

NBadgeComponent.displayName = 'NBadge';

export const NBadge = NBadgeComponent;
