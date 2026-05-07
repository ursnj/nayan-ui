import React, { ReactNode, memo } from 'react';
import { Button } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isOutline?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

const NButtonComponent: React.FC<NButtonProps> = memo(
  ({ children, className = '', isOutline = false, isLoading = false, loadingText = 'Loading...', disabled, type = 'button', ...remaining }) => {
    const isDisabled = isLoading || disabled;
    const variantClasses = isOutline
      ? 'bg-surface text-foreground border border-default hover:bg-default/50'
      : 'bg-accent text-accent-foreground hover:bg-accent/90';
    return (
      <Button
        type={type}
        variant={isOutline ? 'outline' : 'primary'}
        isPending={isLoading}
        isDisabled={isDisabled}
        className={cn('nyn-button rounded h-auto transition duration-150 ease-in-out px-3 py-2 text-sm', variantClasses, className)}
        {...(remaining as any)}>
        {!isLoading ? children : <span aria-live="polite">{loadingText}</span>}
      </Button>
    );
  }
);

NButtonComponent.displayName = 'NButton';

export const NButton = NButtonComponent;
