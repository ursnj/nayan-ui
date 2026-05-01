import React from 'react';
import { View } from 'react-native';
import { Dialog } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  title: string;
  isOpen?: boolean;
  isDefaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  isSwipeable?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const NDialog = React.memo<NDialogProps>(
  ({ children, trigger, title, isOpen, isDefaultOpen, onOpenChange, isSwipeable, className = '', titleClassName = '', contentClassName = '' }) => {
    return (
      <Dialog isOpen={isOpen} isDefaultOpen={isDefaultOpen} onOpenChange={onOpenChange}>
        {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
        <Dialog.Content isSwipeable={isSwipeable} className={cn('rounded min-w-[320px] sm:max-w-[425px]', className)}>
          <Dialog.Title className={cn('px-3 pt-3', titleClassName)}>{title}</Dialog.Title>
          <View className={contentClassName}>{children}</View>
        </Dialog.Content>
      </Dialog>
    );
  }
);

NDialog.displayName = 'NDialog';
