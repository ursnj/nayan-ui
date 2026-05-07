import React, { ReactNode, memo } from 'react';
import { Chip } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NChipProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'soft';
  className?: string;
}

const NChipComponent: React.FC<NChipProps> = memo(({ children, size = 'md', color = 'default', variant = 'secondary', className = '' }) => {
  return (
    <Chip size={size} color={color} variant={variant} className={cn('nyn-chip', className)}>
      {children}
    </Chip>
  );
});

NChipComponent.displayName = 'NChip';

export const NChip = NChipComponent;
