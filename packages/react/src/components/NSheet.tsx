import React, { ReactNode, memo } from 'react';
import { Drawer } from '@heroui/react';
import { cn } from '../lib/utils';
import { SheetSize } from './Types';

const sizeMapping: Record<SheetSize, string> = {
  [SheetSize.XS]: '!max-w-sm',
  [SheetSize.SM]: '!max-w-lg',
  [SheetSize.MD]: '!max-w-2xl',
  [SheetSize.LG]: '!max-w-4xl'
};

export interface NSheetProps {
  isOpen: boolean;
  title?: ReactNode;
  size?: SheetSize;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  children: ReactNode;
  onCloseSheet?: () => void;
  onClose?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  role?: string;
  [key: string]: any;
}

export const NSheet: React.FC<NSheetProps> = memo(
  ({
    isOpen,
    className = '',
    headerClassName = '',
    titleClassName = '',
    contentClassName = '',
    title,
    children,
    size = SheetSize.XS,
    onCloseSheet,
    onClose,
    header,
    footer,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    role = 'dialog',
    ...rest
  }) => {
    return (
      <Drawer
        isOpen={isOpen}
        onOpenChange={open => {
          if (!open) (onCloseSheet || onClose)?.();
        }}>
        <Drawer.Trigger className="hidden" aria-hidden="true">
          <span />
        </Drawer.Trigger>
        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="right" className={cn('nyn-sheet w-full p-4')}>
            <Drawer.Dialog
              className={cn('nyn-sheet-dialog h-full !w-full', sizeMapping[size], className)}
              aria-label={ariaLabel || (!title && !ariaLabelledBy ? 'Dialog' : undefined)}
              aria-labelledby={ariaLabelledBy}
              role={role as 'dialog' | 'alertdialog'}
              {...rest}>
              {header || (
                <Drawer.Header className={cn(headerClassName)}>
                  {title && <Drawer.Heading className={cn(titleClassName)}>{title}</Drawer.Heading>}
                  <Drawer.CloseTrigger aria-label="Close dialog" />
                </Drawer.Header>
              )}
              <Drawer.Body className={cn('h-[calc(100vh_-_44px)] overflow-y-auto', contentClassName)}>{children}</Drawer.Body>
              {footer && <Drawer.Footer className="nyn-sheet-footer">{footer}</Drawer.Footer>}
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    );
  }
);

NSheet.displayName = 'NSheet';
