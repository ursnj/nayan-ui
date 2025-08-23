import React, { useCallback, useMemo } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { useNTheme } from '@/hooks/useNTheme';
import { setAndroidNavigationBar } from '@/lib/android-navigation-bar';
import { MoonStar } from '@/lib/icons/MoonStar';
import { Sun } from '@/lib/icons/Sun';
import { THEMES, cn } from '@/lib/utils';

export interface NThemeToggleProps extends Omit<PressableProps, 'onPress'> {
  size?: number;
  strokeWidth?: number;
  className?: string;
  onThemeChange?: (theme: string) => void;
}

export const NThemeToggle = React.memo<NThemeToggleProps>(({ size = 30, strokeWidth = 1.25, className = '', onThemeChange, ...props }) => {
  const { isDarkMode, setTheme, themeColors } = useNTheme();

  const currentIcon = useMemo(() => {
    const IconComponent = isDarkMode ? MoonStar : Sun;
    return <IconComponent size={size} strokeWidth={strokeWidth} />;
  }, [isDarkMode, size, strokeWidth]);

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? THEMES.light : THEMES.dark;
    setTheme(newTheme);
    setAndroidNavigationBar(newTheme, themeColors);
    onThemeChange && onThemeChange(newTheme);
  }, [isDarkMode, setTheme, themeColors, onThemeChange]);

  return (
    <Pressable onPress={toggleTheme} {...props}>
      {React.cloneElement(currentIcon, {
        className: cn('text-primary', className)
      })}
    </Pressable>
  );
});

NThemeToggle.displayName = 'NThemeToggle';
