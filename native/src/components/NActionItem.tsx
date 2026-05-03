import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { ChevronForwardIcon } from '../helpers/icons';
import { cn } from '../helpers/utils';
import { NPress } from './NPress';
import { NText } from './NText';

export interface NActionItemProps {
  name: string;
  description?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  showArrow?: boolean;
  isDisabled?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const NActionItem = React.memo<NActionItemProps>(
  ({ name, description, icon, showArrow = true, isDisabled = false, className, titleClassName, descriptionClassName, onPress, onLongPress }) => {
    const mutedColor = useThemeColor('muted');
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
        feedback
        className={cn('flex-row items-center px-4 py-3 bg-surface rounded-xl', isDisabled && 'opacity-50', className)}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={isDisabled}>
        {actionIcon}
        <View className={cn('flex-1', actionIcon && 'ml-3')}>
          <NText className={cn('font-medium', titleClassName)}>{name}</NText>
          {description && <NText className={cn('text-sm text-muted mt-0.5', descriptionClassName)}>{description}</NText>}
        </View>
        {showArrow && <ChevronForwardIcon size={16} color={mutedColor} />}
      </NPress>
    );
  }
);

NActionItem.displayName = 'NActionItem';
