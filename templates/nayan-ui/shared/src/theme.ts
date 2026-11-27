import type { ComponentThemeColor, NThemeProps } from 'nayan-ui/components';
import { createStorage } from 'nayan-ui/storage';
import type { EngineStyleRecipes } from 'nayan-ui/styles';

type StarterPalette = Record<
  ComponentThemeColor | 'surface-secondary-foreground' | 'surface-tertiary-foreground' | 'segment' | 'segment-foreground',
  string
>;

export const starterTheme = {
  defaultTheme: 'system',
  palettes: {
    light: {
      background: '#f1f5f9',
      foreground: '#0f172a',
      surface: '#ffffff',
      'surface-foreground': '#0f172a',
      'surface-secondary': '#f1f5f9',
      'surface-secondary-foreground': '#0f172a',
      'surface-tertiary': '#e2e8f0',
      'surface-tertiary-foreground': '#0f172a',
      overlay: '#ffffff',
      'overlay-foreground': '#0f172a',
      muted: '#475569',
      default: '#e2e8f0',
      'default-foreground': '#0f172a',
      accent: '#1d4ed8',
      'accent-foreground': '#ffffff',
      action: '#1d4ed8',
      'action-foreground': '#ffffff',
      'field-background': '#ffffff',
      'field-foreground': '#0f172a',
      'field-placeholder': '#475569',
      'field-border': '#64748b',
      success: '#166534',
      'success-foreground': '#ffffff',
      warning: '#92400e',
      'warning-foreground': '#ffffff',
      danger: '#b91c1c',
      'danger-foreground': '#ffffff',
      border: '#cbd5e1',
      separator: '#cbd5e1',
      focus: '#1d4ed8',
      link: '#1d4ed8',
      segment: '#ffffff',
      'segment-foreground': '#0f172a'
    },
    dark: {
      background: '#0f172a',
      foreground: '#f8fafc',
      surface: '#1e293b',
      'surface-foreground': '#f8fafc',
      'surface-secondary': '#334155',
      'surface-secondary-foreground': '#f8fafc',
      'surface-tertiary': '#475569',
      'surface-tertiary-foreground': '#f8fafc',
      overlay: '#1e293b',
      'overlay-foreground': '#f8fafc',
      muted: '#cbd5e1',
      default: '#334155',
      'default-foreground': '#f8fafc',
      accent: '#93c5fd',
      'accent-foreground': '#0f172a',
      action: '#2563eb',
      'action-foreground': '#ffffff',
      'field-background': '#0f172a',
      'field-foreground': '#f8fafc',
      'field-placeholder': '#94a3b8',
      'field-border': '#64748b',
      success: '#86efac',
      'success-foreground': '#0f172a',
      warning: '#fcd34d',
      'warning-foreground': '#0f172a',
      danger: '#fca5a5',
      'danger-foreground': '#0f172a',
      border: '#334155',
      separator: '#475569',
      focus: '#93c5fd',
      link: '#93c5fd',
      segment: '#334155',
      'segment-foreground': '#f8fafc'
    }
  } satisfies Record<'light' | 'dark', StarterPalette>,
  persistence: { storage: createStorage({ id: 'nayan-ui-starter' }), key: 'theme' }
} satisfies NThemeProps;

export default {
  browserOnly: true,
  rules: Object.entries(starterTheme.palettes).map(([theme, palette]) => ({
    selector: `[data-theme="${theme}"]`,
    utilities: [`[color-scheme:${theme}]`, ...Object.entries(palette).map(([token, value]) => `[--${token}:${value}]`)].join(' ')
  }))
} satisfies EngineStyleRecipes;
