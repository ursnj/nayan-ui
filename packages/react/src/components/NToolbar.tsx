import React, { ReactNode, memo } from 'react';
import { Toolbar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NToolbarProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  isAttached?: boolean;
  className?: string;
  'aria-label'?: string;
}

const NToolbarComponent: React.FC<NToolbarProps> = memo(
  ({ children, orientation = 'horizontal', isAttached = false, className = '', 'aria-label': ariaLabel = 'Toolbar' }) => {
    return (
      <Toolbar orientation={orientation} isAttached={isAttached} className={cn('nyn-toolbar', className)} aria-label={ariaLabel}>
        {children}
      </Toolbar>
    );
  }
);

NToolbarComponent.displayName = 'NToolbar';

export const NToolbar = NToolbarComponent;
