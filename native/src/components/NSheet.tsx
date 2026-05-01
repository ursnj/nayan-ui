import React from 'react';
import { BottomSheet } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const NSheet = React.memo<NSheetProps>(({ open, onOpenChange, children, className }) => {
  return (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange}>
      <BottomSheet.Content className={cn('flex-1', className)}>
        {children}
      </BottomSheet.Content>
    </BottomSheet>
  );
});

NSheet.displayName = 'NSheet';
