import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button, type ButtonRootProps, type ButtonSize, type ButtonVariant, cn } from 'heroui-native';
import { type NIcon, resolveIcon } from '../helpers/icons';

export type NButtonVariant = ButtonVariant;
export type NButtonSize = ButtonSize;

export type NButtonProps = ButtonRootProps & {
  children: React.ReactNode;
  icon?: NIcon;
  iconSize?: number;
};

export const NButton = React.memo<NButtonProps>(({ children, icon, iconSize = 16, variant = 'primary', size = 'md', className, ...props }) => {
  const buttonIcon = useMemo(() => resolveIcon(icon, { size: iconSize }), [icon, iconSize]);

  return (
    <Button variant={variant} size={size} className={cn('rounded-xl', className)} {...props}>
      {buttonIcon && <View className="mr-2">{buttonIcon}</View>}
      <Button.Label>{children}</Button.Label>
    </Button>
  );
});

NButton.displayName = 'NButton';
