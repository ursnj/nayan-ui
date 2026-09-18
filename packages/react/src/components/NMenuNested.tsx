import React, { ReactNode } from 'react';
import { Dropdown, Label } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NMenuNestedProps {
  className?: string;
  triggerClassName?: string;
  /** Rendered before the label, like `NMenuItem`'s icon. */
  icon?: ReactNode;
  trigger: ReactNode;
  children: ReactNode;
}

export const NMenuNested: React.FC<NMenuNestedProps> = React.memo(({ trigger, children, icon, className = '', triggerClassName = '' }) => {
  return (
    <Dropdown.SubmenuTrigger>
      <Dropdown.Item className={cn('nyn-menu-nested-trigger', triggerClassName)}>
        {icon}
        <Label>{trigger}</Label>
        {/* ms-auto: HeroUI colours and sizes the chevron but never positions it. */}
        <Dropdown.SubmenuIndicator className="ms-auto ps-3" />
      </Dropdown.Item>
      <Dropdown.Popover>
        <Dropdown.Menu className={cn('nyn-menu-nested-content', className)}>{children}</Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.SubmenuTrigger>
  );
});
NMenuNested.displayName = 'NMenuNested';
