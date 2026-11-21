import { createContext } from 'react';
import type { NThemeProps } from './NTheme';
import type { ThemeFontData } from './theme/fonts';
import type { ComponentProps } from './types';
export { ComponentThemeContext, SystemBarsDepthContext } from './theme/contexts';

export type NThemeMode = 'light' | 'dark' | 'system';

export interface ComponentThemeValue extends Omit<NThemeProps, 'children' | 'components'> {
  components?: ComponentProps['components'];
  fontData?: ThemeFontData;
  systemTheme?: 'light' | 'dark';
  resolvedTheme?: 'light' | 'dark';
  setTheme?: (theme: NThemeMode) => void;
  toggleTheme?: () => void;
}
export const ComponentRenderContext = /* @__PURE__ */ createContext(false);
export const PlatformRenderContext = /* @__PURE__ */ createContext(false);
