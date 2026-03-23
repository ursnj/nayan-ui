import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog } from 'heroui-native';
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
    const [isOpen, setIsOpen] = useState(false);

    const handleResult = useCallback(
      (result: boolean) => {
        setIsOpen(false);
        onResult(result);
      },
      [onResult]
    );

    return (
      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className={cn('min-w-[320px]', className)}>
            <Dialog.Title className={cn(titleClassName)}>{title}</Dialog.Title>
            <Dialog.Description className={cn(descriptionClassName)}>{description}</Dialog.Description>
            <View className="flex-row justify-end gap-3 mt-4">
              <Button variant="ghost" onPress={() => handleResult(false)}>
                <Button.Label className={cn(cancelClassName)}>{cancelText}</Button.Label>
              </Button>
              <Button variant="primary" onPress={() => handleResult(true)}>
                <Button.Label className={cn(confirmClassName)}>{confirmText}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    );
  }
);

NConfirm.displayName = 'NConfirm';
