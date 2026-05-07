import React, { ReactNode, memo } from 'react';
import { Modal, useOverlayState } from '@heroui/react';
import { cn } from '../lib/utils';
import { DialogSize } from './Types';

const sizeMapping = {
  [DialogSize.XS]: 'sm' as const,
  [DialogSize.SM]: 'md' as const,
  [DialogSize.MD]: 'lg' as const,
  [DialogSize.LG]: 'lg' as const
};

const maxWidthMapping = {
  [DialogSize.XS]: 'max-w-sm',
  [DialogSize.SM]: 'max-w-lg',
  [DialogSize.MD]: 'max-w-2xl',
  [DialogSize.LG]: 'max-w-4xl'
};

export interface NDialogProps {
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
      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={open => {
            if (!open) onClose();
          }}
          isDismissable>
          <Modal.Container size={sizeMapping[size]}>
            <Modal.Dialog
              className={cn(
                'nyn-dialog p-0 border border-default bg-surface text-foreground rounded overflow-hidden',
                maxWidthMapping[size],
                className
              )}>
              <Modal.Header className={cn('nyn-dialog-header px-3 py-2.5 bg-accent text-accent-foreground', headerClassName)}>
                <span className={cn('nyn-dialog-title text-base font-normal', titleClassName)}>{title}</span>
              </Modal.Header>
              <Modal.Body
                className={cn(
                  'nyn-dialog-content text-foreground p-3 h-[calc(100vh_-_140px)] sm:h-auto sm:min-h-[100px] sm:max-h-[calc(100vh_-_75px)] overflow-y-auto',
                  contentClassName
                )}>
                {children}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    );
  }
);

NDialogComponent.displayName = 'NDialog';

export const NDialog = NDialogComponent;
