import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button, type ButtonRootProps, type ButtonVariant, type ButtonSize } from 'heroui-native';
import { cn } from '../lib/utils';

export type NButtonVariant = ButtonVariant;
export type NButtonSize = ButtonSize;

export type NButtonProps = ButtonRootProps & {
  children: React.ReactNode;
  icon?: React.ComponentType<any> | React.ReactElement;
  variant?: NButtonVariant;
  size?: NButtonSize;
  className?: string;
};

export const NButton = React.memo<NButtonProps>(({ children, icon, variant = 'primary', size = 'md', className, ...props }) => {
  const buttonIcon = useMemo(() => {
    if (!icon) return null;

    if (React.isValidElement(icon)) {
      return icon;
    }

    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent size={16} />;
  }, [icon]);

  return (
    <Button variant={variant} size={size} className={cn(className)} {...props}>
      {buttonIcon && <View className="mr-2">{buttonIcon}</View>}
      <Button.Label>{children}</Button.Label>
    </Button>
  );
});

NButton.displayName = 'NButton';
