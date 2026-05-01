import { useUniwind } from 'uniwind';
import { useThemeColor } from 'heroui-native';
import { THEMES } from '../lib/utils';

export function useNTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useUniwind();
  const [accent, background, surface, foreground, muted, border] = useThemeColor([
    'accent',
    'background',
    'surface',
    'foreground',
    'muted',
    'border',
  ]);

  return {
    theme: colorScheme,
    setTheme: setColorScheme,
    toggleTheme: toggleColorScheme,
    isDarkMode: colorScheme === THEMES.dark,
    colors: {
      accent,
      background,
      surface,
      foreground,
      muted,
      border,
    },
  };
}
