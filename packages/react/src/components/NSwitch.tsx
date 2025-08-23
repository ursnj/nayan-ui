import React, { useId } from 'react';
import { cn } from '../lib/utils';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

export interface NSwitchProps extends Omit<React.ComponentPropsWithoutRef<typeof Switch>, 'checked' | 'onCheckedChange' | 'onChange' | 'id'> {
  enabled?: boolean;
  defaultChecked?: boolean;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  switchClassName?: string;
  onChange?: (checked: boolean) => void;
  id?: string;
}

export const NSwitch: React.FC<NSwitchProps> = React.memo(
  ({ label, enabled, defaultChecked, disabled = false, onChange, className = '', switchClassName = '', labelClassName = '', id }) => {
    const generatedId = useId();
    const switchId = id || `nyn-switch-${generatedId}`;

    return (
      <div className={cn('flex items-center justify-between', className)}>
        {label && (
          <Label htmlFor={switchId} className={cn('nyn-switch-label text-text leading-relaxed pr-3', labelClassName)}>
            {label}
          </Label>
        )}
        <Switch
          id={switchId}
          checked={enabled}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onCheckedChange={onChange}
          className={cn(
            'nyn-switch data-[state=checked]:border-primary data-[state=unchecked]:border-border data-[state=checked]:bg-primary data-[state=unchecked]:bg-border',
            switchClassName
          )}
          aria-checked={enabled}
        />
      </div>
    );
  }
);

NSwitch.displayName = 'NSwitch';
