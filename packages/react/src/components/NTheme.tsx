import React, { HTMLAttributes, ReactNode, useEffect, useMemo } from 'react';
import { Toast } from '@heroui/react';
import { useLocalStorage } from './NLocalStorage';
import { THEMES } from './Types';

export type ThemeType = keyof typeof THEMES | (typeof THEMES)[keyof typeof THEMES] | null;

export interface NThemeProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  theme?: ThemeType;
  children: ReactNode;
  onThemeChange?: (theme: string) => void;
}

export const NTheme = React.memo(({ children, theme = null, onThemeChange, ...mainProps }: NThemeProps) => {
  const [_, setTheme] = useLocalStorage('THEME', '');

  const finalTheme = useMemo(() => {
    if (theme === THEMES.LIGHT || theme === THEMES.DARK) return theme;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return !theme && !prefersDark ? THEMES.LIGHT : theme || THEMES.DARK;
  }, [theme]);

  useEffect(() => {
    setTheme(finalTheme);
    if (typeof window !== 'undefined') {
      window.document.documentElement.style.colorScheme = finalTheme;
      window.document.documentElement.setAttribute('data-theme', finalTheme);
      window.document.documentElement.setAttribute('lang', 'en');
    }
    if (onThemeChange) onThemeChange(finalTheme);
  }, [finalTheme, setTheme, onThemeChange]);

  return (
    <>
      <main role="main" tabIndex={-1} {...mainProps}>
        {children}
      </main>
      <Toast.Provider />
    </>
  );
});

NTheme.displayName = 'NTheme';
