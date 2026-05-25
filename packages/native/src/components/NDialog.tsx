import React from 'react';
import { View } from 'react-native';
import { Dialog, cn } from 'heroui-native';

export interface NDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  isOpen?: boolean;
  isDefaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  isSwipeable?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
}

export const NDialog = React.memo<NDialogProps>(
  ({
    children,
    trigger,
    title,
    description,
    isOpen,
    isDefaultOpen,
    onOpenChange,
    isSwipeable,
    className = '',
    titleClassName = '',
    descriptionClassName = '',
    contentClassName = ''
  }) => {
    return (
      <Dialog isOpen={isOpen} isDefaultOpen={isDefaultOpen} onOpenChange={onOpenChange}>
        {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
        <Dialog.Portal>
          <Dialog.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <Dialog.Content isSwipeable={isSwipeable} className={cn('rounded-xl bg-surface px-4 py-3', className)}>
            <Dialog.Title className={cn(titleClassName)}>{title}</Dialog.Title>
            {description && <Dialog.Description className={cn('mt-1', descriptionClassName)}>{description}</Dialog.Description>}
            <View className={cn('mt-2', contentClassName)}>{children}</View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    );
  }
);

NDialog.displayName = 'NDialog';
