import React, { ReactNode, memo } from 'react';
import { Kbd } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NKbdProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

const NKbdComponent: React.FC<NKbdProps> = memo(({ children, className = '', ...rest }) => {
  return (
    <Kbd className={cn('nyn-kbd', className)} {...(rest as any)}>
      {children}
    </Kbd>
  );
});

NKbdComponent.displayName = 'NKbd';

export const NKbd = NKbdComponent;
