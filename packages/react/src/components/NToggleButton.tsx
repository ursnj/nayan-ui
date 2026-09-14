import React, { ReactNode, memo } from 'react';
import { ToggleButton } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NToggleButtonProps {
  children: ReactNode;
  isSelected?: boolean;
  defaultSelected?: boolean;
  isDisabled?: boolean;
  isIconOnly?: boolean;
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onChange?: (isSelected: boolean) => void;
  className?: string;
  /**
   * Required for an icon-only toggle — there is no visible text to name it,
   * and without this assistive tech announces an unlabelled button.
   */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const NToggleButtonComponent: React.FC<NToggleButtonProps> = memo(
  ({
    children,
    isSelected,
    defaultSelected = false,
    isDisabled = false,
    isIconOnly = false,
    variant = 'default',
    size = 'md',
    onChange,
    className = '',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy
  }) => {
    return (
      <ToggleButton
        isSelected={isSelected}
        defaultSelected={defaultSelected}
        isDisabled={isDisabled}
        isIconOnly={isIconOnly}
        variant={variant}
        size={size}
        onChange={onChange}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn('nyn-toggle-button', className)}>
        {children}
      </ToggleButton>
    );
  }
);

NToggleButtonComponent.displayName = 'NToggleButton';

export const NToggleButton = NToggleButtonComponent;
