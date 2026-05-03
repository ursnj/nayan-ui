import React from 'react';
import { Alert, useThemeColor, type AlertRootProps } from 'heroui-native';
import { NPress } from './NPress';
import { CloseIcon } from '../helpers/icons';
import { cn } from '../helpers/utils';

export interface NAlertProps extends AlertRootProps {
  title?: string;
  description?: string;
  onClose?: () => void;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const NAlert = React.memo<NAlertProps>(({ title, description, onClose, className, titleClassName, descriptionClassName, ...props }) => {
  const mutedColor = useThemeColor('muted');

  return (
    <Alert className={cn('w-full bg-surface px-4 py-3', className)} {...props}>
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title className={cn('font-medium mb-1', titleClassName)}>{title}</Alert.Title>}
        {description && <Alert.Description className={cn('text-sm', descriptionClassName)}>{description}</Alert.Description>}
      </Alert.Content>
      {onClose && (
        <NPress onPress={onClose} hitSlop={8}>
          <CloseIcon size={18} color={mutedColor} />
        </NPress>
      )}
    </Alert>
  );
});

NAlert.displayName = 'NAlert';
