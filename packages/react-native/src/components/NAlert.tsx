import React from 'react';
import { View } from 'react-native';
import { NText } from '@/components/NText';
import { AlertCircle } from '@/lib/icons/AlertCircle';
import { cn } from '@/lib/utils';

export interface NAlertProps {
  title?: string;
  description: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  iconClassName?: string;
}

export const NAlert = React.memo<NAlertProps>(({ title, description, className, titleClassName, descriptionClassName, iconClassName }) => {
  return (
    <View className={cn('w-full flex-row items-start gap-3 bg-surface border border-separator rounded p-4', className)}>
      <AlertCircle className={cn('w-5 h-5 text-foreground mt-0.5', iconClassName)} />
      <View className="flex-1">
        {title && <NText className={cn('font-medium mb-1', titleClassName)}>{title}</NText>}
        <NText className={cn('text-sm', descriptionClassName)}>{description}</NText>
      </View>
    </View>
  );
});

NAlert.displayName = 'NAlert';
