import React, { ReactNode, memo } from 'react';
import { ProgressCircle } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NProgressCircleProps {
  value?: number;
  minValue?: number;
  maxValue?: number;
  /** Omit `value` for an indeterminate circle. */
  isIndeterminate?: boolean;
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Rendered in the middle of the circle — a percentage, a count, an icon. */
  children?: ReactNode;
  className?: string;
  trackClassName?: string;
  'aria-label'?: string;
}

const NProgressCircleComponent: React.FC<NProgressCircleProps> = memo(
  ({
    value,
    minValue = 0,
    maxValue = 100,
    isIndeterminate = false,
    color = 'accent',
    size = 'md',
    children,
    className = '',
    trackClassName = '',
    'aria-label': ariaLabel = 'Progress'
  }) => {
    return (
      <ProgressCircle
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        isIndeterminate={isIndeterminate}
        color={color}
        size={size}
        className={cn('nyn-progress-circle', className)}
        aria-label={ariaLabel}>
        <ProgressCircle.Track className={cn(trackClassName)}>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
        {children}
      </ProgressCircle>
    );
  }
);

NProgressCircleComponent.displayName = 'NProgressCircle';

export const NProgressCircle = NProgressCircleComponent;
