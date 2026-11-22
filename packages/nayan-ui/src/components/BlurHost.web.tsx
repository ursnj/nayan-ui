import { createElement, type CSSProperties } from 'react';
import type { NBlurProps } from './NBlur';
import type { ComponentProps, ComponentStyle } from './types';

function flatten(style: ComponentProps['style']): ComponentStyle {
  return Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style && typeof style === 'object' ? (style as ComponentStyle) : {};
}

export function BlurHost({
  tag = 'div',
  radius = 10,
  tint = 'default',
  blurTarget: _target,
  enabled: _enabled,
  style,
  onPress,
  accessibilityLabel,
  accessibilityRole,
  testID,
  pointerEvents,
  ...props
}: NBlurProps) {
  return createElement(tag, {
    ...props,
    onClick: onPress,
    'aria-label': props['aria-label'] ?? accessibilityLabel,
    role: props.role ?? accessibilityRole,
    ...(testID ? { 'data-testid': testID } : {}),
    style: {
      ...(tint === 'dark' ? { backgroundColor: '#00000033' } : tint === 'light' ? { backgroundColor: '#ffffff33' } : {}),
      ...flatten(style),
      ...(pointerEvents ? { pointerEvents } : {}),
      backdropFilter: `blur(${radius}px)`,
      WebkitBackdropFilter: `blur(${radius}px)`
    } as CSSProperties
  });
}
