import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { TabsContent } from './ui/tabs';

export interface NTabsContentProps {
  item: string;
  className?: string;
  children: ReactNode;
}

export const NTabsContent = ({ item, className = '', children }: NTabsContentProps) => (
  <TabsContent value={item} className={cn('nyn-tab-content', className)}>
    {children}
  </TabsContent>
);

NTabsContent.displayName = 'NTabsContent';
