import type { ComponentThemeColors } from './types';

export interface SystemBarsOptions {
  /** Override only the bars' theme while retaining this NTheme's UI palette. */
  theme?: 'light' | 'dark' | 'system';
  statusBarStyle?: 'auto' | 'light' | 'dark';
  /** Android only. */
  navigationBarStyle?: 'auto' | 'light' | 'dark';
  statusBarHidden?: boolean;
  /** Android only. Hidden bars remain accessible with a system swipe. */
  navigationBarHidden?: boolean;
}

/** React Navigation-compatible focus source; events work even for retained/frozen screens. */
export interface SystemBarsNavigation {
  isFocused(): boolean;
  addListener(event: 'focus' | 'blur', listener: () => void): () => void;
}
export interface ThemeSystemBarsConfiguration {
  depth: number;
  theme?: string;
  colors?: ComponentThemeColors;
  themes?: { light?: ComponentThemeColors; dark?: ComponentThemeColors };
  options: SystemBarsOptions;
}
