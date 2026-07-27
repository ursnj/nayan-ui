import React, { memo } from 'react';
import { Breadcrumbs } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NBreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
}

export interface NBreadcrumbsProps {
  items: NBreadcrumbItem[];
  separator?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  'aria-label'?: string;
}

const NBreadcrumbsComponent: React.FC<NBreadcrumbsProps> = memo(
  ({ items, separator, disabled = false, className = '', itemClassName = '', 'aria-label': ariaLabel = 'Breadcrumbs' }) => {
    return (
      <Breadcrumbs separator={separator} isDisabled={disabled} className={cn('nyn-breadcrumbs', className)} aria-label={ariaLabel}>
        {items.map((item, index) => (
          <Breadcrumbs.Item key={item.id || item.href || `${item.label}-${index}`} href={item.href} className={cn(itemClassName)}>
            {item.label}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>
    );
  }
);

NBreadcrumbsComponent.displayName = 'NBreadcrumbs';

export const NBreadcrumbs = NBreadcrumbsComponent;
