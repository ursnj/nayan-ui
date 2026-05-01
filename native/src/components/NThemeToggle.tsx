import React, { useCallback } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { useNTheme } from '../hooks/useNTheme';
import { THEMES } from '../lib/utils';

export interface NThemeToggleProps extends Omit<PressableProps, 'onPress'> {
  className?: string;
  onThemeChange?: (theme: string) => void;
  children?: React.ReactNode;
}

export const NThemeToggle = React.memo<NThemeToggleProps>(({ className = '', onThemeChange, children, ...props }) => {
  const { isDarkMode, setTheme } = useNTheme();

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? THEMES.light : THEMES.dark;
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [isDarkMode, setTheme, onThemeChange]);

  return (
    <Pressable onPress={toggleTheme} className={className} {...props}>
      {children}
    </Pressable>
  );
});

NThemeToggle.displayName = 'NThemeToggle';
