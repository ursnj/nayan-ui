import React, { useId } from 'react';
import { Label, Switch } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NSwitchProps {
  enabled?: boolean;
  defaultChecked?: boolean;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  switchClassName?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const NSwitch: React.FC<NSwitchProps> = React.memo(
  ({ label, enabled, defaultChecked, disabled = false, onChange, className = '', switchClassName = '', labelClassName = '', id }) => {
    const generatedId = useId();
    const switchId = id || `nyn-switch-${generatedId}`;

    return (
      <div className={cn('flex items-center justify-between', className)}>
        {label && <Label className={cn('nyn-switch-label text-foreground leading-relaxed pr-3', labelClassName)}>{label}</Label>}
        <Switch
          isSelected={enabled}
          defaultSelected={defaultChecked}
          isDisabled={disabled}
          onChange={onChange}
          className={cn('nyn-switch', switchClassName)}
        />
      </div>
    );
  }
);

NSwitch.displayName = 'NSwitch';
