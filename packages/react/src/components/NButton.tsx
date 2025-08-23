import React, { ReactNode, memo } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

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
    return (
      <Button
        type={type}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        className={cn(
          `nyn-button ${
            isOutline
              ? 'text-primary hover:text-white bg-transparent hover:bg-primary-dark border border-primary'
              : 'text-white bg-primary border border-primary hover:bg-primary-dark'
          } rounded h-auto transition duration-150 ease-in-out px-3 py-2 text-sm`,
          className
        )}
        {...remaining}>
        {!isLoading ? children : <span aria-live="polite">{loadingText}</span>}
      </Button>
    );
  }
);

NButtonComponent.displayName = 'NButton';

export const NButton = NButtonComponent;
