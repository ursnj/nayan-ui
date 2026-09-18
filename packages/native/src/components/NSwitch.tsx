import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Label, Switch, type SwitchProps, cn, useThemeColor } from 'heroui-native';

export interface NSwitchProps extends Omit<SwitchProps, 'children'> {
  label?: string;
  /** Alias of `isSelected`; `enabled` is the React package's name for it. */
  checked?: boolean;
  enabled?: boolean;
  /** Alias of `onSelectedChange`. */
  onChange?: (checked: boolean) => void;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export const NSwitch = React.memo<NSwitchProps>(
  ({
    label,
    checked,
    enabled,
    onChange,
    disabled,
    containerClassName = '',
    labelClassName = '',
    className = '',
    isDisabled,
    isSelected,
    onSelectedChange,
    animation,
    ...props
  }) => {
    const selected = checked ?? enabled ?? isSelected ?? false;
    const off = disabled ?? isDisabled ?? false;
    const change = onChange ?? onSelectedChange;
    const [surface, accent] = useThemeColor(['surface', 'accent']);

    const switchAnimation = useMemo(
      () =>
        animation ?? {
          backgroundColor: { value: [surface, accent] as [string, string] }
        },
      [animation, surface, accent]
    );

    const thumbAnimation = useMemo(
      () => ({
        backgroundColor: { value: [accent, surface] as [string, string] }
      }),
      [accent, surface]
    );

    const handleToggle = () => {
      if (!off) {
        change?.(!selected);
      }
    };

    return (
      <View className={cn('w-full flex-row items-center justify-between mb-3', containerClassName)}>
        {label && (
          <Label className={cn('flex-1 text-foreground text-base pr-3', labelClassName)} nativeID={'switch-' + label} onPress={handleToggle}>
            {label}
          </Label>
        )}
        <Switch
          isDisabled={off}
          isSelected={selected}
          onSelectedChange={handleToggle}
          className={cn(className)}
          nativeID={'switch-' + label}
          animation={switchAnimation}
          {...props}>
          <Switch.Thumb animation={thumbAnimation} />
        </Switch>
      </View>
    );
  }
);

NSwitch.displayName = 'NSwitch';
