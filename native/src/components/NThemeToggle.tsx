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

export const NThemeToggle = React.memo<NThemeToggleProps>(({ className = '', size = 22, color, onThemeChange, children, ...props }) => {
  const { isDarkMode, setTheme, colors } = useNTheme();
  const iconColor = color || colors.foreground;

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? THEMES.light : THEMES.dark;
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [isDarkMode, setTheme, onThemeChange]);

  return (
    <Pressable onPress={toggleTheme} className={className} {...props}>
      {children || (isDarkMode ? <SunIcon size={size} color={iconColor} /> : <MoonIcon size={size} color={iconColor} />)}
    </Pressable>
  );
});

NThemeToggle.displayName = 'NThemeToggle';
