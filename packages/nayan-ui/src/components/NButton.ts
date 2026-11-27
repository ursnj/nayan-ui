'use client';

import { createElement, type ReactNode } from 'react';
import { component } from './component';
import type { ComponentProps } from './types';

export interface NButtonProps extends ComponentProps {
  /** Content displayed before the button label. */
  leftIcon?: ReactNode;
  /** Content displayed after the button label. */
  rightIcon?: ReactNode;
}

const Button = /* @__PURE__ */ component<ComponentProps & { 'aria-busy'?: boolean }>('NButton');

export function NButton({ children, leftIcon, rightIcon, isLoading, loadingText = 'Loading…', disabled, isDisabled, ...props }: NButtonProps) {
  const attributes = { ...props, isLoading, loadingText, disabled: disabled || isDisabled || isLoading, 'aria-busy': isLoading || undefined };
  if (isLoading) return createElement(Button, attributes, loadingText);
  if (leftIcon == null && rightIcon == null) return createElement(Button, attributes, children);
  return createElement(Button, { ...attributes, className: `flex-row items-center justify-center gap-2 ${props.className ?? ''}` }, leftIcon, children, rightIcon);
}
