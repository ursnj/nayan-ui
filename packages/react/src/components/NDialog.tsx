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
      <Modal isOpen={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
        <Modal.Trigger className="hidden" aria-hidden="true"><span /></Modal.Trigger>
        <Modal.Backdrop isDismissable>
          <Modal.Container size={sizeMapping[size]}>
            <Modal.Dialog className={cn('nyn-dialog', maxWidthMapping[size], className)}>
              <Modal.Header className={cn(headerClassName)}>
                <span className={cn(titleClassName)}>{title}</span>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body
                className={cn('h-[calc(100vh_-_140px)] sm:h-auto sm:min-h-[100px] sm:max-h-[calc(100vh_-_75px)] overflow-y-auto', contentClassName)}>
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
