'use client';

import { createElement, useCallback, useRef, useState } from 'react';
import { PressHost } from './PlatformHost';
import { type NPressProps, pressEvent } from './press';
import { useComponentRenderer } from './useComponentRenderer';

export type { NPressProps, NPressState, NPressEvent, NPressRef } from './press';

function EnginePress({
  style,
  children,
  disabled,
  isDisabled,
  onPress,
  onClick,
  onAction,
  onPressIn,
  onPressOut,
  onLongPress,
  onHoverIn,
  onHoverOut,
  onFocus,
  onBlur,
  ...props
}: NPressProps) {
  const [pressed, setPressed] = useState(false);
  const previous = useRef({ pressed: false, hovered: false, focused: false });
  const latest = useRef<unknown>(undefined);
  const renderState = typeof style === 'function' || typeof children === 'function';
  const observe = renderState || !!(onPressIn || onPressOut || onLongPress || onHoverIn || onHoverOut || onFocus || onBlur);
  const blocked = !!disabled || !!isDisabled || !!props.accessibilityState?.disabled || props['aria-disabled'] === true;
  const change = useCallback(
    (value: { pressed: boolean; hovered: boolean; focused: boolean; x: number; y: number }) => {
      const before = previous.current;
      previous.current = value;
      latest.current = value;
      if (renderState && before.pressed !== value.pressed) setPressed(value.pressed);
      const event = pressEvent(value);
      if (before.pressed !== value.pressed) (value.pressed ? onPressIn : onPressOut)?.(event);
      if (before.hovered !== value.hovered) (value.hovered ? onHoverIn : onHoverOut)?.(event as never);
      if (before.focused !== value.focused) (value.focused ? onFocus : onBlur)?.(event as never);
    },
    [renderState, onPressIn, onPressOut, onHoverIn, onHoverOut, onFocus, onBlur]
  );
  const state = { pressed: !blocked && (props.testOnly_pressed ?? pressed) };
  const press = onPress ?? onClick ?? onAction;
  return createElement('NPress', {
    ...props,
    _expanded: props['aria-expanded'] ?? props.accessibilityState?.expanded,
    _selected: props['aria-pressed'],
    disabled: blocked,
    style: typeof style === 'function' ? style(state) : style,
    observePress: observe,
    observeLongPress: !!onLongPress,
    onPressState: observe ? change : undefined,
    onLongPress: onLongPress
      ? (value: unknown) => {
          if (!blocked) onLongPress(pressEvent(value));
        }
      : undefined,
    onPress: press
      ? (value: unknown) => {
          if (!blocked) press(pressEvent(value ?? latest.current));
        }
      : undefined,
    children: typeof children === 'function' ? children(state) : children
  });
}

/** One press API for native views, browser buttons and Rust-rendered UI. */
export function NPress(props: NPressProps) {
  return createElement(useComponentRenderer('NPress', true) ? EnginePress : PressHost, props);
}
