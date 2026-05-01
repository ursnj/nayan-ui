import React from 'react';
import { Button, type ButtonRootProps, type ButtonVariant, type ButtonSize } from 'heroui-native';

export type NButtonVariant = ButtonVariant;
export type NButtonSize = ButtonSize;

export type NButtonProps = ButtonRootProps & {
  variant?: NButtonVariant;
  size?: NButtonSize;
  children: React.ReactNode;
};

export function NButton({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: NButtonProps) {
  return (
    <Button variant={variant} size={size} {...props}>
      {children}
    </Button>
  );
}
