import React, { ReactNode, memo } from 'react';
import { Kbd } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NKbdProps {
  children: ReactNode;
  className?: string;
}

const NKbdComponent: React.FC<NKbdProps> = memo(({ children, className = '' }) => {
  return <Kbd className={cn('nyn-kbd', className)}>{children}</Kbd>;
});

NKbdComponent.displayName = 'NKbd';

export const NKbd = NKbdComponent;
