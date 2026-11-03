import React, { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { GAME_THEMES, type GameTheme, resolveGameTheme } from '../services/ThemeService';
import type { GameThemeMode } from '../services/UtilsService';

// Same constraint StyleSheet.create uses (RN does not export it by name)
type NamedStyles = Parameters<typeof StyleSheet.create>[0];

// Default is classic, so helpers rendered outside a provider look exactly as they always have
const GameThemeContext = createContext<GameTheme>(GAME_THEMES.classic);

interface GameThemeProviderProps {
  theme?: GameThemeMode;
  children: React.ReactNode;
}

/** Wrap a game in this to render its shared chrome (background, scoreboard, controls, modals) in the host's theme. */
export const GameThemeProvider: React.FC<GameThemeProviderProps> = ({ theme, children }) => (
  <GameThemeContext.Provider value={resolveGameTheme(theme)}>{children}</GameThemeContext.Provider>
);

export const useGameTheme = (): GameTheme => useContext(GameThemeContext);

/**
 * Build a StyleSheet per theme, once. There are only three theme objects, so the cache stays tiny
 * and every render after the first is a Map lookup.
 */
export const createThemedStyles = <S extends NamedStyles>(factory: (theme: GameTheme) => S & NamedStyles) => {
  const cache = new Map<GameTheme, Readonly<S>>();
  return (theme: GameTheme): Readonly<S> => {
    const cached = cache.get(theme);
    if (cached) return cached;
    const styles = StyleSheet.create<S>(factory(theme));
    cache.set(theme, styles);
    return styles;
  };
};
