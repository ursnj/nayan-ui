import React, { ReactNode, memo } from 'react';
import { Checkbox } from '@heroui/react';
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
      <Checkbox isSelected={checked} isDisabled={disabled} onChange={onChange} className={cn('nyn-check', className)} {...(rest as any)}>
        <Checkbox.Control className={cn(checkClassName)}>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content className={cn('inline', labelClassName)}>{children}</Checkbox.Content>
      </Checkbox>
    );
  }
);

NCheckComponent.displayName = 'NCheck';

export const NCheck = NCheckComponent;
