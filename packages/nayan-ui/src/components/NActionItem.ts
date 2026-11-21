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
  ...props
}: NActionItemProps) {
  return createElement(
    ActionItem,
    { ...props, name },
    icon,
    createElement(
      NView,
      { className: `flex-1 ${icon ? 'ml-3' : ''}` },
      createElement(NText, { className: `font-medium ${titleClassName}` }, name),
      description ? createElement(NText, { className: `text-muted mt-0.5 text-sm ${descriptionClassName}` }, description) : null
    ),
    showArrow ? createElement(NIcon, { size: 16, name: 'chevron-right', className: 'text-muted' }) : null
  );
}
