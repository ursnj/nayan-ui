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

export interface NAlertProps {
  type: AlertTypes;
  message?: string;
  title?: string;
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
  ({ className = '', titleClassName = '', messageClassName = '', closeClassName = '', type, title, message, icon, actions, onClose, children }) => {
    return (
      <Alert status={statusMapping[type]} className={cn('nyn-alert', className)}>
        <Alert.Indicator>{icon}</Alert.Indicator>
        <Alert.Content>
          <Alert.Title className={cn('nyn-alert-title', titleClassName)}>{title ?? titleMapping[type]}</Alert.Title>
          {(message || children) && (
            <Alert.Description className={cn('nyn-alert-message', messageClassName)}>{message || children}</Alert.Description>
          )}
        </Alert.Content>
        {actions}
        {onClose && <CloseButton className={cn(closeClassName)} onPress={onClose} />}
      </Alert>
    );
  }
);

NAlertComponent.displayName = 'NAlert';

export const NAlert = NAlertComponent;
