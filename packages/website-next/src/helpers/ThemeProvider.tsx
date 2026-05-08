'use client';

import { ReactNode } from 'react';
import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

interface Props {
  children: ReactNode;
}

const ThemeProvider = ({ children }: Props) => {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);

  return <NTheme theme={theme}>{children}</NTheme>;
};

export default ThemeProvider;
