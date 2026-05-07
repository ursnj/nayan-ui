import React, { ReactNode, memo } from 'react';
import { Button, Modal } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NConfirmAlertProps {
  isOpen: boolean;
  message: string;
  title?: string;
  className?: string;
  titleClassName?: string;
  messageClassName?: string;
  cancelClassName?: string;
  confirmClassName?: string;
  confirmText?: string;
  cancelText?: string;
  onResult: (result: boolean) => void;
  onClose: () => void;
  children?: ReactNode;
}

const NConfirmAlertComponent: React.FC<NConfirmAlertProps> = memo(
  ({
    isOpen,
    title = 'Are you absolutely sure?',
    message,
    className = '',
    titleClassName = '',
    messageClassName = '',
    confirmClassName = '',
    cancelClassName = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onResult,
    onClose,
    children,
    ...rest
  }) => {
    return (
      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={open => {
            if (!open) onClose();
          }}>
          <Modal.Container size="sm">
            <Modal.Dialog className={cn('nyn-confirm-alert', className)} role="alertdialog">
              <Modal.Header>
                <span className={cn(titleClassName)}>{title}</span>
              </Modal.Header>
              <Modal.Body>
                <p className={cn(messageClassName)}>{message}</p>
                {children}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  className={cn(cancelClassName)}
                  onPress={() => {
                    onResult(false);
                    onClose();
                  }}>
                  {cancelText}
                </Button>
                <Button
                  variant="primary"
                  className={cn(confirmClassName)}
                  onPress={() => {
                    onResult(true);
                    onClose();
                  }}>
                  {confirmText}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    );
  }
);

NConfirmAlertComponent.displayName = 'NConfirmAlert';

export const NConfirmAlert = NConfirmAlertComponent;
