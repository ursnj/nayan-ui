import type { EngineStyleRecipes } from 'nayan-ui/styles';

export default {
  browserOnly: true,
  rules: [
    {
      selector: 'body',
      utilities:
        "text-foreground [background:var(--background)] [font-size:1rem] [font-family:'Inter',_'Avenir_Next',_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_Roboto,_sans-serif] [overflow-x:hidden] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]"
    },
    { selector: 'a.active', utilities: 'text-accent!' },
    { selector: 'html', utilities: '[scroll-padding-top:var(--site-header-height)]' },
    { selector: 'html:has(.nyn-game-page), html:has(.nyn-game-page) body', utilities: 'overflow-hidden [overscroll-behavior:none]' },
    { selector: '.nyn-game-surface [data-engine-keyboard-cursor]', utilities: 'invisible' },
    {
      selector: '.nyn-game-surface',
      utilities: '[touch-action:none] [-webkit-user-select:none] [user-select:none] [-webkit-tap-highlight-color:transparent]'
    },
    { selector: '.nyn-game-boot-dots', utilities: 'flex gap-2 [margin:24px_0_14px]' },
    {
      selector: '.nyn-game-boot-dots span',
      utilities: 'w-2 h-2 rounded-full [background:var(--color-indigo-500,_#6366f1)] [animation:nyn-game-boot-pulse_1.2s_ease-in-out_infinite]'
    },
    { selector: '.nyn-game-boot-dots span:nth-child(2)', utilities: '[animation-delay:0.15s]' },
    { selector: '.nyn-game-boot-dots span:nth-child(3)', utilities: '[animation-delay:0.3s]' },
    { selector: '.nyn-game-boot-dots span', utilities: '[animation:none]', media: '(prefers-reduced-motion: reduce)' },
    {
      selector: '.nyn-game-panel',
      utilities:
        'fixed [inset:0_0_0_auto] m-0 [width:min(100%,_460px)] h-dvh max-w-none [max-height:none] p-0 overflow-hidden [border-width:0_0_0_1px] [border-style:solid] [box-shadow:-16px_0_56px_rgb(0_0_0_/_0.2)]'
    },
    { selector: '.nyn-game-panel[open]', utilities: 'flex flex-col [animation:nyn-game-panel-in_0.2s_ease-out]' },
    {
      selector: '.nyn-game-panel::backdrop',
      utilities: '[background:rgb(15_23_42_/_0.45)] [-webkit-backdrop-filter:blur(2px)] [backdrop-filter:blur(2px)]'
    },
    { selector: '.nyn-game-panel-header', utilities: '[padding-top:max(1.25rem,_env(safe-area-inset-top))]' },
    { selector: '.nyn-game-panel[open]', utilities: '[animation:none]', media: '(prefers-reduced-motion: reduce)' },
    {
      selector: '.nyn-game-popover',
      utilities: 'fixed [inset:auto] m-0 [width:min(360px,_calc(100vw_-_32px))] [max-height:calc(100dvh_-_96px)] overflow-hidden'
    },
    { selector: '.nyn-game-popover:popover-open', utilities: 'flex flex-col' },
    { selector: "[data-testid='game-settings-popover']", utilities: '[-webkit-backdrop-filter:blur(20px)] [backdrop-filter:blur(20px)]' }
  ],
  keyframes: {
    'nyn-game-boot-pulse': { '0%,\n  80%,\n  100%': '[opacity:0.35] [transform:translateY(0)]', '40%': 'opacity-100 [transform:translateY(-5px)]' },
    'nyn-game-panel-in': { from: '[transform:translateX(24px)] opacity-0' }
  }
} satisfies EngineStyleRecipes;
