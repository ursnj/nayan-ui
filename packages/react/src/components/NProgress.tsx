import React, { forwardRef, memo } from 'react';
import { cn } from '../lib/utils';
import { Progress } from './ui/progress';

export interface NProgressProps extends React.ComponentPropsWithoutRef<typeof Progress> {
  value: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const NProgress = memo(
  forwardRef<HTMLDivElement, NProgressProps>((props, ref) => {
    const { value, className = '', label = 'Progress', showLabel = false, ...rest } = props;
    // Clamp value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value));
    return (
      <div className="nyn-progress-wrapper" style={{ width: '100%' }}>
        {showLabel && (
          <span className="sr-only" aria-live="polite">
            {label}: {clampedValue}%
          </span>
        )}
        <Progress
          ref={ref}
          value={clampedValue}
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className={cn('nyn-progress bg-border rounded', className)}
          {...rest}
        />
      </div>
    );
  })
);

NProgress.displayName = 'NProgress';
