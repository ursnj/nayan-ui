import React, { ReactNode, memo } from 'react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';

export interface NBadgeProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  role?: string;
}

const NBadgeComponent: React.FC<NBadgeProps> = memo(({ className = '', children, role = 'status', ...rest }) => {
  return (
    <Badge
      role={role}
      aria-live={role === 'status' ? 'polite' : undefined}
      className={cn(`nyn-badge rounded-full font-normal px-2 py-0.5 text-sm`, className)}
      {...rest}>
      {children}
    </Badge>
  );
});

NBadgeComponent.displayName = 'NBadge';

export const NBadge = NBadgeComponent;
