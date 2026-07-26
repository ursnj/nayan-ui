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
        <ProgressBar value={clampedValue} aria-label={label} className={cn('nyn-progress', className)} {...(rest as any)}>
          {showLabel && <ProgressBar.Output>{`${label}: ${clampedValue}%`}</ProgressBar.Output>}
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    );
  })
);

NProgress.displayName = 'NProgress';
