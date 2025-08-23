import React, { KeyboardEvent, ReactNode, memo } from 'react';
import { cn } from '../lib/utils';

export interface NCardProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void;
}

const NCardComponent: React.FC<NCardProps> = memo(({ className = '', children, onClick, tabIndex, role, ...rest }) => {
  const isInteractive = typeof onClick === 'function';

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      className={cn('nyn-card border border-border bg-card rounded', className)}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      role={isInteractive ? (role ?? 'button') : role}
      {...rest}>
      {children}
    </div>
  );
});

NCardComponent.displayName = 'NCard';

export const NCard = NCardComponent;
