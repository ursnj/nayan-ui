import React, { useCallback } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { SunIcon, MoonIcon } from '../helpers/icons';
import { useNTheme } from '../hooks/useNTheme';
import { THEMES } from '../helpers/utils';

export interface NThemeToggleProps extends Omit<PressableProps, 'onPress'> {
  className?: string;
  size?: number;
  color?: string;
  onThemeChange?: (theme: string) => void;
  children?: React.ReactNode;
}

export const NThemeToggle = React.memo<NThemeToggleProps>(({ className = '', size = 22, color = '#fff', onThemeChange, children, ...props }) => {
  const { isDarkMode, setTheme } = useNTheme();

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? THEMES.light : THEMES.dark;
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [isDarkMode, setTheme, onThemeChange]);

  return (
    <Pressable onPress={toggleTheme} className={className} {...props}>
      {children || (isDarkMode ? <SunIcon size={size} color={color} /> : <MoonIcon size={size} color={color} />)}
    </Pressable>
  );
});

NThemeToggle.displayName = 'NThemeToggle';
