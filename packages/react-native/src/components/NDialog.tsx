import React from 'react';
import { View } from 'react-native';
import { Dialog } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  title: string;
  className?: string;
  headerClassName?: string;
  headerTitleClassName?: string;
  contentClassName?: string;
}

export const NDialog = React.memo<NDialogProps>(({ children, trigger, title, className = '', headerTitleClassName = '', contentClassName = '' }) => {
  return (
    <Dialog>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className={cn('min-w-[320px]', className)}>
          <Dialog.Close />
          <Dialog.Title className={cn(headerTitleClassName)}>{title}</Dialog.Title>
          <View className={contentClassName}>{children}</View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
});

NDialog.displayName = 'NDialog';
