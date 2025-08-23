import React, { ReactNode, memo } from 'react';
import { cn } from '../lib/utils';
import { SheetSize } from './Types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

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
  header?: ReactNode; // custom header
  footer?: ReactNode; // optional footer
  'aria-label'?: string;
  'aria-labelledby'?: string;
  role?: string;
  [key: string]: any; // for extra props
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
      <Sheet open={isOpen} onOpenChange={onCloseSheet}>
        <SheetContent
          className={cn(
            'nyn-sheet p-0 gap-0 border-0 border-l border-border bg-card text-white overflow-hidden w-full',
            sizeMapping[size],
            className
          )}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          role={role}
          aria-modal="true"
          {...rest}>
          {header || (
            <SheetHeader className={cn('nyn-sheet-header px-3 py-2.5 bg-primary text-white', headerClassName)}>
              {title && <SheetTitle className={cn('nyn-sheet-title text-base font-normal', titleClassName)}>{title}</SheetTitle>}
            </SheetHeader>
          )}
          <div className={cn('nyn-sheet-content text-text h-[calc(100vh_-_44px)] overflow-y-auto', contentClassName)}>{children}</div>
          {footer && <div className="nyn-sheet-footer">{footer}</div>}
        </SheetContent>
      </Sheet>
    );
  }
);

NSheet.displayName = 'NSheet';
