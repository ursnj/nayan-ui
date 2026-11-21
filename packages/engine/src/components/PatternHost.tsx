import { createElement, useEffect, useState } from 'react';
import { Image, PixelRatio, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import type { NPatternProps } from './NPattern';
import { patternImage } from './patternImage';

/** A static image keeps navigation backdrops cheap and capturable by platform blur. */
export function PatternHost({ recipe, width, height, style, onError, testID }: NPatternProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const measuredWidth = typeof width === 'number' ? width : size.width;
  const measuredHeight = typeof height === 'number' ? height : size.height;
  const density = PixelRatio.get();
  const key = JSON.stringify([recipe, measuredWidth, measuredHeight, density]);
  const [loaded, setLoaded] = useState<{ key: string; uri: string }>();
  useEffect(() => {
    if (!(measuredWidth > 0 && measuredHeight > 0)) return;
    let alive = true;
    void patternImage(recipe, measuredWidth, measuredHeight, density).then(
      (uri) => {
        if (alive) setLoaded({ key, uri });
      },
      (error) => {
        if (alive) onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    );
    return () => {
      alive = false;
    };
  }, [key, recipe, measuredWidth, measuredHeight, density, onError]);
  return createElement(
    View,
    {
      testID,
      pointerEvents: 'none',
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
      style: [{ width, height }, style] as unknown as StyleProp<ViewStyle>,
      onLayout: (event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
      }
    },
    loaded?.key === key
      ? createElement(Image, {
          source: { uri: loaded.uri },
          style: StyleSheet.absoluteFill,
          resizeMode: 'stretch',
          accessible: false,
          fadeDuration: 0
        })
      : null
  );
}
