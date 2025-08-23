import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    <Alert icon={AlertCircle} className={cn('w-full bg-card border-border shadow-none rounded', className)} iconClassName={iconClassName}>
      {title && <AlertTitle className={cn('text-text font-medium mb-1', titleClassName)}>{title}</AlertTitle>}
      <AlertDescription className={cn('text-text text-sm', descriptionClassName)}>{description}</AlertDescription>
    </Alert>
  );
});

NAlert.displayName = 'NAlert';
