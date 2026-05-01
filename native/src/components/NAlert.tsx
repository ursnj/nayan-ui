import React from 'react';
import { Alert, type AlertRootProps } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NAlertProps extends AlertRootProps {
  title?: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const NAlert = React.memo<NAlertProps>(({ title, description, className, titleClassName, descriptionClassName, ...props }) => {
  return (
    <Alert className={cn('w-full bg-surface', className)} {...props}>
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title className={cn('font-medium mb-1', titleClassName)}>{title}</Alert.Title>}
        {description && <Alert.Description className={cn('text-sm', descriptionClassName)}>{description}</Alert.Description>}
      </Alert.Content>
    </Alert>
  );
});

NAlert.displayName = 'NAlert';
