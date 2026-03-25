import React, { useMemo } from 'react';
import { View } from 'react-native';
import { NPress } from '@/components/NPress';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface NActionItemProps {
  name: string;
  description?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  disabled?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const NActionItem = React.memo<NActionItemProps>(
  ({ name, description, icon, disabled = false, className, titleClassName, descriptionClassName, onPress, onLongPress }) => {
    const actionIcon = useMemo(() => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return icon;
      }

      const IconComponent = icon as React.ComponentType<any>;
      return <IconComponent />;
    }, [icon]);

    return (
      <NPress
        className={cn('flex-row items-center px-3 py-2 bg-card', disabled && 'opacity-50', className)}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}>
        {actionIcon}
        <View className={cn('flex-1', actionIcon && 'ml-3')}>
          <NText className={cn('font-medium', titleClassName)}>{name}</NText>
          {description && <NText className={cn('text-sm text-muted mt-0.5', descriptionClassName)}>{description}</NText>}
        </View>
      </NPress>
    );
  }
);

NActionItem.displayName = 'NActionItem';
