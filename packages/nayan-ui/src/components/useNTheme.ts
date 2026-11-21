'use client';

import { useContext, useMemo } from 'react';
import { ComponentThemeContext } from './theme/contexts';
import { resolvedPalette } from './theme/palette';
import type { NThemeAppearance } from './theme/types';
import type { NThemeMode } from './ThemeContext';

export interface NThemeState extends NThemeAppearance {
  setTheme(theme: NThemeMode): void;
  /** Switch to the opposite of the currently resolved light/dark appearance. */
  toggleTheme(): void;
}

/** Theme access and updates work on either side of an engine rendering boundary. */
export function useNTheme(): NThemeState {
  const value = useContext(ComponentThemeContext);
  return useMemo(() => {
    if (!value?.setTheme || !value.toggleTheme) throw new Error('useNTheme requires an NTheme');
    const systemTheme = value.systemTheme ?? 'light';
    const theme = value.theme ?? 'system';
    const resolvedTheme = value.resolvedTheme ?? (theme === 'system' ? systemTheme : theme);
    const colors = { ...value.colors, ...value.themes?.[resolvedTheme] };
    return {
      theme,
      resolvedTheme,
      systemTheme,
      isDarkMode: resolvedTheme === 'dark',
      colors,
      palette: resolvedPalette({ ...value.palette, ...value.palettes?.[resolvedTheme] }, colors),
      setTheme: value.setTheme,
      toggleTheme: value.toggleTheme
    };
  }, [value]);
}
