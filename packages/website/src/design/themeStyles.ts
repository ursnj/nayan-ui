import type { EngineStyleRecipes } from 'nayan-ui/styles';

export const siteThemes = {
  light: {
    background: 'hsl(264 56% 98%)',
    foreground: 'hsl(268 40% 13%)',
    surface: 'hsl(0 0% 100%)',
    'surface-foreground': 'hsl(268 40% 13%)',
    'surface-secondary': 'hsl(264 54% 95%)',
    'surface-secondary-foreground': 'hsl(268 40% 13%)',
    'surface-tertiary': 'hsl(267 48% 91%)',
    'surface-tertiary-foreground': 'hsl(268 40% 13%)',
    overlay: 'hsl(0 0% 100%)',
    'overlay-foreground': 'hsl(268 40% 13%)',
    muted: 'hsl(265 15% 39%)',
    default: 'hsl(263 37% 90%)',
    'default-foreground': 'hsl(268 40% 13%)',
    accent: 'hsl(265 77% 49%)',
    'accent-foreground': 'hsl(0 0% 100%)',
    'field-background': 'hsl(0 0% 100%)',
    'field-foreground': 'hsl(268 40% 13%)',
    'field-placeholder': 'hsl(265 15% 39%)',
    success: 'hsl(142 71% 45%)',
    'success-foreground': 'hsl(268 40% 13%)',
    warning: 'hsl(38 92% 50%)',
    'warning-foreground': 'hsl(268 40% 13%)',
    danger: 'hsl(0 84% 60%)',
    'danger-foreground': 'hsl(0 0% 100%)',
    border: 'hsl(264 32% 86%)',
    separator: 'hsl(264 26% 75%)',
    focus: 'hsl(265 77% 49%)',
    link: 'var(--accent)',
    segment: 'hsl(0 0% 100%)',
    'segment-foreground': 'hsl(268 40% 13%)'
  },
  dark: {
    background: 'hsl(266 39% 9%)',
    foreground: 'hsl(265 48% 96%)',
    surface: 'hsl(266 30% 14%)',
    'surface-foreground': 'hsl(265 48% 96%)',
    'surface-secondary': 'hsl(266 28% 18%)',
    'surface-secondary-foreground': 'hsl(265 48% 96%)',
    'surface-tertiary': 'hsl(266 26% 23%)',
    'surface-tertiary-foreground': 'hsl(265 48% 96%)',
    overlay: 'hsl(266 30% 14%)',
    'overlay-foreground': 'hsl(265 48% 96%)',
    muted: 'hsl(266 19% 72%)',
    default: 'hsl(266 22% 25%)',
    'default-foreground': 'hsl(265 48% 96%)',
    accent: 'hsl(263 100% 80%)',
    'accent-foreground': 'hsl(268 40% 13%)',
    'field-background': 'hsl(266 30% 14%)',
    'field-foreground': 'hsl(265 48% 96%)',
    'field-placeholder': 'hsl(266 19% 72%)',
    success: 'hsl(142 71% 45%)',
    'success-foreground': 'hsl(268 40% 13%)',
    warning: 'hsl(38 92% 55%)',
    'warning-foreground': 'hsl(268 40% 13%)',
    danger: 'hsl(0 72% 51%)',
    'danger-foreground': 'hsl(265 48% 96%)',
    border: 'hsl(266 23% 27%)',
    separator: 'hsl(266 19% 42%)',
    focus: 'hsl(263 100% 80%)',
    link: 'var(--accent)',
    segment: 'hsl(266 22% 22%)',
    'segment-foreground': 'hsl(265 48% 96%)'
  }
} as const;

function themeUtilities(mode: keyof typeof siteThemes) {
  const colors = Object.entries(siteThemes[mode]).map(([token, color]) => `[--${token}:${color.replace(/ /g, '_')}]`);
  return [`[color-scheme:${mode}]`, ...colors].join(' ');
}

export default {
  rules: [
    { selector: ':root, [data-theme=light]', utilities: themeUtilities('light') },
    { selector: '.dark, [data-theme=dark]', utilities: themeUtilities('dark') },
    {
      selector: '.engine-preview-action',
      utilities:
        'min-h-11 [padding:8px_14px] [border:1px_solid_transparent] rounded-lg bg-accent text-accent-foreground [font-size:14px] font-semibold text-center whitespace-nowrap'
    },
    { selector: '.engine-preview-action:hover', utilities: '[background-color:color-mix(in_srgb,_var(--accent)_86%,_var(--surface))]' },
    { selector: '.engine-preview-action:disabled', utilities: 'opacity-50' },
    { selector: '.engine-preview-action:focus-visible', utilities: '[outline:2px_solid_var(--accent)] [outline-offset:2px]' },
    { selector: '.engine-preview-action-outline', utilities: '[border-color:var(--border)] bg-surface text-foreground' },
    { selector: '.engine-preview-action-outline:hover', utilities: 'bg-surface-secondary' },
    { selector: '.engine-preview-action-ghost', utilities: 'bg-transparent text-accent' },
    { selector: '.engine-preview-action-ghost:hover', utilities: 'bg-surface-secondary' },
    { selector: '.engine-preview-action-danger', utilities: 'bg-danger text-danger-foreground' },
    { selector: '.engine-preview-action-danger:hover', utilities: 'bg-danger [opacity:0.9]' },
    {
      selector: '.engine-preview-input',
      utilities:
        'w-full h-11 min-h-11 [padding:0_12px] [border:1px_solid_var(--border)] rounded-lg bg-field-background text-foreground [font-size:14px]'
    },
    { selector: '.engine-preview-input:focus-visible', utilities: '[outline:2px_solid_var(--accent)]' },
    { selector: '.engine-preview-surface canvas', utilities: '[touch-action:pan-y]!' }
  ]
} satisfies EngineStyleRecipes;
