import React, { memo } from 'react';
import { AlertTriangle, BadgeAlert, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { AlertTypes } from './Types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const iconsMapping = {
  [AlertTypes.DEFAULT]: <BadgeAlert className="h-4 w-4" />,
  [AlertTypes.INFO]: <Info className="h-4 w-4" />,
  [AlertTypes.SUCCESS]: <CheckCircle2 className="h-4 w-4" />,
  [AlertTypes.WARNING]: <AlertTriangle className="h-4 w-4" />,
  [AlertTypes.ERROR]: <XCircle className="h-4 w-4" />
};

const classesMapping = {
  [AlertTypes.DEFAULT]: 'bg-card text-text border-border',
  [AlertTypes.INFO]: 'bg-blue-300 text-blue-700 border border-blue-400',
  [AlertTypes.SUCCESS]: 'bg-green-300 text-green-700 border border-green-400',
  [AlertTypes.WARNING]: 'bg-yellow-300 text-yellow-700 border border-yellow-400',
  [AlertTypes.ERROR]: 'bg-red-300 text-red-700 border border-red-400'
};

const titleMapping = {
  [AlertTypes.DEFAULT]: 'Alert!',
  [AlertTypes.INFO]: 'Information!',
  [AlertTypes.SUCCESS]: 'Success!',
  [AlertTypes.WARNING]: 'Warning!',
  [AlertTypes.ERROR]: 'Error!'
};

export interface NAlertProps extends React.HTMLAttributes<HTMLDivElement> {
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
  role?: 'alert' | 'status';
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
    role = 'alert',
    children,
    ...rest
  }) => {
    return (
      <Alert
        role={role}
        tabIndex={0}
        aria-live={role === 'alert' ? 'assertive' : 'polite'}
        className={cn(
          `nyn-alert ${type.toLowerCase()} [&:has(svg)]:pl-10 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3 [&>svg]:nyn-text rounded p-3 ${classesMapping[type]}`,
          className
        )}
        {...rest}>
        {icon !== undefined ? icon : iconsMapping[type]}
        <div className="flex items-start justify-between w-full">
          <div className="flex-1">
            <AlertTitle className={cn('nyn-alert-title font-semibold', titleClassName)}>{title ?? titleMapping[type]}</AlertTitle>
            {(message || children) && (
              <AlertDescription className={cn('nyn-alert-message', messageClassName)}>{message || children}</AlertDescription>
            )}
          </div>
          {(onClose || actions) && (
            <div className="flex items-center ml-3">
              {actions}
              {onClose && (
                <button type="button" className={cn('ml-2 focus:outline-none', closeClassName)} aria-label="Close alert" onClick={onClose}>
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
      </Alert>
    );
  }
);

NAlertComponent.displayName = 'NAlert';

export const NAlert = NAlertComponent;
