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
            <Modal.Dialog className={cn('nyn-confirm-alert border border-default bg-surface p-4 rounded', className)} role="alertdialog">
              <Modal.Header>
                <span className={cn('nyn-confirm-alert-title text-foreground text-lg font-semibold', titleClassName)}>{title}</span>
              </Modal.Header>
              <Modal.Body>
                <p className={cn('nyn-confirm-alert-message text-muted text-sm mt-2', messageClassName)}>{message}</p>
                {children}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  className={cn('text-foreground bg-surface border border-default rounded px-3 py-2 text-sm hover:bg-default/50', cancelClassName)}
                  onPress={() => {
                    onResult(false);
                    onClose();
                  }}>
                  {cancelText}
                </Button>
                <Button
                  variant="primary"
                  className={cn('text-accent-foreground bg-accent rounded px-3 py-2 text-sm hover:bg-accent/90', confirmClassName)}
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
