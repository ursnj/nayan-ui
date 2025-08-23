import React, { ReactNode, memo } from 'react';
import { cn } from '../lib/utils';
import { DialogSize } from './Types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const sizeMapping = {
  [DialogSize.XS]: 'max-w-sm',
  [DialogSize.SM]: 'max-w-lg',
  [DialogSize.MD]: 'max-w-2xl',
  [DialogSize.LG]: 'max-w-4xl'
};

export interface NDialogProps extends Omit<React.ComponentProps<typeof Dialog>, 'open' | 'onOpenChange'> {
  isOpen: boolean;
  title: string;
  size?: DialogSize;
  className?: string;
  titleClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
  onClose: () => void;
}

const NDialogComponent: React.FC<NDialogProps> = memo(
  ({
    isOpen,
    title,
    children,
    size = DialogSize.SM,
    className = '',
    headerClassName = '',
    titleClassName = '',
    contentClassName = '',
    onClose,
    ...rest
  }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose} {...rest}>
        <DialogContent
          className={cn('nyn-dialog p-0 gap-0 border border-border bg-card text-white rounded overflow-hidden', sizeMapping[size], className)}>
          <DialogHeader className={cn('nyn-dialog-header px-3 py-2.5 bg-primary text-white', headerClassName)}>
            <DialogTitle className={cn('nyn-dialog-title text-base font-normal', titleClassName)}>{title}</DialogTitle>
          </DialogHeader>
          <div
            className={cn(
              'nyn-dialog-content text-text h-[calc(100vh_-_140px)] sm:h-auto sm:min-h-[100px] sm:max-h-[calc(100vh_-_75px)] overflow-y-auto',
              contentClassName
            )}>
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

NDialogComponent.displayName = 'NDialog';

export const NDialog = NDialogComponent;
