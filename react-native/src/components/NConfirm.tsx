import React from 'react';
import { Dialog } from 'heroui-native';
import { View } from 'uniwind/components';

import { NText } from './NText';
import { cn } from '../lib/utils';

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
      <Dialog>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Content className={cn('bg-card p-3 min-w-[320px] border border-border rounded-lg', className)}>
          <View className="flex flex-col gap-2">
            <NText className={cn('text-text text-lg native:text-xl font-semibold', titleClassName)}>{title}</NText>
            <NText className={cn('text-text text-sm native:text-base', descriptionClassName)}>{description}</NText>
          </View>
          <View className="flex-row justify-end gap-2 mt-4">
            <Dialog.Close className={cn('px-4 py-2 rounded-md bg-primary border border-primary', confirmClassName)} onPress={() => onResult(true)}>
              <NText className="text-white">{confirmText}</NText>
            </Dialog.Close>
            <Dialog.Close className={cn('px-4 py-2 rounded-md bg-border border border-muted', cancelClassName)} onPress={() => onResult(false)}>
              <NText className="text-text">{cancelText}</NText>
            </Dialog.Close>
          </View>
        </Dialog.Content>
      </Dialog>
    );
  }
);

NConfirm.displayName = 'NConfirm';
