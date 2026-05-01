import React from 'react';
import { View } from 'react-native';
import { Dialog, Button } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NConfirmProps {
  title: string;
  description: string;
  onResult: (result: boolean) => void;
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
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
    isOpen,
    onOpenChange,
    confirmText = 'Ok',
    cancelText = 'Cancel',
    className = '',
    titleClassName = '',
    descriptionClassName = '',
    confirmClassName = '',
    cancelClassName = '',
  }) => {
    return (
      <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
        {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
        <Dialog.Content className={cn('p-3 min-w-[320px]', className)}>
          <Dialog.Title className={cn(titleClassName)}>{title}</Dialog.Title>
          <Dialog.Description className={cn('text-muted text-sm', descriptionClassName)}>{description}</Dialog.Description>
          <View className="flex-row gap-3 justify-end mt-4">
            <Button variant="primary" onPress={() => onResult(true)} className={cn(confirmClassName)}>
              {confirmText}
            </Button>
            <Button variant="secondary" onPress={() => onResult(false)} className={cn(cancelClassName)}>
              {cancelText}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog>
    );
  }
);

NConfirm.displayName = 'NConfirm';
