import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Button } from 'heroui-native';
import { cn } from '../helpers/utils';
import { NDialog } from './NDialog';

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
    cancelClassName = '',
  }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = isOpenProp !== undefined;
    const isOpen = isControlled ? isOpenProp : internalOpen;

    const onOpenChange = useCallback((open: boolean) => {
      if (!isControlled) setInternalOpen(open);
      onOpenChangeProp?.(open);
    }, [isControlled, onOpenChangeProp]);

    const handleResult = useCallback((result: boolean) => {
      onOpenChange(false);
      onResult(result);
    }, [onOpenChange, onResult]);

    return (
      <NDialog
        title={title}
        description={description}
        trigger={children}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className={cn(className)}
        titleClassName={titleClassName}
        contentClassName="">
        <View className="flex-row gap-3 justify-end mt-4">
          <Button variant="secondary" onPress={() => handleResult(false)} className={cn(cancelClassName)}>
            {cancelText}
          </Button>
          <Button variant="primary" onPress={() => handleResult(true)} className={cn(confirmClassName)}>
            {confirmText}
          </Button>
        </View>
      </NDialog>
    );
  }
);

NConfirm.displayName = 'NConfirm';
