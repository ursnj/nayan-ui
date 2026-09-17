import React, { forwardRef, memo } from 'react';
import { ProgressBar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NProgressProps {
  value: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A progress bar.
 *
 * HeroUI's `ProgressBar` is a compound component: the root renders the
 * accessible wrapper and nothing else, and the visible bar comes from
 * `Track` and `Fill` children. Without them the whole component rendered an
 * empty 4px-tall div — the progress bar was invisible on every page that used
 * it, including its own documentation. `NMeter` next door had it right; this
 * follows the same shape.
 *
 * `showLabel` also did not do what it says. It rendered the label inside an
 * `sr-only` span, so the one prop whose entire purpose is to show the label
 * showed it to screen readers only. It is a visible `Output` now; the
 * accessible name comes from `aria-label` either way, so nothing is lost for
 * assistive technology.
 */
export const NProgress = memo(
  forwardRef<HTMLDivElement, NProgressProps>((props, ref) => {
    const { value, className = '', label = 'Progress', showLabel = false, color = 'accent', size = 'md', ...rest } = props;
    const clampedValue = Math.max(0, Math.min(100, value));

    return (
      <div className="nyn-progress-wrapper" style={{ width: '100%' }} ref={ref}>
        <ProgressBar
          value={clampedValue}
          color={color}
          size={size}
          aria-label={label}
          className={cn('nyn-progress', className)}
          {...(rest as any)}>
          {showLabel && (
            <ProgressBar.Output>
              {label} — {clampedValue}%
            </ProgressBar.Output>
          )}
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    );
  })
);

NProgress.displayName = 'NProgress';
