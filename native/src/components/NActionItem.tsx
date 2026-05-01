import React, { useMemo } from 'react';
import { View } from 'react-native';
import { NPress } from './NPress';
import { NText } from './NText';
import { cn } from '../helpers/utils';

export interface NActionItemProps {
  name: string;
  description?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  isDisabled?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const NActionItem = React.memo<NActionItemProps>(
  ({ name, description, icon, isDisabled = false, className, titleClassName, descriptionClassName, onPress, onLongPress }) => {
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
        className={cn('flex-row items-center px-3 py-2 bg-surface', isDisabled && 'opacity-50', className)}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={isDisabled}>
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
