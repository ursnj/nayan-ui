import { type ComponentProps, createElement, useContext, useEffect, useState } from 'react';
import type { ViewProps } from 'react-native';
import type { IconHostProps } from './createIcon';
import { useNativeClassStyle } from './nativeClassStyle';
import type { NTextProps } from './NText';
import type { NViewProps } from './NView';
import type { NPressProps, NPressState } from './press';
import { ComponentThemeContext } from './ThemeContext';

export function usePlatformColorScheme(): 'light' | 'dark' {
  const { useColorScheme } = require('react-native') as typeof import('react-native');
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function usePlatformOverlayEnvironment(onResume: () => void): { width: number; height: number; position: 'absolute' | 'fixed' } {
  const { AppState, useWindowDimensions } = require('react-native') as typeof import('react-native');
  const viewport = useWindowDimensions();
  useEffect(() => {
    onResume();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') onResume();
    });
    return () => subscription.remove();
  }, [AppState, onResume]);
  return { ...viewport, position: 'absolute' as const };
}

export function announcePlatformMessage(message: string) {
  const { AccessibilityInfo } = require('react-native') as typeof import('react-native');
  AccessibilityInfo.announceForAccessibility(message);
}
import type { ComponentStyle } from './types';

/** Apply inline shorthands after resolved class sides, preserving RN's own specificity rules. */
function platformStyle(classes: ComponentStyle | undefined, dimensions: object | undefined, style: unknown) {
  const { StyleSheet } = require('react-native') as typeof import('react-native');
  const flatten = (value: unknown): Record<string, unknown> =>
    Array.isArray(value) ? Object.assign({}, ...value.map(flatten)) : value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const explicit = { ...(StyleSheet?.flatten ? StyleSheet.flatten(style as ViewProps['style']) : flatten(style)) } as Record<string, unknown>;
  for (const prefix of ['padding', 'margin']) {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const value =
        explicit[`${prefix}${side}`] ?? explicit[`${prefix}${side === 'Top' || side === 'Bottom' ? 'Vertical' : 'Horizontal'}`] ?? explicit[prefix];
      if (value !== undefined) explicit[`${prefix}${side}`] = value;
    }
  }
  for (const [key, fields] of [
    ['borderRadius', ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']],
    ['borderWidth', ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']],
    ['gap', ['rowGap', 'columnGap']]
  ] as const) {
    if (explicit[key] !== undefined) for (const field of fields) explicit[field] ??= explicit[key];
  }
  // A class's explicit flexGrow/flexBasis must not mask a later inline flex shorthand.
  if (typeof explicit.flex === 'number') {
    explicit.flexGrow ??= Math.max(0, explicit.flex);
    explicit.flexShrink ??= explicit.flex > 0 ? 1 : Math.max(0, -explicit.flex);
    explicit.flexBasis ??= explicit.flex > 0 ? 0 : 'auto';
  }
  return [classes, dimensions, explicit];
}

/** Retain Fabric layout, measurement, accessibility and SDK refs outside an engine surface. */
export function ViewHost({ className, width, height, style, ...props }: NViewProps) {
  const { View } = require('react-native') as typeof import('react-native');
  const classes = useNativeClassStyle('NView', className)();
  const dimensions = width !== undefined || height !== undefined ? { width, height } : undefined;
  return createElement(View, { ...props, style: platformStyle(classes, dimensions, style) } as ViewProps);
}

/** Native text for captions and labels outside a Rust ComponentsRoot. */
export function TextHost({ className, style, onPress, ...props }: NTextProps) {
  const defaults = useContext(ComponentThemeContext)?.textProps;
  const { Text } = require('react-native') as typeof import('react-native');
  const classes = useNativeClassStyle('NText', className);
  const resolved = classes();
  return createElement(Text, { ...defaults, ...props, onPress, style: platformStyle(resolved, undefined, style) } as ComponentProps<typeof Text>);
}

/** Native navigation and SDK layouts keep React Native's complete Pressability implementation. */
export function PressHost({ isDisabled, disabled, className, width, height, onPress, onClick, onAction, style, type: _type, ...props }: NPressProps) {
  const { Pressable } = require('react-native') as typeof import('react-native');
  const classes = useNativeClassStyle('NPress', className);
  const blocked = !!disabled || !!isDisabled || !!props.accessibilityState?.disabled || props['aria-disabled'] === true;
  const dimensions = width !== undefined || height !== undefined ? { width, height } : undefined;
  const resolved =
    dimensions || className
      ? (state: NPressState) => {
          const value = typeof style === 'function' ? style(state) : style;
          return platformStyle(className ? classes({ ...state, disabled: blocked }) : undefined, dimensions, value);
        }
      : style;
  return createElement(Pressable, {
    ...props,
    disabled: blocked,
    onPress: onPress ?? onClick ?? onAction,
    style: resolved
  } as ComponentProps<typeof Pressable>);
}

/** A normal native Image, usable in navigation and SDK views without a separate engine surface. */
export function IconHost({
  outline,
  name,
  size = 24,
  width = size,
  height = size,
  color = '#000000',
  style,
  className,
  onPress,
  accessibilityLabel,
  onError,
  strokeWidth,
  fillRule
}: IconHostProps) {
  const classes = useNativeClassStyle('NIcon', className)();
  const { Image, PixelRatio, Pressable, Text, View } = require('react-native') as typeof import('react-native');
  const pixels = Math.max(1, Math.min(512, Math.ceil(Math.max(width, height) * PixelRatio.get())));
  const [loaded, setLoaded] = useState<{ key: string; uri: string }>();
  const key = JSON.stringify([outline, pixels, strokeWidth, fillRule]);
  useEffect(() => {
    let active = true;
    if (outline)
      void import('./iconImage')
        .then(({ iconImage }) => iconImage(outline, pixels, strokeWidth, fillRule))
        .then(
          (uri) => {
            if (active) setLoaded({ key, uri });
          },
          (error) => {
            if (active) onError?.(error instanceof Error ? error : new Error(String(error)));
          }
        );
    return () => {
      active = false;
    };
  }, [key, outline, pixels, strokeWidth, fillRule, onError]);
  const iconStyle = [{ width, height }, style] as import('react-native').StyleProp<import('react-native').ImageStyle>;
  const image =
    loaded?.key === key && outline
      ? createElement(Image, {
          source: { uri: loaded.uri },
          style: [iconStyle, { tintColor: classes?.color ?? color }],
          resizeMode: 'contain',
          accessibilityLabel,
          accessible: !!accessibilityLabel
        })
      : !outline && name
        ? createElement(
            Text,
            {
              style: [{ color: classes?.color ?? color, fontSize: size, width, height }, style] as import('react-native').StyleProp<
                import('react-native').TextStyle
              >,
              accessibilityLabel
            },
            name
          )
        : createElement(View, { style: iconStyle });
  return onPress ? createElement(Pressable, { onPress, accessibilityLabel: accessibilityLabel ?? name, accessibilityRole: 'button' }, image) : image;
}
