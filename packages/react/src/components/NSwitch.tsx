import React, { useId } from 'react';
import { Switch } from '@heroui/react';
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
      <Switch
        isSelected={enabled}
        defaultSelected={defaultChecked}
        isDisabled={disabled}
        onChange={onChange}
        className={cn('nyn-switch', className)}>
        <Switch.Content className={cn(switchClassName)}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          {label && <span className={cn(labelClassName)}>{label}</span>}
        </Switch.Content>
      </Switch>
    );
  }
);

NSwitch.displayName = 'NSwitch';
