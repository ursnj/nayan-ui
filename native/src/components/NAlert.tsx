import React from 'react';
import { Alert } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NAlertProps {
  title?: string;
  description: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const NAlert = React.memo<NAlertProps>(({ title, description, className, titleClassName, descriptionClassName }) => {
  return (
    <Alert className={cn('w-full', className)}>
      {title && <Alert.Title className={cn('font-medium mb-1', titleClassName)}>{title}</Alert.Title>}
      <Alert.Description className={cn('text-sm', descriptionClassName)}>{description}</Alert.Description>
    </Alert>
  );
});

NAlert.displayName = 'NAlert';
