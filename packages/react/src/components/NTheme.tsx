import React, { HTMLAttributes, ReactNode, useEffect, useMemo } from 'react';
import { Toast } from '@heroui/react';
import { THEMES } from './Types';

export type ThemeType = keyof typeof THEMES | (typeof THEMES)[keyof typeof THEMES] | null;

export interface NThemeProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  theme?: ThemeType;
  children: ReactNode;
  onThemeChange?: (theme: string) => void;
}

export const NTheme = React.memo(({ children, theme = null, onThemeChange, ...mainProps }: NThemeProps) => {
  const finalTheme = useMemo(() => {
    const normalizedTheme = typeof theme === 'string' ? theme.toLowerCase() : theme;
    if (normalizedTheme === THEMES.LIGHT || normalizedTheme === THEMES.DARK) return normalizedTheme;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return !normalizedTheme && !prefersDark ? THEMES.LIGHT : THEMES.DARK;
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.document.documentElement.style.colorScheme = finalTheme;
      window.document.documentElement.setAttribute('data-theme', finalTheme);
      window.document.documentElement.classList.remove('light', 'dark');
      window.document.documentElement.classList.add(finalTheme);
    }
    if (onThemeChange) onThemeChange(finalTheme);
  }, [finalTheme, onThemeChange]);

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
