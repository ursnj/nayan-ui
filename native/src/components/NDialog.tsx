import React from 'react';
import { View } from 'react-native';
import { Dialog } from 'heroui-native';
import { cn } from '../helpers/utils';

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
  contentClassName?: string;
}

export const NDialog = React.memo<NDialogProps>(
  ({ children, trigger, title, description, isOpen, isDefaultOpen, onOpenChange, isSwipeable, className = '', titleClassName = '', contentClassName = '' }) => {
    return (
      <Dialog isOpen={isOpen} isDefaultOpen={isDefaultOpen} onOpenChange={onOpenChange}>
        {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={isSwipeable} className={cn('rounded-lg min-w-[320px] sm:max-w-[425px] bg-surface', className)}>
            <Dialog.Title className={cn('px-3 pt-3', titleClassName)}>{title}</Dialog.Title>
            {description && <Dialog.Description className="px-3 text-muted">{description}</Dialog.Description>}
            <View className={contentClassName}>{children}</View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    );
  }
);

NDialog.displayName = 'NDialog';
