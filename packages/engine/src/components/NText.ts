'use client';

import { createElement, type Ref, useContext } from 'react';
import type { TextInstance, TextProps } from 'react-native';
import { component } from './component';
import { TextHost as PlatformText } from './PlatformHost';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps } from './types';
const TextHost = component<ComponentProps>('NText');
const LinkHost = component<ComponentProps>('NLink');

export type NTextProps = ComponentProps &
  Omit<TextProps, keyof ComponentProps | 'ref'> & {
    ref?: Ref<TextInstance> | Ref<HTMLSpanElement>;
  };

export function NText({ onPress, ...props }: NTextProps) {
  if (!useContext(ComponentRenderContext)) return createElement(PlatformText, { ...props, onPress });
  return createElement(onPress ? LinkHost : TextHost, { ...props, onPress });
}
