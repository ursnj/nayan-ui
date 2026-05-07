import React, { ReactNode } from 'react';
import { Dropdown, Label } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NMenuNestedProps {
  className?: string;
  triggerClassName?: string;
  trigger: ReactNode;
  children: ReactNode;
}

export const NMenuNested: React.FC<NMenuNestedProps> = React.memo(({ trigger, children, className = '', triggerClassName = '' }) => {
  return (
    <Dropdown.SubmenuTrigger>
      <Dropdown.Item className={cn('nyn-menu-nested-trigger', triggerClassName)}>
        <Label>{trigger}</Label>
        <Dropdown.SubmenuIndicator />
      </Dropdown.Item>
      <Dropdown.Popover>
        <Dropdown.Menu className={cn('nyn-menu-nested-content bg-surface border border-default rounded p-1', className)}>{children}</Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.SubmenuTrigger>
  );
});
NMenuNested.displayName = 'NMenuNested';
