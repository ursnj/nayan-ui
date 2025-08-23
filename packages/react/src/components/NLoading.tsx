import React from 'react';
import { cn } from '../lib/utils';

export interface NLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  'aria-label'?: string;
}

export const NLoading = React.memo(({ className = '', 'aria-label': ariaLabel = 'Loading', ...rest }: NLoadingProps) => {
  return (
    <div className="p-3">
      <div
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        className={cn(
          'animation-loader relative text-slate-400 text-[5px] h-[1em] w-[1em] my-[20px] mx-auto -indent-[999em] rounded-full',
          className
        )}
        {...rest}>
        Loading...
      </div>
    </div>
  );
});

NLoading.displayName = 'NLoading';
