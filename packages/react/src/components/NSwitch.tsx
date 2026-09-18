import React, { useId } from 'react';
import { Label, Switch } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NSwitchProps {
  enabled?: boolean;
  /** Alias of `enabled`, as the React Native package names it. */
  checked?: boolean;
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
  ({ label, enabled, checked, defaultChecked, disabled = false, onChange, className = '', switchClassName = '', labelClassName = '', id }) => {
    const generatedId = useId();
    const switchId = id || `nyn-switch-${generatedId}`;

    return (
      <Switch
        id={switchId}
        isSelected={checked ?? enabled}
        defaultSelected={defaultChecked}
        isDisabled={disabled}
        onChange={onChange}
        className={cn('nyn-switch flex items-center justify-between gap-3', className, switchClassName)}>
        <Switch.Content className="flex w-full items-center justify-between gap-3">
          {label && <Label className={cn(labelClassName)}>{label}</Label>}
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    );
  }
);

NSwitch.displayName = 'NSwitch';
