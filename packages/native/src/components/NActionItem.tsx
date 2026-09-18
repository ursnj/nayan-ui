import React, { useMemo } from 'react';
import { View } from 'react-native';
import { cn, useThemeColor } from 'heroui-native';
import { ChevronForwardIcon, type NIcon, resolveIcon } from '../helpers/icons';
import { NPress } from './NPress';
import { NText } from './NText';

export interface NActionItemProps {
  name: string;
  description?: string;
  icon?: NIcon;
  showArrow?: boolean;
  feedback?: boolean;
  isDisabled?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const NActionItem = React.memo<NActionItemProps>(
  ({
    name,
    description,
    icon,
    showArrow = true,
    feedback = false,
    isDisabled = false,
    className,
    titleClassName,
    descriptionClassName,
    onPress,
    onLongPress
  }) => {
    const [mutedColor, foregroundColor] = useThemeColor(['muted', 'foreground']);
    const actionIcon = useMemo(() => resolveIcon(icon, { color: foregroundColor }), [icon, foregroundColor]);

    return (
      <NPress
        feedback={feedback}
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
