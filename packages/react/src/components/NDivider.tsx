import React, { ReactNode, memo } from 'react';
import { Separator } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NDividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  children?: ReactNode;
  childrenClassName?: string;
  separatorClassName?: string;
}

const NDividerComponent: React.FC<NDividerProps> = memo(
  ({ className = '', orientation = 'horizontal', children, childrenClassName = '', separatorClassName = '', ...rest }) => {
    if (children && orientation === 'vertical') {
      return <Separator orientation={orientation} className={cn('bg-default', separatorClassName)} {...(rest as any)} />;
    }
    if (children && orientation === 'horizontal') {
      return (
        <div className={cn('flex items-center', className)}>
          <Separator orientation="horizontal" className={cn('flex-1 h-px', separatorClassName)} {...(rest as any)} />
          <span className={cn('mx-2 text-border text-xs whitespace-nowrap', childrenClassName)}>{children}</span>
          <Separator orientation="horizontal" className={cn('flex-1 h-px', separatorClassName)} {...(rest as any)} />
        </div>
      );
    }
    return <Separator orientation={orientation} className={cn('bg-default', separatorClassName || className)} {...(rest as any)} />;
  }
);

NDividerComponent.displayName = 'NDivider';

export const NDivider = NDividerComponent;
