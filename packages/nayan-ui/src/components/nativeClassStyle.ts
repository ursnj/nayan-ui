import { useContext, useMemo } from 'react';
import { ComponentThemeContext } from './ThemeContext';
import type { ComponentStyle } from './types';

/** Native views use the same Rust utility vocabulary and theme as ComponentsRoot, without a surface. */
export function useNativeClassStyle(kind: 'NView' | 'NPress' | 'NText' | 'NIcon', className?: string) {
  const theme = useContext(ComponentThemeContext);
  const { useWindowDimensions } = require('react-native') as typeof import('react-native');
  const window = useWindowDimensions();
  return useMemo(() => {
    const cache = new Map<string, ComponentStyle>();
    const configuration = theme
      ? { theme: theme.theme, colors: theme.colors, themes: theme.themes, radius: theme.radius, components: theme.components }
      : undefined;
    return (state: { pressed?: boolean; disabled?: boolean; hovered?: boolean; focused?: boolean } = {}): ComponentStyle | undefined => {
      if (!className && !theme?.components?.[kind]) return undefined;
      const key = JSON.stringify(state);
      const cached = cache.get(key);
      if (cached) return cached;
      const NativeEngine = (require('../native/NativeNayanEngine') as typeof import('../native/NativeNayanEngine')).default;
      if (!NativeEngine) return undefined;
      const result = JSON.parse(
        NativeEngine.drawingCommand(
          0,
          JSON.stringify({
            op: 'componentStyle',
            kind,
            className,
            theme: configuration,
            dark: theme?.systemTheme === 'dark',
            width: window.width,
            height: window.height,
            state
          })
        )
      );
      // Metro can update the facade before a native rebuild finishes. Keep controls usable then.
      if (!result.ok) return undefined;
      const style = result.value as ComponentStyle;
      cache.set(key, style);
      return style;
    };
  }, [kind, className, theme, window.width, window.height]);
}
