import React, { memo } from 'react';
import { Breadcrumbs } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NBreadcrumbItem {
  label: string;
  href?: string;
}

export interface NBreadcrumbsProps {
  items: NBreadcrumbItem[];
  separator?: React.ReactNode;
  isDisabled?: boolean;
  className?: string;
  itemClassName?: string;
}

const NBreadcrumbsComponent: React.FC<NBreadcrumbsProps> = memo(({ items, separator, isDisabled = false, className = '', itemClassName = '' }) => {
  return (
    <Breadcrumbs separator={separator} isDisabled={isDisabled} className={cn('nyn-breadcrumbs', className)}>
      {items.map((item, index) => (
        <Breadcrumbs.Item key={index} href={item.href} className={cn(itemClassName)}>
          {item.label}
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  );
});

NBreadcrumbsComponent.displayName = 'NBreadcrumbs';

export const NBreadcrumbs = NBreadcrumbsComponent;
