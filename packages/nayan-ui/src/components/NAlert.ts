'use client';

import { createElement, type ReactNode } from 'react';
import { component } from './component';
import { NButton } from './NButton';
import { NIcon } from './NIcon';
import { NText } from './NText';
import { NView } from './NView';
import type { ComponentProps } from './types';

export interface NAlertProps extends Omit<ComponentProps, 'title' | 'message'> {
  title?: ReactNode;
  message?: ReactNode;
  /** Overrides the status icon. Pass null to hide it. */
  icon?: ReactNode;
  actions?: ReactNode;
  titleClassName?: string;
  messageClassName?: string;
  closeClassName?: string;
}

const Alert = /* @__PURE__ */ component<ComponentProps>('NAlert');
const tones = {
  default: { icon: 'info', className: 'text-foreground' },
  info: { icon: 'info', className: 'text-accent' },
  success: { icon: 'circle-check', className: 'text-success' },
  warning: { icon: 'triangle-alert', className: 'text-warning' },
  error: { icon: 'circle-alert', className: 'text-danger' }
} as const;

export function NAlert({
  type, title, message, description, icon, actions, onClose, titleClassName, messageClassName, closeClassName, children, ...props
}: NAlertProps) {
  const body = message ?? description;
  const hasContent = title != null || body != null;
  if (!hasContent && icon === undefined && actions == null && !onClose) {
    return createElement(Alert, { ...props, type }, children);
  }
  const status = type === 'accent' ? 'info' : type === 'danger' ? 'error' : type;
  const tone = status && Object.hasOwn(tones, status) ? tones[status as keyof typeof tones] : tones.default;
  const indicator = icon === undefined && hasContent
    ? createElement(NIcon, { name: tone.icon, size: 16, className: tone.className })
    : icon;
  return createElement(
    Alert,
    {
      ...props,
      type,
      role: props.role ?? (status === 'error' ? 'alert' : 'status'),
      className: `flex w-full flex-row items-start gap-3 rounded-lg bg-surface px-4 py-3 ${props.className ?? ''}`
    },
    indicator,
    createElement(
      NView,
      { className: 'flex min-w-0 flex-1 flex-col gap-1' },
      title != null && createElement(NText, { className: `text-sm font-medium ${tone.className} ${titleClassName ?? ''}` }, title),
      body != null && createElement(NText, { className: `text-sm text-muted ${messageClassName ?? ''}` }, body),
      children
    ),
    actions,
    onClose && createElement(NButton, {
      type: 'button',
      accessibilityLabel: typeof title === 'string' ? `Dismiss ${title.toLowerCase()} alert` : 'Dismiss alert',
      onPress: onClose,
      className: `h-6 w-6 shrink-0 rounded-lg bg-default p-0 text-sm text-muted hover:bg-surface-secondary ${closeClassName ?? ''}`
    }, '×')
  );
}
