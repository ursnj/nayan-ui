'use client';

import { useEffect, useState } from 'react';
import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return <NTheme theme={mounted ? theme : THEMES.LIGHT}>{children}</NTheme>;
}
