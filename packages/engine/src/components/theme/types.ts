import type { Storage } from '../../storage/store';
import type { NThemeMode } from '../ThemeContext';
import type { ComponentThemeColors } from '../types';

/** Application tokens. Augment this interface through @nayan-ui/engine/components for typed custom values. */
export interface NThemePalette {
  [token: string]: string | number | undefined;
}

export interface NThemeAppearance {
  /** Selected preference; use resolvedTheme for the active light/dark appearance. */
  theme: NThemeMode;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isDarkMode: boolean;
  /** Active application tokens, including camelCase aliases of semantic colors. */
  palette: NThemePalette;
  /** Semantic overrides; unspecified colors retain the renderer's defaults. */
  colors: ComponentThemeColors;
}

export interface NThemePersistence {
  /** Engine storage or a compatible synchronous adapter. No renderer or world is initialized. */
  storage: Pick<Storage, 'getString' | 'set' | 'subscribe'>;
  key?: string;
  /** JSON encoding supports preferences already stored with setJSON. Default: string. */
  encoding?: 'string' | 'json';
}
