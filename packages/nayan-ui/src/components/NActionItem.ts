'use client';

import { createElement, type ReactNode } from 'react';
import { component } from './component';
import { NIcon } from './NIcon';
import { NText } from './NText';
import { NView } from './NView';
import type { ComponentProps } from './types';

export interface NActionItemProps extends ComponentProps {
  icon?: ReactNode;
  showArrow?: boolean;
  titleClassName?: string;
}

const ActionItem = /* @__PURE__ */ component<ComponentProps>('NActionItem');

export function NActionItem({
  name,
  description,
  icon,
  showArrow = true,
  titleClassName = '',
  descriptionClassName = '',
  className = '',
  ...props
}: NActionItemProps) {
  return createElement(
    ActionItem,
    { ...props, name, className: `flex flex-row items-center gap-3 p-3 ${className}` },
    icon,
    createElement(
      NView,
      { className: 'flex min-w-0 flex-1 flex-col gap-1 text-left' },
      createElement(NText, { className: `font-medium ${titleClassName}` }, name),
      description ? createElement(NText, { className: `text-sm text-muted ${descriptionClassName}` }, description) : null
    ),
    showArrow ? createElement(NIcon, { size: 16, name: 'chevron-right', className: 'text-muted' }) : null
  );
}
