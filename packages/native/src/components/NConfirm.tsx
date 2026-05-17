import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { cn } from 'heroui-native';
import { NDialog } from './NDialog';
import { NPress } from './NPress';
import { NText } from './NText';

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
    isOpen: isOpenProp,
    onOpenChange: onOpenChangeProp,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    className = '',
    titleClassName = '',
    confirmClassName = '',
    cancelClassName = ''
  }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = isOpenProp !== undefined;
    const isOpen = isControlled ? isOpenProp : internalOpen;

    const onOpenChange = useCallback(
      (open: boolean) => {
        if (!isControlled) setInternalOpen(open);
        onOpenChangeProp?.(open);
      },
      [isControlled, onOpenChangeProp]
    );

    const handleResult = useCallback(
      (result: boolean) => {
        onOpenChange(false);
        onResult(result);
      },
      [onOpenChange, onResult]
    );

    return (
      <NDialog
        title={title}
        description={description}
        trigger={children}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className={cn('min-w-[320px] sm:max-w-[425px]', className)}
        titleClassName={titleClassName}
        contentClassName="">
        <View className="mt-4 flex-row justify-end gap-3">
          <NPress onPress={() => handleResult(false)} className={cn('rounded-lg border border-border bg-surface px-4 py-2', cancelClassName)}>
            <NText className="text-base font-medium">{cancelText}</NText>
          </NPress>
          <NPress onPress={() => handleResult(true)} className={cn('rounded-lg bg-accent px-4 py-2', confirmClassName)}>
            <NText className="text-base font-medium text-white">{confirmText}</NText>
          </NPress>
        </View>
      </NDialog>
    );
  }
);

NConfirm.displayName = 'NConfirm';
