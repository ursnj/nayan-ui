import React from 'react';
import { View } from 'react-native';
import { Dialog } from 'heroui-native';
import { NText } from '@/components/NText';
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

export const NDialog = React.memo<NDialogProps>(
  ({ children, trigger, title, className = '', headerClassName = '', headerTitleClassName = '', contentClassName = '' }) => {
    return (
      <Dialog>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
        <Dialog.Content className={cn('border border-border rounded p-0 min-w-[320px] sm:max-w-[425px] bg-card', className)}>
          <View className={cn('px-3 py-2', headerClassName)}>
            <NText className={cn('text-text text-lg native:text-xl font-semibold', headerTitleClassName)}>{title}</NText>
          </View>
          <View className={contentClassName}>{children}</View>
        </Dialog.Content>
      </Dialog>
    );
  }
);

NDialog.displayName = 'NDialog';
