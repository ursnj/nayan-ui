"use client";

import { ReactNode, createContext, useContext, useMemo } from "react";
import { NTheme, THEMES, useLocalStorage } from "@nayan-ui/react";

interface Props {
  children: ReactNode;
}

interface ThemeContextValue {
  theme: THEMES;
  setTheme: (theme: THEMES) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** The current theme and the two ways to change it. Must be used under `ThemeProvider`. */
export const useTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be called inside ThemeProvider.");
  return value;
};

const ThemeProvider = ({ children }: Props) => {
  const [stored, setStored] = useLocalStorage("THEME", THEMES.LIGHT);

  const theme = stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next: THEMES) => setStored(next),
      toggleTheme: () => setStored(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK),
    }),
    [theme, setStored],
  );

  return (
    <ThemeContext.Provider value={value}>
      <NTheme theme={theme}>{children}</NTheme>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
