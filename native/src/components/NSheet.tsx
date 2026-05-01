import React from 'react';
import { BottomSheet } from 'heroui-native';
import { cn } from '../helpers/utils';

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
        <BottomSheet.Content className={cn('flex-1 bg-surface', className)}>
          {title && <BottomSheet.Title className={titleClassName}>{title}</BottomSheet.Title>}
          {description && <BottomSheet.Description className={descriptionClassName}>{description}</BottomSheet.Description>}
          {children}
        </BottomSheet.Content>
      </BottomSheet>
    );
  }
);

NSheet.displayName = 'NSheet';
