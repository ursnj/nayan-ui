import React from 'react';
import { NText } from '@/components/NText';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export interface NConfirmProps {
  title: string;
  description: string;
  onResult: (result: boolean) => void;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  confirmClassName?: string;
  cancelClassName?: string;
}

export const NConfirm = React.memo<NConfirmProps>(
  ({
    title,
    description,
    children,
    onResult,
    confirmText = 'Ok',
    cancelText = 'Cancel',
    className = '',
    titleClassName = '',
    descriptionClassName = '',
    confirmClassName = '',
    cancelClassName = ''
  }) => {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent className={cn('bg-card p-3 min-w-[320px]', className)}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn('text-text', titleClassName)}>{title}</AlertDialogTitle>
            <AlertDialogDescription className={cn('text-text', descriptionClassName)}>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row">
            <AlertDialogAction onPress={() => onResult(true)}>
              <NText className={cn('text-white', confirmClassName)}>{confirmText}</NText>
            </AlertDialogAction>
            <AlertDialogCancel className="border-muted bg-border" onPress={() => onResult(false)}>
              <NText className={cn('text-text', cancelClassName)}>{cancelText}</NText>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

NConfirm.displayName = 'NConfirm';
