import React, { forwardRef, memo } from 'react';
import { ProgressBar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NProgressProps {
  value: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const NProgress = memo(
  forwardRef<HTMLDivElement, NProgressProps>((props, ref) => {
    const { value, className = '', label = 'Progress', showLabel = false, ...rest } = props;
    const clampedValue = Math.max(0, Math.min(100, value));
    return (
      <div className="nyn-progress-wrapper" style={{ width: '100%' }} ref={ref}>
        {showLabel && (
          <span className="sr-only" aria-live="polite">
            {label}: {clampedValue}%
          </span>
        )}
        <ProgressBar value={clampedValue} aria-label={label} className={cn('nyn-progress', className)} {...(rest as any)} />
      </div>
    );
  })
);

NProgress.displayName = 'NProgress';
