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

/**
 * A switch with an optional label beside it.
 *
 * Like `ProgressBar`, HeroUI's `Switch` is compound: the root handles state
 * and accessibility, and the track and thumb you can actually see are
 * `Switch.Control` and `Switch.Thumb`. With neither supplied the component
 * rendered its label and an invisible hit area — the toggle was not drawn.
 *
 * The label now carries `htmlFor` against the switch's `id`, so clicking the
 * text toggles it. Previously the generated id was computed and thrown away,
 * leaving the two unconnected.
 */
export const NSwitch: React.FC<NSwitchProps> = React.memo(
  ({ label, enabled, defaultChecked, disabled = false, onChange, className = '', switchClassName = '', labelClassName = '', id }) => {
    const generatedId = useId();
    const switchId = id || `nyn-switch-${generatedId}`;

    return (
      <div className={cn('flex items-center justify-between gap-3', className)}>
        {label && (
          <Label htmlFor={switchId} className={cn(labelClassName)}>
            {label}
          </Label>
        )}
        <Switch
          id={switchId}
          isSelected={enabled}
          defaultSelected={defaultChecked}
          isDisabled={disabled}
          onChange={onChange}
          className={cn('nyn-switch', switchClassName)}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
    );
  }
);

NSwitch.displayName = 'NSwitch';
