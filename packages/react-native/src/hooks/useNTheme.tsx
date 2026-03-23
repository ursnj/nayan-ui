import { useCallback } from 'react';
import { useThemeColor } from 'heroui-native';
import { Uniwind, useUniwind } from 'uniwind';
import { THEMES } from '@/lib/utils';

export function useNTheme() {
  const { theme } = useUniwind();

  const [accent, background, surface, foreground, muted, separator] = useThemeColor([
    'accent',
    'background',
    'surface',
    'foreground',
    'muted',
    'separator'
  ]);

  const isDarkMode = theme === THEMES.dark;

  const setTheme = useCallback((newTheme: string) => {
    Uniwind.setTheme(newTheme as any);
  }, []);

  const toggleTheme = useCallback(() => {
    Uniwind.setTheme(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode]);

  return {
    theme,
    isDarkMode,
    setTheme,
    toggleTheme,
    colors: {
      primary: accent,
      background,
      card: surface,
      text: foreground,
      muted,
      border: separator,
      notification: surface
    }
  };
}
