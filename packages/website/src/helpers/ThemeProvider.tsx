'use client';

import { ReactNode, createContext, useContext, useMemo } from 'react';
import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

interface Props {
  children: ReactNode;
}

interface ThemeContextValue {
  theme: THEMES;
  setTheme: (theme: THEMES) => void;
  toggleTheme: () => void;
}

/*
 * One owner for the theme, read through context.
 *
 * Every component that wanted the theme used to call
 * `useLocalStorage('THEME')` for itself — the header, this provider, and the
 * code blocks. That hook holds its own `useState` per call site and syncs only
 * across tabs, through the `storage` event, which by specification does not
 * fire in the tab that did the writing. So the header's toggle updated the
 * header's copy of the value and localStorage, and nothing else in the tab
 * heard about it: `NTheme` kept rendering the old theme, the class on `<html>`
 * never changed, and the page only switched on the next reload. The toggle
 * looked broken because, from everywhere but the header, it was.
 *
 * The state lives here once and goes down as context, so a toggle is a single
 * re-render of the tree that actually holds the value. `useLocalStorage` still
 * does the persisting, at one call site where its per-instance state is the
 * whole truth rather than one of three copies.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/** The current theme and the two ways to change it. Must be used under `ThemeProvider`. */
export const useTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be called inside ThemeProvider.');
  return value;
};

const ThemeProvider = ({ children }: Props) => {
  const [stored, setStored] = useLocalStorage('THEME', THEMES.LIGHT);

  /* `useLocalStorage` is typed as possibly undefined, and a hand-edited
     localStorage entry can be anything at all. Anything but 'dark' is light. */
  const theme = stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next: THEMES) => setStored(next),
      toggleTheme: () => setStored(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)
    }),
    [theme, setStored]
  );

  return (
    <ThemeContext.Provider value={value}>
      <NTheme theme={theme}>{children}</NTheme>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
