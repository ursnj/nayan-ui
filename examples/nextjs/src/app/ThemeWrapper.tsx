'use client';

import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);

  return <NTheme theme={theme}>{children}</NTheme>;
}
