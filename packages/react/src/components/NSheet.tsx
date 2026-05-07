import React, { ReactNode, memo } from 'react';
import { Drawer } from '@heroui/react';
import { cn } from '../lib/utils';
import { SheetSize } from './Types';

const sizeMapping: Record<SheetSize, string> = {
  [SheetSize.XS]: 'md:max-w-sm',
  [SheetSize.SM]: 'md:max-w-lg',
  [SheetSize.MD]: 'md:max-w-2xl',
  [SheetSize.LG]: 'md:max-w-4xl'
};

export interface NSheetProps {
  isOpen: boolean;
  title?: string;
  size?: SheetSize;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  children: ReactNode;
  onCloseSheet?: () => void;
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
    header,
    footer,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    role = 'dialog',
    ...rest
  }) => {
    return (
      <Drawer>
        <Drawer.Backdrop
          isOpen={isOpen}
          onOpenChange={open => {
            if (!open && onCloseSheet) onCloseSheet();
          }}
          isDismissable>
          <Drawer.Content placement="right" className={cn('nyn-sheet w-full', sizeMapping[size])}>
            <Drawer.Dialog
              className={cn('nyn-sheet-dialog p-0 border-0 border-l border-default bg-surface text-foreground overflow-hidden h-full', className)}
              aria-label={ariaLabel}
              role={role as 'dialog' | 'alertdialog'}>
              {header || (
                <Drawer.Header className={cn('nyn-sheet-header px-3 py-2.5 bg-accent text-accent-foreground', headerClassName)}>
                  {title && <span className={cn('nyn-sheet-title text-base font-normal', titleClassName)}>{title}</span>}
                </Drawer.Header>
              )}
              <Drawer.Body className={cn('nyn-sheet-content text-foreground h-[calc(100vh_-_44px)] overflow-y-auto', contentClassName)}>
                {children}
              </Drawer.Body>
              {footer && <Drawer.Footer className="nyn-sheet-footer">{footer}</Drawer.Footer>}
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    );
  }
);

NSheet.displayName = 'NSheet';
