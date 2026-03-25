import React from 'react';
import { Alert as HeroAlert } from 'heroui-native';
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
    <HeroAlert className={cn('w-full bg-card border-border shadow-none rounded', className)}>
      <HeroAlert.Indicator className={iconClassName}>
        <AlertCircle size={18} className="text-text" />
      </HeroAlert.Indicator>
      <HeroAlert.Content>
        {title && <HeroAlert.Title className={cn('text-text font-medium mb-1', titleClassName)}>{title}</HeroAlert.Title>}
        <HeroAlert.Description className={cn('text-text text-sm', descriptionClassName)}>{description}</HeroAlert.Description>
      </HeroAlert.Content>
    </HeroAlert>
  );
});

NAlert.displayName = 'NAlert';
