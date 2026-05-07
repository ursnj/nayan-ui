import React, { ReactNode, memo } from 'react';
import { Checkbox, Label } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NCheckProps {
  id?: string;
  className?: string;
  checkClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}

const NCheckComponent: React.FC<NCheckProps> = memo(
  ({ id = 'check', className = '', checkClassName = '', labelClassName = '', checked, disabled = false, onChange, children, ...rest }) => {
    return (
      <div className={cn('flex space-x-2 mb-3', className)}>
        <Checkbox isSelected={checked} isDisabled={disabled} onChange={onChange} className={cn('nyn-check', checkClassName)} {...(rest as any)} />
        <Label className={cn('-mt-1 text-foreground', labelClassName)}>{children}</Label>
      </div>
    );
  }
);

NCheckComponent.displayName = 'NCheck';

export const NCheck = NCheckComponent;
