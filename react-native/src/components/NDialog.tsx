import React from 'react';
import { View } from 'react-native';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className={cn('border-border rounded p-0 min-w-[320px] sm:max-w-[425px]', className)}>
          <DialogHeader className={cn('px-3 py-2', headerClassName)}>
            <DialogTitle className={cn('text-text', headerTitleClassName)}>{title}</DialogTitle>
          </DialogHeader>
          <View className={contentClassName}>{children}</View>
        </DialogContent>
      </Dialog>
    );
  }
);

NDialog.displayName = 'NDialog';
