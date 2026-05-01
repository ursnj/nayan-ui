import React from 'react';
import { View } from 'react-native';
import { Dialog } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  title: string;
  className?: string;
  headerClassName?: string;
  headerTitleClassName?: string;
  contentClassName?: string;
}

export const NDialog = React.memo<NDialogProps>(
  ({ children, trigger, title, className = '', headerTitleClassName = '', contentClassName = '' }) => {
    return (
      <Dialog>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
        <Dialog.Content className={cn('rounded min-w-[320px] sm:max-w-[425px]', className)}>
          <Dialog.Title className={cn('px-3 pt-3', headerTitleClassName)}>{title}</Dialog.Title>
          <View className={contentClassName}>{children}</View>
        </Dialog.Content>
      </Dialog>
    );
  }
);

NDialog.displayName = 'NDialog';
