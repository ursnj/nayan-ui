import { ReactNode } from 'react';
import { Tabs } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTabsContentProps {
  item: string;
  className?: string;
  children: ReactNode;
}

export const NTabsContent = ({ item, className = '', children }: NTabsContentProps) => (
  <Tabs.Panel id={item} className={cn('nyn-tab-content', className)}>
    {children}
  </Tabs.Panel>
);

NTabsContent.displayName = 'NTabsContent';
