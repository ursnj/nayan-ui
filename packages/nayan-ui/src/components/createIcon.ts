'use client';

import { createElement, useContext, useEffect, useMemo } from 'react';
import type { IconOutline } from './iconImage';
import { NPress } from './NPress';
import { IconHost } from './PlatformHost';
import { ComponentThemeContext } from './ThemeContext';
import type { ComponentProps } from './types';
import { useComponentRenderer } from './useComponentRenderer';

export interface NIconProps extends Pick<ComponentProps, 'id' | 'className' | 'style' | 'width' | 'height' | 'accessibilityLabel'> {
  /** SVG path data, drawn in order. */
  paths?: string | readonly string[];
  /** A named icon supplied by the imported entry, or a literal Unicode symbol/emoji. */
  name?: string;
  onPress?: () => void;
  onError?: (error: Error) => void;
  /** Side of a square viewBox, or `[x, y, width, height]`. Default: 24. */
  viewBox?: number | readonly [number, number, number, number];
  /** Square size in logical points. Default: 24. */
  size?: number;
  /** CSS color; a `text-*` class takes precedence. Defaults to the current text color. */
  color?: string;
  /** Strokes the paths with round caps and joins instead of filling them, in viewBox units. */
  strokeWidth?: number;
  fillRule?: 'nonzero' | 'evenodd';
}

/** Internal resolved icon transport shared by the platform hosts. */
export interface IconHostProps extends NIconProps {
  outline?: IconOutline;
}

/** Rust vector icon in ComponentsRoot, with SVG for explicit browser HTML. */
export function createIcon(resolveIcon: (name: string) => IconOutline | undefined) {
  return function NIcon({ name, paths, viewBox, strokeWidth, onPress, onError, ...props }: NIconProps) {
    const theme = useContext(ComponentThemeContext);
    const rendering = useComponentRenderer('NIcon', true);
    const literal = !!name && /[^\x20-\x7e]/.test(name);
    const named = useMemo(() => (name && !literal ? resolveIcon(name) : undefined), [name, literal]);
    const outline = useMemo(
      () => (paths ? { paths, viewBox } : (named ?? (name && !literal ? resolveIcon('circle-question-mark') : undefined))),
      [paths, viewBox, named, name, literal]
    );
    const stroke = strokeWidth ?? (paths || literal ? undefined : 2);
    useEffect(() => {
      if (name && !literal && !paths && !named) onError?.(new Error(`Unknown Lucide icon: ${name}`));
    }, [name, literal, paths, named, onError]);
    if (!rendering)
      return createElement(IconHost, {
        ...props,
        color: props.color ?? theme?.colors?.foreground,
        outline,
        strokeWidth: stroke,
        name,
        onPress,
        onError
      });
    const icon = createElement('NIcon', { ...outline, ...props, strokeWidth: stroke, name });
    return onPress ? createElement(NPress, { onPress, accessibilityLabel: props.accessibilityLabel ?? name }, icon) : icon;
  };
}
