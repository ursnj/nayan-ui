import React from 'react';
import { Spinner } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'current' | 'accent' | 'success' | 'warning' | 'danger';
  'aria-label'?: string;
}

export const NLoading = React.memo(
  ({ className = '', size = 'md', color = 'current', 'aria-label': ariaLabel = 'Loading', ...rest }: NLoadingProps) => {
    return (
      <div className="p-3 flex items-center justify-center">
        <Spinner size={size} color={color} className={cn('nyn-loading', className)} aria-label={ariaLabel} />
      </div>
    );
  }
);

NLoading.displayName = 'NLoading';
