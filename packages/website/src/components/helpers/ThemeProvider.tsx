"use client";

import { type ReactNode, useEffect, useState } from "react";
import { NPlatformView, NTheme, type NThemeMode, useNTheme } from 'nayan-ui/components';
import { siteThemes } from '@/design/palettes';

const STORAGE_KEY = "THEME";

function SiteAppearance() {
  const { resolvedTheme } = useNTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
  }, [resolvedTheme]);

  return null;
}

export function useTheme() {
  const { resolvedTheme: theme, setTheme, toggleTheme } = useNTheme();
  return { theme, setTheme, toggleTheme };
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<NThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {
      // Use the browser preference when the saved value is unavailable.
    }
    setReady(true);
  }, []);

  function changeTheme(value: NThemeMode) {
    setTheme(value);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // The preference still applies for this session.
    }
  }

  return (
    <NTheme theme={theme} themes={siteThemes} onThemeChange={changeTheme}>
      {ready && <SiteAppearance />}
      <NPlatformView>{children}</NPlatformView>
    </NTheme>
  );
}
