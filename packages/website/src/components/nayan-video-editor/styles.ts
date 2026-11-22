import type { EngineStyleRecipes } from 'nayan-ui/styles';

export default {
  browserOnly: true,
  rules: [
    {
      selector: 'html:has(.video-editor-workspace)',
      utilities:
        '[--field-border:var(--separator)] [--field-border-width:1px] [--field-height:1.875rem] [--ring-offset-width:0px] [--editor-chrome:var(--surface-secondary)] [--editor-canvas:var(--editor-chrome)] [--editor-panel:var(--surface)] [--editor-track:var(--surface-secondary)] [--editor-track-alt:var(--surface-tertiary)] [--editor-ruler:var(--surface-secondary)] [--playhead:hsl(352_84%_54%)] [--elevation:0_1px_2px_hsl(231_32%_14%_/_0.07)] [--elevation-lg:0_12px_36px_hsl(231_32%_14%_/_0.16)]'
    },
    {
      selector: 'html.dark:has(.video-editor-workspace)',
      utilities:
        '[--editor-chrome:hsl(230_16%_18%)] [--editor-panel:hsl(230_17%_14%)] [--editor-track:hsl(230_14%_15%)] [--editor-track-alt:hsl(230_15%_17%)] [--editor-ruler:hsl(230_16%_20%)] [--playhead:hsl(352_95%_68%)] [--elevation:0_1px_2px_hsl(0_0%_0%_/_0.36)] [--elevation-lg:0_12px_36px_hsl(0_0%_0%_/_0.45)]'
    },
    { selector: 'html:has(.video-editor-workspace) body', utilities: '[user-select:none] [overscroll-behavior:none]' },
    { selector: 'html:has(.video-editor-workspace) :is(input, textarea, [contenteditable])', utilities: '[user-select:text]' },
    {
      selector: 'html:has(.video-editor-workspace) [tabindex]:not(a, button, input, select, textarea, [role]):focus-visible',
      utilities: '[outline:none]'
    },
    {
      selector: ':where(html:has(.video-editor-workspace)) :is(.input, .number-field__input)',
      utilities: '[padding-block:0.25rem]',
      layer: 'components'
    },
    {
      selector:
        ':where(html:has(.video-editor-workspace)) .nyn-select .nyn-select__control, :where(html:has(.video-editor-workspace)) .nyn-number-field .number-field__group',
      utilities: '[height:var(--field-height)] [min-height:var(--field-height)]'
    },
    { selector: ':where(html:has(.video-editor-workspace)) .nyn-select .nyn-select__value-container', utilities: '[padding-block:0]' },
    { selector: ':where(html:has(.video-editor-workspace)) .nyn-select .nyn-select__indicator', utilities: '[padding:0.25rem]' },
    {
      selector: ':where(html:has(.video-editor-workspace)) .checkbox__control',
      utilities: '[border-style:solid] [border-width:var(--border-width-field)]'
    },
    {
      selector: ':where(html:has(.video-editor-workspace)) .nyn-select .nyn-select__control',
      utilities:
        'bg-field-background [border-width:var(--border-width-field)] [border-color:var(--field-border)] [border-radius:var(--field-radius,_calc(var(--radius)_*_1.5))] [box-shadow:none]'
    },
    {
      selector: ':where(html:has(.video-editor-workspace)) .nyn-select .nyn-select__control:hover',
      utilities: '[border-color:var(--field-border-hover)]'
    },
    {
      selector: ':where(html:has(.video-editor-workspace)) .nyn-select .nyn-select__control--is-focused',
      utilities: '[border-color:var(--field-border-focus)] [box-shadow:0_0_0_2px_var(--focus)]'
    },
    {
      selector: ':where(html:has(.video-editor-workspace)) .nyn-select__menu',
      utilities: '[background-color:var(--overlay,_var(--surface))] [border-color:var(--border)]'
    },
    {
      selector:
        ':where(html:has(.video-editor-workspace)) .nyn-select__single-value, :where(html:has(.video-editor-workspace)) .nyn-select__input-container',
      utilities: 'text-field-foreground'
    },
    {
      selector: ":where(html:has(.video-editor-workspace)) .slider[data-orientation='horizontal'] .slider__track",
      utilities: '[height:0.375rem] [border-inline-width:0.375rem]'
    },
    {
      selector: ":where(html:has(.video-editor-workspace)) .slider[data-orientation='horizontal'] .slider__thumb",
      utilities: '[width:0.75rem] [height:0.75rem] [border-radius:999px] [box-shadow:0_1px_2px_hsl(0_0%_0%_/_0.45)]'
    },
    {
      selector: ":where(html:has(.video-editor-workspace)) .slider[data-orientation='horizontal'] .slider__thumb::after",
      utilities: '[content:none]'
    },
    { selector: ':where(html:has(.video-editor-workspace)) *', utilities: '[scrollbar-width:thin] [scrollbar-color:var(--separator)_transparent]' },
    { selector: ':where(html:has(.video-editor-workspace)) *::-webkit-scrollbar', utilities: 'w-2.5 h-2.5' },
    { selector: ':where(html:has(.video-editor-workspace)) *::-webkit-scrollbar-track', utilities: '[background:transparent]' },
    {
      selector: ':where(html:has(.video-editor-workspace)) *::-webkit-scrollbar-thumb',
      utilities: '[background:var(--separator)] [border:3px_solid_transparent] [border-radius:999px] [background-clip:content-box]'
    },
    {
      selector: ':where(html:has(.video-editor-workspace)) *::-webkit-scrollbar-thumb:hover',
      utilities: '[background:var(--muted)] [background-clip:content-box]'
    },
    { selector: ':where(html:has(.video-editor-workspace)) *::-webkit-scrollbar-corner', utilities: '[background:transparent]' },
    { selector: '.panel', utilities: '[background:var(--editor-panel)] [border-color:var(--border)]', layer: 'utilities' },
    {
      selector: '.island',
      utilities:
        'overflow-hidden [border-radius:0.75rem] [border:1px_solid_var(--border)] [background:var(--editor-panel)] [box-shadow:var(--elevation)]',
      layer: 'utilities'
    },
    { selector: '.elevate', utilities: '[box-shadow:var(--elevation)]', layer: 'utilities' },
    { selector: '.elevate-lg', utilities: '[box-shadow:var(--elevation-lg)]', layer: 'utilities' },
    {
      selector: '.checkerboard',
      utilities:
        '[background-image:linear-gradient(45deg,_hsl(0_0%_50%_/_0.18)_25%,_transparent_25%),_linear-gradient(-45deg,_hsl(0_0%_50%_/_0.18)_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_hsl(0_0%_50%_/_0.18)_75%),_linear-gradient(-45deg,_transparent_75%,_hsl(0_0%_50%_/_0.18)_75%)] [background-size:16px_16px] [background-position:0_0,_0_8px,_8px_-8px,_-8px_0]',
      layer: 'utilities'
    },
    { selector: '.gpu-layer', utilities: '[will-change:transform] [transform:translateZ(0)]', layer: 'utilities' },
    { selector: '.animate-in', utilities: '[animation:editor-fade-in_140ms_ease-out]', layer: 'utilities' },
    {
      selector: '*, *::before, *::after',
      utilities: '[animation-duration:0.01ms]! [transition-duration:0.01ms]!',
      media: '(prefers-reduced-motion: reduce)'
    }
  ],
  keyframes: {
    'editor-fade-in': { from: 'opacity-0 [transform:translateY(4px)]', to: 'opacity-100 [transform:none]' }
  }
} satisfies EngineStyleRecipes;
