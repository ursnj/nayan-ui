import { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface NTabsContentProps {
  item: string;
  className?: string;
  children: ReactNode;
}

export const NTabsContent = ({ item, className = '', children }: NTabsContentProps) => (
  <div role="tabpanel" data-value={item} className={cn('nyn-tab-content', className)}>
    {children}
  </div>
);

NTabsContent.displayName = 'NTabsContent';
