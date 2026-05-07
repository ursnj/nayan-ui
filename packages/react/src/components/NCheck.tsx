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
      <div className={cn('flex items-center gap-2', className)}>
        <Checkbox isSelected={checked} isDisabled={disabled} onChange={onChange} className={cn(checkClassName)} {...(rest as any)} />
        <Label className={cn(labelClassName)}>{children}</Label>
      </div>
    );
  }
);

NCheckComponent.displayName = 'NCheck';

export const NCheck = NCheckComponent;
