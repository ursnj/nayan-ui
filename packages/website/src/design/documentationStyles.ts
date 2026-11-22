import type { EngineStyleRecipes } from 'nayan-ui/styles';

export const documentationThemes = {
  light: {
    background: '#edf1f8',
    foreground: '#0f1729',
    surface: '#fff',
    'surface-foreground': '#0f1729',
    'surface-secondary': '#f1f4f9',
    'surface-secondary-foreground': '#0f1729',
    'surface-tertiary': '#e7ecf3',
    'surface-tertiary-foreground': '#0f1729',
    overlay: '#fff',
    'overlay-foreground': '#0f1729',
    muted: '#65758b',
    default: '#dde4ee',
    'default-foreground': '#0f1729',
    accent: '#0b64f4',
    'accent-foreground': '#fff',
    'field-background': '#fff',
    'field-foreground': '#0f1729',
    'field-placeholder': '#65758b',
    success: '#21c45d',
    'success-foreground': '#0f1729',
    warning: '#f59f0a',
    'warning-foreground': '#0f1729',
    danger: '#ef4343',
    'danger-foreground': '#fff',
    border: '#cfdae8',
    separator: '#b3c0d1',
    focus: '#0b64f4',
    link: '#0f1729',
    segment: '#fff',
    'segment-foreground': '#0f1729'
  },
  dark: {
    background: '#0f1729',
    foreground: '#f8fafc',
    surface: '#26344b',
    'surface-foreground': '#f8fafc',
    'surface-secondary': '#2e3e56',
    'surface-secondary-foreground': '#f8fafc',
    'surface-tertiary': '#374862',
    'surface-tertiary-foreground': '#f8fafc',
    overlay: '#26344b',
    'overlay-foreground': '#f8fafc',
    muted: '#94a3b8',
    default: '#2c3d58',
    'default-foreground': '#f8fafc',
    accent: '#3c83f6',
    'accent-foreground': '#f8fafc',
    'field-background': '#26344b',
    'field-foreground': '#f8fafc',
    'field-placeholder': '#94a3b8',
    success: '#21c45d',
    'success-foreground': '#0f1729',
    warning: '#f6a823',
    'warning-foreground': '#0f1729',
    danger: '#dc2828',
    'danger-foreground': '#f8fafc',
    border: '#30425f',
    separator: '#495b79',
    focus: '#3c83f6',
    link: '#f8fafc',
    segment: '#3e516f',
    'segment-foreground': '#f8fafc'
  }
} as const;

function themeUtilities(mode: keyof typeof documentationThemes) {
  const colors = Object.entries(documentationThemes[mode]).map(([token, color]) => `[--${token}:${color.replace(/ /g, '_')}]`);
  return colors.join(' ');
}

export default {
  browserOnly: true,
  rules: [
    { selector: ':root:has(.component-documentation):not([data-theme=dark])', utilities: themeUtilities('light') },
    { selector: ':root:has(.component-documentation)[data-theme=dark]', utilities: themeUtilities('dark') },
    { selector: '.component-documentation', utilities: '[max-width:78rem] [padding:1.5rem_1rem]' },
    { selector: '.component-documentation .browser-frame-dots > span', utilities: '[background:var(--default)]' },
    { selector: '.component-documentation .site-docs-heading h1', utilities: '[font-size:clamp(1.875rem,_3vw,_2.25rem)] [letter-spacing:-0.045em]' },
    { selector: '.component-documentation .engine-preview-action', utilities: 'min-h-9 [padding:0_16px]' },
    { selector: '.component-documentation .engine-preview-action-outline', utilities: 'bg-transparent' },
    { selector: '.component-documentation .engine-preview-action-outline:hover', utilities: 'bg-surface-secondary' },
    {
      selector: '.component-documentation > div',
      utilities: '[grid-template-columns:17.5rem_minmax(0,_1fr)] [gap:2rem]',
      media: '(min-width: 1024px)'
    }
  ]
} satisfies EngineStyleRecipes;
