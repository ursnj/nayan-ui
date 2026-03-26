import { useState } from 'react';
import { DefaultTheme, useTheme } from '@react-navigation/native';
import { Uniwind, useUniwind } from 'uniwind';
import { THEMES } from '../lib/utils';

export function useNTheme() {
  let navigationTheme: any = DefaultTheme;
  try {
    navigationTheme = useTheme();
  } catch {
    navigationTheme = DefaultTheme;
  }
  const [themeColors, setColors] = useState(null);
  const { theme: currentTheme } = useUniwind();

  const setThemeColors = (colors: any) => {
    setColors(colors);
  };

  const setTheme = (nextTheme: string) => {
    Uniwind.setTheme((nextTheme || THEMES.light) as any);
  };

  const toggleTheme = () => {
    setTheme(currentTheme === THEMES.dark ? THEMES.light : THEMES.dark);
  };

  return {
    themeColors,
    setThemeColors,
    theme: currentTheme,
    colors: navigationTheme.colors,
    setTheme,
    toggleTheme,
    isDarkMode: currentTheme === THEMES.dark
  };
}
