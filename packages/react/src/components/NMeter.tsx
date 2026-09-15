import React, { memo } from 'react';
import { Meter } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NMeterProps {
  value: number;
  minValue?: number;
  maxValue?: number;
  label?: string;
  showOutput?: boolean;
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

const NMeterComponent: React.FC<NMeterProps> = memo(
  ({
    value,
    minValue = 0,
    maxValue = 100,
    label,
    showOutput = true,
    color = 'accent',
    size = 'md',
    className = '',
    'aria-label': ariaLabel = 'Meter'
  }) => {
    const lowerBound = Math.min(minValue, maxValue);
    const upperBound = Math.max(minValue, maxValue);
    const clampedValue = Math.min(upperBound, Math.max(lowerBound, value));
    const percentage = upperBound === lowerBound ? 0 : Math.round(((clampedValue - lowerBound) / (upperBound - lowerBound)) * 100);

    return (
      <Meter
        value={clampedValue}
        minValue={lowerBound}
        maxValue={upperBound}
        color={color}
        size={size}
        className={cn('nyn-meter', className)}
        aria-label={ariaLabel}>
        {showOutput && <Meter.Output>{label || `${percentage}%`}</Meter.Output>}
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>
    );
  }
);

NMeterComponent.displayName = 'NMeter';

export const NMeter = NMeterComponent;
