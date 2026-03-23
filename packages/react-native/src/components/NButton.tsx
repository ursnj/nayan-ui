import React, { useMemo } from 'react';
import { Button } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NButtonProps {
  children: React.ReactNode;
  icon?: React.ComponentType<any> | React.ReactElement;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'danger-soft';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  isIconOnly?: boolean;
  onPress?: () => void;
  [key: string]: any;
}

export const NButton = React.memo<NButtonProps>(
  ({ children, icon, variant = 'primary', size = 'md', className, textClassName, disabled, isIconOnly, ...props }) => {
    const buttonIcon = useMemo(() => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return icon;
      }

      const IconComponent = icon as React.ComponentType<any>;
      return <IconComponent size={16} />;
    }, [icon]);

    return (
      <Button variant={variant} size={size} isDisabled={disabled} isIconOnly={isIconOnly} className={cn(className)} {...props}>
        {buttonIcon}
        <Button.Label className={cn(textClassName)}>{children}</Button.Label>
      </Button>
    );
  }
);

NButton.displayName = 'NButton';
