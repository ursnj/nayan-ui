import { useState } from 'react';
import { useTheme } from '@react-navigation/native';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { THEMES } from '@/lib/utils';

export function useNTheme() {
  const theme: any = useTheme();
  const [themeColors, setColors] = useState(null);
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();

  const setThemeColors = (colors: any) => {
    setColors(colors);
  };

  return {
    themeColors,
    setThemeColors,
    theme: colorScheme,
    colors: theme.colors,
    setTheme: setColorScheme,
    toggleTheme: toggleColorScheme,
    isDarkMode: colorScheme === THEMES.dark
  };
}
