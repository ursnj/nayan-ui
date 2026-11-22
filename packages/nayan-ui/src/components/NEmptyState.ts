'use client';

import { createElement, type ReactNode } from 'react';
import { component } from './component';
import { NIcon } from './NIcon';
import { NText } from './NText';
import { NView } from './NView';
import type { ComponentProps } from './types';

export interface NEmptyStateProps extends ComponentProps {
  /** Overrides the default icon. Pass null to hide it. */
  icon?: ReactNode;
  actions?: ReactNode;
  iconClassName?: string;
  titleClassName?: string;
  messageClassName?: string;
}

const EmptyState = /* @__PURE__ */ component<ComponentProps>('NEmptyState');

export function NEmptyState({
  icon,
  title,
  message,
  description,
  actions,
  iconClassName,
  titleClassName,
  messageClassName,
  descriptionClassName,
  label,
  name,
  text,
  fallback,
  alt,
  className,
  children,
  ...props
}: NEmptyStateProps) {
  const heading = label || title || name || text || fallback || alt;
  const body = message || description;
  if (!heading && !body && icon == null && actions == null) {
    return createElement(EmptyState, { ...props, className }, children);
  }
  const indicator = icon === undefined ? createElement(NIcon, { name: 'file-text', size: 22, className: 'text-accent' }) : icon;

  return createElement(
    EmptyState,
    { ...props, className: `flex w-full flex-col items-center gap-3 rounded-xl border border-border bg-surface px-4 py-7 ${className ?? ''}` },
    indicator != null &&
      createElement(
        NView,
        { className: `flex h-12 w-12 flex-row items-center justify-center rounded-xl bg-accent/10 ${iconClassName ?? ''}` },
        indicator
      ),
    (heading || body) &&
      createElement(
        NView,
        { className: 'flex max-w-80 flex-col items-center gap-1' },
        heading &&
          createElement(NText, { tag: 'h3', className: `text-center text-base font-semibold text-foreground ${titleClassName ?? ''}` }, heading),
        body &&
          createElement(
            NText,
            { tag: 'p', className: `text-center text-sm leading-5 text-muted ${messageClassName ?? descriptionClassName ?? ''}` },
            body
          )
      ),
    actions,
    children
  );
}
