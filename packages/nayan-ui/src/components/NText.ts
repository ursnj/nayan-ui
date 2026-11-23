'use client';

import { createElement, type Ref } from 'react';
import type { TextInstance, TextProps } from 'react-native';
import { TextHost as PlatformText } from './PlatformHost';
import type { ComponentProps } from './types';
import { useComponentRenderer } from './useComponentRenderer';

export type NTextProps = ComponentProps &
  Omit<TextProps, keyof ComponentProps | 'ref'> & {
    ref?: Ref<TextInstance> | Ref<HTMLSpanElement>;
  };

export function NText({ onPress, ...props }: NTextProps) {
  if (!useComponentRenderer('NText', true)) return createElement(PlatformText, { ...props, onPress });
  return createElement(onPress ? 'NLink' : 'NText', { ...props, onPress });
}
