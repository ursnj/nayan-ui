import React, { memo } from 'react';
import { Alert, CloseButton } from '@heroui/react';
import { cn } from '../lib/utils';
import { AlertTypes } from './Types';

const statusMapping: Record<AlertTypes, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  [AlertTypes.DEFAULT]: 'default',
  [AlertTypes.INFO]: 'accent',
  [AlertTypes.SUCCESS]: 'success',
  [AlertTypes.WARNING]: 'warning',
  [AlertTypes.ERROR]: 'danger'
};

const titleMapping = {
  [AlertTypes.DEFAULT]: 'Alert!',
  [AlertTypes.INFO]: 'Information!',
  [AlertTypes.SUCCESS]: 'Success!',
  [AlertTypes.WARNING]: 'Warning!',
  [AlertTypes.ERROR]: 'Error!'
};

export interface NAlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  type: AlertTypes;
  message?: React.ReactNode;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  messageClassName?: string;
  closeClassName?: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

const NAlertComponent: React.FC<NAlertProps> = memo(
  ({
    className = '',
    titleClassName = '',
    messageClassName = '',
    closeClassName = '',
    type,
    title,
    message,
    icon,
    actions,
    onClose,
    children,
    ...rest
  }) => {
    const description = message ?? children;
    return (
      <Alert status={statusMapping[type]} className={cn('nyn-alert', className)} {...(rest as any)}>
        <Alert.Indicator>{icon}</Alert.Indicator>
        <Alert.Content>
          <Alert.Title className={cn('nyn-alert-title', titleClassName)}>{title ?? titleMapping[type]}</Alert.Title>
          {description != null && <Alert.Description className={cn('nyn-alert-message', messageClassName)}>{description}</Alert.Description>}
        </Alert.Content>
        {actions}
        {onClose && <CloseButton aria-label="Close alert" className={cn(closeClassName)} onPress={onClose} />}
      </Alert>
    );
  }
);

NAlertComponent.displayName = 'NAlert';

export const NAlert = NAlertComponent;
