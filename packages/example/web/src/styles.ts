import type { EngineStyleRecipes } from 'nayan-ui/styles';

export default {
  browserOnly: true,
  rules: [
    { selector: 'html, body', utilities: 'm-0 min-h-full [background:#0f172a] [font-family:system-ui,_sans-serif]' },
    {
      selector: '.game-toolbar',
      utilities: '[padding-left:max(16px,_env(safe-area-inset-left))] [padding-right:max(16px,_env(safe-area-inset-right))]'
    },
    {
      selector: '.game-toolbar-button',
      utilities:
        'pointer-events-auto flex w-10 h-10 shrink-0 items-center justify-center [border:1px_solid_var(--game-border)] rounded-xl [background:color-mix(in_srgb,_var(--game-surface)_80%,_transparent)] [color:var(--game-text)] [box-shadow:0_10px_15px_-3px_#0000001a] [backdrop-filter:blur(12px)] [transition:color_150ms,_border-color_150ms] cursor-pointer'
    },
    { selector: '.game-toolbar-button', utilities: 'w-11 h-11', media: '(min-width: 640px)' },
    {
      selector: ".game-toolbar-button:hover, .game-toolbar-button[aria-expanded='true']",
      utilities: '[color:var(--game-accent)] [border-color:color-mix(in_srgb,_var(--game-accent)_40%,_transparent)]'
    },
    {
      selector: '.game-toolbar-button:focus-visible, .game-popover-close:focus-visible',
      utilities: '[outline:2px_solid_var(--game-accent)] [outline-offset:2px]'
    },
    {
      selector: '.game-keyboard-popover',
      utilities:
        'pointer-events-auto fixed [inset:auto] m-0 [width:min(360px,_calc(100vw_-_32px))] [max-height:calc(100dvh_-_96px)] overflow-hidden p-5 [border:1px_solid_var(--game-border)] rounded-2xl [background:color-mix(in_srgb,_var(--game-surface)_90%,_transparent)] [color:var(--game-text)] [box-shadow:0_25px_50px_-12px_#0003] [backdrop-filter:blur(20px)]'
    },
    { selector: '.game-keyboard-popover:popover-open', utilities: 'flex flex-col' },
    { selector: '.game-popover-close', utilities: 'grid [place-items:center] w-8 h-8 rounded-lg cursor-pointer' },
    { selector: '.game-popover-close:hover', utilities: '[background:var(--game-border)]' },
    {
      selector: '.game-keyboard-popover kbd',
      utilities:
        'inline-block min-w-6 [padding:2px_6px] [border:1px_solid_var(--game-border)] [border-bottom-width:2px] [border-radius:5px] [background:var(--game-surface)] [font-size:12px] text-center'
    },
    { selector: "[data-testid='game-settings-popover']", utilities: '[backdrop-filter:blur(20px)]' },
    { selector: "dialog[data-testid='game-settings-popover']::backdrop", utilities: '[background:transparent]' },
    {
      selector: '.example-card',
      utilities: '[border:1px_solid_#2c3c55] [border-radius:14px] [background:#192539] [transition:border-color_150ms,_background_150ms]'
    },
    { selector: '.example-card:hover', utilities: '[border-color:#6484ac] [background:#22314b]' },
    { selector: '.example-card:focus-visible', utilities: '[outline:2px_solid_#7dd3fc] [outline-offset:3px]' },
    { selector: '.example-feature', utilities: '[border-color:#385a82] [background:linear-gradient(115deg,_#263d60,_#1b2b43)]' }
  ]
} satisfies EngineStyleRecipes;
