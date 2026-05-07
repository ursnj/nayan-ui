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
    className = ''
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
        className={cn('nyn-toggle-button', className)}>
        {children}
      </ToggleButton>
    );
  }
);

NToggleButtonComponent.displayName = 'NToggleButton';

export const NToggleButton = NToggleButtonComponent;
