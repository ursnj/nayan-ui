import React, { ReactNode, memo } from 'react';
import { cn } from '../lib/utils';
import { Separator } from './ui/separator';

export interface NDividerProps extends React.ComponentProps<typeof Separator> {
  children?: ReactNode;
  childrenClassName?: string;
  separatorClassName?: string;
}

const NDividerComponent: React.FC<NDividerProps> = memo(
  ({ className = '', orientation = 'horizontal', children, childrenClassName = '', separatorClassName = '', ...rest }) => {
    if (children && orientation === 'vertical') {
      return <Separator orientation={orientation} className={cn('bg-border', separatorClassName)} {...rest} />;
    }
    if (children && orientation === 'horizontal') {
      return (
        <div className={cn('flex items-center', className)}>
          <Separator orientation="horizontal" className={cn('flex-1 h-px', separatorClassName)} {...rest} />
          <span className={cn('mx-2 text-border text-xs whitespace-nowrap', childrenClassName)}>{children}</span>
          <Separator orientation="horizontal" className={cn('flex-1 h-px', separatorClassName)} {...rest} />
        </div>
      );
    }
    return <Separator orientation={orientation} className={cn('bg-border', separatorClassName || className)} {...rest} />;
  }
);

NDividerComponent.displayName = 'NDivider';

export const NDivider = NDividerComponent;
