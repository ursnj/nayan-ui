import React, { useMemo } from 'react';
import { type PressableProps } from 'react-native';
import { View } from 'react-native';
import { NPress } from '@/components/NPress';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface NButtonProps extends PressableProps {
  children: React.ReactNode;
  icon?: React.ComponentType<any> | React.ReactElement;
  className?: string;
  textClassName?: string;
}

export const NButton = React.memo<NButtonProps>(({ children, icon, className, textClassName, disabled, ...props }) => {
  const buttonIcon = useMemo(() => {
    if (!icon) return null;

    if (React.isValidElement(icon)) {
      return icon;
    }

    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent size={16} />;
  }, [icon]);

  return (
    <NPress
      className={cn(
        'flex-row items-center justify-center rounded border px-5 py-3 bg-primary border-primary active:opacity-90',
        disabled && 'opacity-60',
        className
      )}
      role="button"
      disabled={disabled}
      {...props}>
      {buttonIcon && <View className="mr-2">{buttonIcon}</View>}
      <NText className={cn('text-center font-medium text-white', textClassName)}>{children}</NText>
    </NPress>
  );
});

NButton.displayName = 'NButton';
