import { useCallback } from 'react';
import { useUniwind, Uniwind } from 'uniwind';
import { useThemeColor } from 'heroui-native';
import { THEMES } from '../helpers/utils';

export function useNTheme() {
  const { theme } = useUniwind();
  const [accent, background, surface, foreground, muted, border] = useThemeColor([
    'accent',
    'background',
    'surface',
    'foreground',
    'muted',
    'border',
  ]);

  const setTheme = useCallback((newTheme: string) => {
    Uniwind.setTheme(newTheme as any);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === THEMES.dark ? THEMES.light : THEMES.dark;
    Uniwind.setTheme(newTheme as any);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode: theme === THEMES.dark,
    colors: {
      accent,
      background,
      surface,
      foreground,
      muted,
      border,
    },
    headerConfig: {
      headerStyle: { backgroundColor: surface },
      headerTintColor: foreground,
      headerShadowVisible: true,
      headerBackButtonDisplayMode: 'minimal' as const,
    },
  };
}
