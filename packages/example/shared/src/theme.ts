import type { NThemeProps } from 'nayan-ui/components';
import { createStorage } from 'nayan-ui/storage';
import type { EngineStyleRecipes } from 'nayan-ui/styles';

export const starterTheme = {
  defaultTheme: 'system',
  palettes: {
    light: {
      background: '#f1f5f9',
      surface: '#ffffff',
      foreground: '#0f172a',
      muted: '#475569',
      border: '#cbd5e1'
    },
    dark: {
      background: '#0f172a',
      surface: '#1e293b',
      foreground: '#f8fafc',
      muted: '#cbd5e1',
      border: '#334155'
    }
  },
  persistence: { storage: createStorage({ id: 'nayan-ui-starter' }), key: 'theme' }
} satisfies NThemeProps;

export default {
  browserOnly: true,
  rules: Object.entries(starterTheme.palettes).map(([theme, palette]) => ({
    selector: `[data-theme="${theme}"]`,
    utilities: Object.entries(palette)
      .map(([token, value]) => `[--${token}:${value}]`)
      .join(' ')
  }))
} satisfies EngineStyleRecipes;
