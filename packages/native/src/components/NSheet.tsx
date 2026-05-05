import React from 'react';
import { BottomSheet, cn } from 'heroui-native';

export interface NSheetProps {
  isOpen?: boolean;
  isDefaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const NSheet = React.memo<NSheetProps>(
  ({ isOpen, isDefaultOpen, onOpenChange, trigger, title, description, children, className, titleClassName, descriptionClassName }) => {
    return (
      <BottomSheet isOpen={isOpen} isDefaultOpen={isDefaultOpen} onOpenChange={onOpenChange}>
        {trigger && <BottomSheet.Trigger asChild>{trigger}</BottomSheet.Trigger>}
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content className={cn('flex-1 bg-surface', className)} contentContainerClassName="p-0">
            {title && <BottomSheet.Title className={titleClassName}>{title}</BottomSheet.Title>}
            {description && <BottomSheet.Description className={descriptionClassName}>{description}</BottomSheet.Description>}
            {children}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    );
  }
);

NSheet.displayName = 'NSheet';
