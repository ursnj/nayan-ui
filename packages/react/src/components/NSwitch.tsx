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
  name?: string;
  value?: string;
  isRequired?: boolean;
  'aria-label'?: string;
}

export const NSwitch: React.FC<NSwitchProps> = React.memo(
  ({
    label,
    enabled,
    defaultChecked,
    disabled = false,
    onChange,
    className = '',
    switchClassName = '',
    labelClassName = '',
    id,
    name,
    value,
    isRequired = false,
    'aria-label': ariaLabel
  }) => {
    const generatedId = useId();
    const switchId = id || `nyn-switch-${generatedId}`;

    return (
      <Switch
        id={switchId}
        name={name}
        value={value}
        isSelected={enabled}
        defaultSelected={enabled === undefined ? defaultChecked : undefined}
        isDisabled={disabled}
        isRequired={isRequired}
        onChange={onChange}
        aria-label={ariaLabel || (!label ? 'Switch' : undefined)}
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
