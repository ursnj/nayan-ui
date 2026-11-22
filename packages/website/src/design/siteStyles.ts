import type { EngineStyleRecipes } from 'nayan-ui/styles';

export default {
  browserOnly: true,
  rules: [
    { selector: ':where(button, input, textarea, select)', utilities: 'm-0', layer: 'base' },
    { selector: ':where(button, input, textarea, select)', utilities: '[border-color:currentColor]', layer: 'base' },
    { selector: "[role='button']", utilities: 'cursor-pointer', layer: 'base' },
    { selector: ':root', utilities: '[--site-header-height:4.25rem] [--site-grid-line:color-mix(in_srgb,_var(--accent)_8%,_transparent)]' },
    { selector: '.site-header', utilities: '[background:color-mix(in_srgb,_var(--surface)_92%,_transparent)]' },
    { selector: '.site-header-row', utilities: '[height:calc(var(--site-header-height)_-_1px)]' },
    { selector: '.site-header-actions', utilities: 'flex items-center [gap:0.15rem]' },
    {
      selector: '.site-header-action',
      utilities:
        'inline-grid [flex:none] [place-items:center] [width:2.4rem] [height:2.4rem] [border-radius:0.5rem] text-muted [transition:color_150ms,_background-color_150ms]'
    },
    { selector: '.site-header-action:hover', utilities: 'text-foreground bg-surface-tertiary' },
    {
      selector: '.site-skip-link',
      utilities:
        'fixed [z-index:60] [top:0.75rem] [left:0.75rem] [padding:0.625rem_1rem] [transform:translateY(calc(-100%_-_1rem))] [border-radius:0.5rem] [background:var(--accent)] text-accent-foreground font-semibold'
    },
    { selector: '.site-skip-link:focus', utilities: '[transform:none]' },
    { selector: 'html:has(.fullscreen-workspace) :is(.site-header, .site-footer, .site-skip-link)', utilities: 'hidden' },
    { selector: 'html:has(.fullscreen-workspace) .site-main', utilities: 'min-h-0 pt-0' },
    {
      selector: ':where(a, button, input, select, textarea, summary, [tabindex]):focus-visible',
      utilities: '[outline:2px_solid_var(--focus)] [outline-offset:3px]',
      layer: 'base'
    },
    { selector: "[data-tone='violet']", utilities: '[--tone:#9d70f5] [--tone-paper:#e9deff] [--tone-ink:#5523a4]' },
    { selector: "[data-tone='lime']", utilities: '[--tone:#b3d739] [--tone-paper:#edf7bd] [--tone-ink:#425704]' },
    { selector: "[data-tone='peach'], [data-genre='Action']", utilities: '[--tone:#ef9a5e] [--tone-paper:#ffdfc8] [--tone-ink:#843a10]' },
    { selector: "[data-tone='pink'], [data-genre='Arcade']", utilities: '[--tone:#e783b5] [--tone-paper:#fbe0ef] [--tone-ink:#8b265b]' },
    { selector: "[data-tone='blue'], [data-genre='Puzzle']", utilities: '[--tone:#8d9af8] [--tone-paper:#e0e5ff] [--tone-ink:#383e9c]' },
    { selector: "[data-tone='mint'], [data-genre='Strategy']", utilities: '[--tone:#6dceb1] [--tone-paper:#d7f4e9] [--tone-ink:#18644f]' },
    {
      selector: '.dark :is([data-tone], [data-genre])',
      utilities:
        '[--tone-paper:color-mix(in_srgb,_var(--tone,_#ab82f0)_20%,_var(--surface))] [--tone-ink:color-mix(in_srgb,_var(--tone,_#ab82f0)_66%,_#fff)]'
    },
    {
      selector: '.home-hero',
      utilities:
        '[border-bottom:1px_solid_var(--border)] [background:radial-gradient(ellipse_at_81%_10%,_color-mix(in_srgb,_#b298f6_24%,_transparent),_transparent_64%),_var(--background)]'
    },
    {
      selector: '.dark .home-hero',
      utilities: '[background:radial-gradient(ellipse_at_81%_10%,_color-mix(in_srgb,_#9653fd_21%,_transparent),_transparent_67%),_var(--background)]'
    },
    {
      selector: '.home-hero-layout, .home-demo-layout',
      utilities: 'grid [grid-template-columns:minmax(0,_1fr)] items-center [gap:clamp(2rem,_5vw,_4rem)]'
    },
    { selector: '.home-hero-layout', utilities: '[padding-block:clamp(2.8rem,_5.7vw,_5.1rem)_clamp(1.6rem,_3.4vw,_3rem)]' },
    { selector: '.home-hero-copy, .home-hero-media, .home-demo-copy', utilities: 'min-w-0' },
    {
      selector: '.home-engine-label',
      utilities: 'flex items-center [gap:0.45rem] [margin-bottom:1.15rem] text-accent font-bold [font-size:0.88rem]'
    },
    {
      selector: '.home-title',
      utilities: 'text-foreground [font-size:clamp(3.05rem,_5.65vw,_6rem)] [line-height:0.98] [letter-spacing:-0.073em] font-bold'
    },
    { selector: '.home-title span', utilities: 'block text-accent' },
    {
      selector: '.home-intro',
      utilities: '[max-width:34rem] [margin-top:1.3rem] text-muted [font-size:clamp(1rem,_1.5vw,_1.15rem)] [line-height:1.58]'
    },
    { selector: '.home-actions', utilities: 'flex flex-wrap [gap:0.7rem] [margin-top:1.45rem]' },
    { selector: '.home-hero-media', utilities: 'relative isolate' },
    {
      selector: '.home-hero-artwork',
      utilities:
        'overflow-hidden [aspect-ratio:4_/_3] [border-radius:clamp(1.3rem,_2.35vw,_2.4rem)] [background:#d7b9fb] [box-shadow:0_18px_52px_color-mix(in_srgb,_var(--accent)_12%,_transparent)]'
    },
    { selector: '.home-hero-artwork img', utilities: 'block w-full h-full object-cover' },
    { selector: '.home-hero-code', utilities: 'relative [max-width:26rem] min-w-0 [margin:-2.25rem_0.65rem_0]' },
    { selector: '.home-hero-code .site-code-block', utilities: '[box-shadow:0_18px_42px_rgb(38_12_63_/_0.25)]' },
    {
      selector: '.home-hero-code .site-code-scroll pre',
      utilities:
        'min-w-0 [padding-block:0.75rem_0.85rem] whitespace-pre-wrap [overflow-wrap:anywhere] [font-size:clamp(0.63rem,_0.82vw,_0.74rem)] [line-height:1.5]'
    },
    {
      selector: '.home-platforms',
      utilities:
        'flex flex-wrap items-center [gap:0.5rem_clamp(1rem,_3vw,_2rem)] [padding-block:0.9rem] [border-top:1px_solid_var(--border)] text-muted [font-size:0.8rem]'
    },
    { selector: '.home-platforms > span', utilities: '[font-family:var(--font-mono,_monospace)]' },
    { selector: '.home-platforms a', utilities: 'inline-flex items-center [gap:0.35rem] [min-height:2rem] text-foreground [font-weight:650]' },
    { selector: '.home-platforms a:hover', utilities: 'text-accent' },
    { selector: '.home-catalog', utilities: '[padding-top:clamp(2.7rem,_4vw,_3.55rem)]' },
    {
      selector: '.home-product-grid',
      utilities: 'grid [grid-template-columns:minmax(0,_1fr)] [gap:0.85rem] [margin-top:clamp(1.3rem,_2.7vw,_2.2rem)]'
    },
    {
      selector: '.home-product',
      utilities:
        'flex flex-col justify-between [gap:1.2rem] [min-height:10.8rem] [padding:clamp(1rem,_2.4vw,_1.6rem)] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink)_13%,_transparent)] [border-radius:1.3rem] [background:var(--tone-paper)] [transition:box-shadow_180ms,_border-color_180ms]'
    },
    {
      selector: '.home-product:hover',
      utilities:
        '[border-color:color-mix(in_srgb,_var(--tone-ink)_38%,_transparent)] [box-shadow:0_8px_22px_color-mix(in_srgb,_var(--tone)_28%,_transparent)]'
    },
    { selector: '.home-product-top, .home-product-icon', utilities: 'flex items-center' },
    { selector: '.home-product-top', utilities: 'justify-between [color:var(--tone-ink)]' },
    {
      selector: '.home-product-icon',
      utilities:
        'justify-center [width:2.7rem] [height:2.7rem] [border-radius:0.85rem] [background:color-mix(in_srgb,_var(--tone-ink)_11%,_transparent)]'
    },
    { selector: '.home-product-arrow', utilities: '[transition:transform_180ms]' },
    { selector: '.home-product:hover .home-product-arrow', utilities: '[transform:translate(2px,_-2px)]' },
    {
      selector: '.home-product h3',
      utilities: 'text-foreground [font-size:clamp(1.22rem,_2vw,_1.6rem)] font-bold [line-height:1.1] [letter-spacing:-0.043em]'
    },
    {
      selector: '.home-product p',
      utilities:
        '[max-width:36ch] [margin-top:0.48rem] [color:color-mix(in_srgb,_var(--foreground)_79%,_var(--tone-paper))] [font-size:0.875rem] [line-height:1.56]'
    },
    {
      selector: '.home-demo-section',
      utilities:
        '[border-block:1px_solid_var(--border)] [background:radial-gradient(ellipse_at_8%_0%,_color-mix(in_srgb,_#caaaee_29%,_transparent),_transparent_68%),_var(--surface-secondary)]'
    },
    {
      selector: '.dark .home-demo-section',
      utilities:
        '[background:radial-gradient(ellipse_at_8%_0%,_color-mix(in_srgb,_#8d50cf_22%,_transparent),_transparent_68%),_var(--surface-secondary)]'
    },
    { selector: '.home-demo-copy > p', utilities: '[max-width:33rem] [margin-top:1rem] text-muted [line-height:1.65]' },
    { selector: '.home-demo-details', utilities: 'grid [gap:0.65rem] [margin-block:1.35rem] text-foreground [font-size:0.88rem]' },
    { selector: '.home-demo-details li', utilities: 'flex items-center [gap:0.6rem]' },
    { selector: '.home-demo-details svg', utilities: 'shrink-0 text-accent' },
    { selector: '.home-games-section', utilities: '[border-bottom:1px_solid_var(--border)]' },
    {
      selector: '.workbench-frame',
      utilities:
        'overflow-hidden [border:1px_solid_color-mix(in_srgb,_var(--foreground)_14%,_var(--surface))] min-w-0 [border-radius:1.35rem] [background:var(--surface)] text-foreground [box-shadow:0_15px_44px_color-mix(in_srgb,_var(--accent)_14%,_transparent)]'
    },
    {
      selector: '.workbench-title, .workbench-source',
      utilities: 'flex items-center justify-between [gap:0.6rem] [padding:0.85rem_clamp(0.7rem,_2vw,_1rem)]'
    },
    { selector: '.workbench-title', utilities: '[border-bottom:1px_solid_var(--border)]' },
    {
      selector: '.workbench-tabs',
      utilities:
        'grid grid-cols-4 [gap:0.15rem] [padding:0.35rem] [margin:0.7rem_0.7rem_0] [border-radius:0.55rem] [background:var(--surface-secondary)]'
    },
    {
      selector: '.workbench-tab',
      utilities:
        'items-center justify-center [padding:0.45rem_0] [min-height:2.15rem] [border:1px_solid_transparent] [border-radius:0.35rem] [font-size:0.75rem] font-semibold text-muted [transition:color_150ms,_background-color_150ms]'
    },
    { selector: ".workbench-tab:hover, .workbench-tab[aria-pressed='true']", utilities: 'text-accent' },
    {
      selector: ".workbench-tab[aria-pressed='true']",
      utilities: '[border-color:var(--border)] [background:var(--surface)] [box-shadow:0_1px_2px_rgb(16_20_44_/_0.08)]'
    },
    {
      selector: '.workbench-stage',
      utilities: 'relative overflow-hidden [height:11rem] [margin:0.7rem] [border:1px_solid_var(--border)] [border-radius:0.65rem]'
    },
    {
      selector: '.workbench-stage, .workbench-grid',
      utilities: '[background:radial-gradient(circle,_var(--site-grid-line)_1px,_transparent_1px)_center_/_15px_15px,_var(--background)]'
    },
    {
      selector: '.workbench-source',
      utilities:
        '[justify-content:flex-start] [border-top:1px_solid_var(--border)] [background:var(--surface-secondary)] text-foreground [font-size:0.73rem]'
    },
    {
      selector: '.workbench-doc-link',
      utilities: 'flex items-center [gap:0.2rem] shrink-0 ml-auto text-accent [font-size:0.75rem] [font-weight:650]'
    },
    { selector: '.workbench-doc-link:hover', utilities: '[text-decoration:underline]' },
    {
      selector: '.game-spotlight-card',
      utilities:
        'relative flex items-end overflow-hidden [min-height:13.5rem] [aspect-ratio:5_/_4] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink,_var(--accent))_18%,_transparent)] [border-radius:1.3rem] [background:var(--tone-paper,_var(--surface-tertiary))]'
    },
    { selector: '.game-spotlight-card img', utilities: '[height:calc(100%_-_3.7rem)]' },
    {
      selector: '.game-spotlight-label',
      utilities:
        'relative flex items-end justify-between [gap:0.5rem] w-full [padding:0.78rem_0.95rem] [background:color-mix(in_srgb,_var(--surface)_49%,_var(--tone-paper,_var(--surface-secondary)))] text-foreground'
    },
    {
      selector: '.game-spotlight-genre',
      utilities: 'block [color:var(--tone-ink,_var(--accent))] [font-family:var(--font-mono,_monospace)] [font-size:0.68rem] [font-weight:650]'
    },
    {
      selector: '.game-thumbnail',
      utilities: '[background:radial-gradient(ellipse_at_50%_45%,_var(--tone-paper,_var(--surface-secondary)),_var(--surface-secondary))]'
    },
    {
      selector: '.site-page-hero',
      utilities:
        '[border-bottom:1px_solid_var(--border)] [background:radial-gradient(ellipse_at_79%_0%,_var(--tone-paper,_var(--surface-tertiary)),_transparent_72%),_var(--background)]'
    },
    {
      selector: '.site-hero-media',
      utilities:
        'relative [border:1px_solid_var(--border)] [border-radius:1.5rem] [background:color-mix(in_srgb,_var(--tone-paper,_var(--surface-secondary))_48%,_var(--surface))] [box-shadow:0_18px_44px_color-mix(in_srgb,_var(--tone,_var(--accent))_15%,_transparent)]'
    },
    {
      selector: '.site-cta',
      utilities:
        '[padding:clamp(1.5rem,_5vw,_3.5rem)] [border:1px_solid_var(--border)] [border-radius:1.5rem] [background:linear-gradient(125deg,_var(--surface),_var(--surface-tertiary))]'
    },
    {
      selector: '.site-footer',
      utilities:
        '[background:radial-gradient(ellipse_at_6%_6%,_color-mix(in_srgb,_var(--accent)_10%,_transparent),_transparent_66%),_var(--surface-secondary)]'
    },
    { selector: '.site-docs-filter::-webkit-search-cancel-button', utilities: '[appearance:none]' },
    {
      selector: '.site-code-block',
      utilities:
        '[--code-bg:#fff] [--code-fg:#2b1a43] [--code-header:#f2eafb] [--code-muted:#615371] [--code-line:#e1d5ee] [--code-keyword:#6b21a8] [--code-string:#166353] [--code-name:#24449c] [--code-number:#9a4418]'
    },
    {
      selector: ".dark .site-code-block, .site-code-block[data-code-tone='ink']",
      utilities:
        '[--code-bg:#211634] [--code-fg:#f1e9ff] [--code-header:#2b1d43] [--code-muted:#c6b5d9] [--code-line:#493760] [--code-keyword:#eca9ff] [--code-string:#cde98d] [--code-name:#b9bcff] [--code-number:#ffba8a]'
    },
    { selector: '.engine-playground', utilities: '[height:calc(100dvh_-_var(--site-header-height))]' },
    { selector: '.site-code-editor code', utilities: '[font:inherit]' },
    { selector: '.site-code-editor-input::selection', utilities: '[background:color-mix(in_srgb,_var(--accent)_25%,_transparent)] text-transparent' },
    { selector: '.site-code-editor-highlight', utilities: 'invisible', media: '(forced-colors: active)' },
    { selector: '.site-code-editor-input', utilities: '[color:CanvasText] [caret-color:auto]', media: '(forced-colors: active)' },
    { selector: '.site-code-editor-input::selection', utilities: '[background:Highlight] [color:HighlightText]', media: '(forced-colors: active)' },
    { selector: '.code-token-comment', utilities: '[color:var(--code-muted)]' },
    { selector: '.code-token-keyword', utilities: '[color:var(--code-keyword)]' },
    { selector: '.code-token-string', utilities: '[color:var(--code-string)]' },
    { selector: '.code-token-name', utilities: '[color:var(--code-name)]' },
    { selector: '.code-token-number', utilities: '[color:var(--code-number)]' },
    { selector: '.browser-frame-toolbar', utilities: '[background:linear-gradient(180deg,_var(--surface),_var(--surface-secondary))]' },
    { selector: '.browser-frame-dots > span', utilities: '[width:0.55rem] [height:0.55rem] [border-radius:50%] [background:#e96e7b]' },
    { selector: '.browser-frame-dots > span:nth-child(2)', utilities: '[background:#e8aa52]' },
    { selector: '.browser-frame-dots > span:nth-child(3)', utilities: '[background:#55b985]' },
    {
      selector: '.docs-live-preview[data-preview-scrollable] canvas[data-nayan-component-canvas]',
      utilities: '[touch-action:pan-y]!'
    },
    { selector: '.component-host-demo', utilities: 'flex min-w-0 flex-col items-start [gap:0.875rem] [padding:1.25rem] text-foreground' },
    {
      selector: '.component-host-button',
      utilities:
        'inline-flex [min-height:2.75rem] [flex:none] items-center justify-center [gap:0.375rem] [border-radius:0.5rem] [background:var(--accent)] text-accent-foreground [padding:0.5rem_0.875rem] [font-size:0.875rem] font-semibold cursor-pointer'
    },
    { selector: '.component-host-button:hover', utilities: '[background:color-mix(in_srgb,_var(--accent)_86%,_var(--surface))]' },
    { selector: '.component-host-button:focus-visible', utilities: '[outline:2px_solid_var(--accent)] [outline-offset:3px]' },
    {
      selector: '.component-blur-scene',
      utilities:
        'relative grid w-full [min-height:9rem] [place-items:center] overflow-hidden [border-radius:0.75rem] [background:repeating-linear-gradient(135deg,_#432079_0_12px,_#7649c2_12px_24px)]'
    },
    {
      selector: '.component-blur-panel',
      utilities: 'absolute [inset:25%_12%] grid [place-items:center] [border:1px_solid_#ffffff66] [border-radius:0.75rem] [background:#24104455]'
    },
    {
      selector: '.component-animation-block',
      utilities:
        '[border-radius:0.75rem] [border:1px_solid_color-mix(in_srgb,_var(--accent)_22%,_var(--surface))] [background:color-mix(in_srgb,_var(--accent)_12%,_var(--surface))] text-foreground [padding:1.5rem]'
    },
    {
      selector: '.component-media-surface',
      utilities: 'w-full [height:206px] [flex:none] overflow-hidden [border:1px_solid_var(--border)] [border-radius:0.75rem]'
    },
    { selector: '.component-popup-trigger', utilities: 'relative' },
    {
      selector: '.component-popup',
      utilities:
        'absolute [z-index:1] [inset:calc(100%_+_0.5rem)_auto_auto_0] [min-width:max-content] [border:1px_solid_var(--border)] [border-radius:0.65rem] [background:var(--overlay)] [box-shadow:0_6px_18px_color-mix(in_srgb,_var(--foreground)_13%,_transparent)] [padding:0.65rem]'
    },
    {
      selector: '.component-popup-item',
      utilities: 'block w-full [border-radius:0.35rem] [padding:0.25rem_0.5rem] [text-align:start] cursor-pointer'
    },
    {
      selector: '.component-popup-item:hover, .component-popup-item:focus-visible',
      utilities: '[background:color-mix(in_srgb,_var(--accent)_12%,_var(--surface))]'
    },
    {
      selector: '.component-table-wrapper',
      utilities: 'overflow-auto [margin:1.25rem] [border:1px_solid_var(--border)] [border-radius:0.75rem] [background:var(--surface)]'
    },
    { selector: '.component-table', utilities: 'w-full [border-collapse:collapse] [font-size:0.875rem] [line-height:1.4] [text-align:start]' },
    { selector: '.component-table :is(th, td)', utilities: '[padding:0.65rem_0.75rem] [text-align:start]' },
    { selector: '.component-table th, .component-table tr:nth-child(even)', utilities: '[background:var(--surface-secondary)]' },
    {
      selector: '.component-host-input',
      utilities:
        '[min-height:2.75rem] [border:1px_solid_var(--border)] [border-radius:0.5rem] [background:var(--field-background)] [padding:0.45rem_0.75rem]'
    },
    {
      selector: '.component-switch-list',
      utilities: 'grid [margin:1.25rem] overflow-hidden [border:1px_solid_var(--border)] [border-radius:0.85rem] [background:var(--surface)]'
    },
    {
      selector: '.component-switch-row',
      utilities:
        'flex [min-height:3.35rem] items-center justify-between [gap:1rem] [padding:0.7rem_0.875rem] [font-size:0.875rem] font-semibold [text-align:start]'
    },
    { selector: '.component-switch-row + .component-switch-row', utilities: '[border-top:1px_solid_var(--border)]' },
    { selector: '.component-switch-row:hover:not(:disabled)', utilities: '[background:var(--surface-secondary)]' },
    { selector: '.component-switch-row:focus-visible', utilities: '[outline:2px_solid_var(--accent)] [outline-offset:-2px]' },
    { selector: '.component-switch-row:disabled', utilities: 'text-muted' },
    {
      selector: '.component-switch-track',
      utilities:
        'relative [width:2.5rem] [height:1.45rem] [flex:none] [border:1px_solid_var(--border)] [border-radius:999px] [background:var(--default)] [transition:background-color_150ms]'
    },
    {
      selector: '.component-switch-track::after',
      utilities:
        "absolute top-1/2 [inset-inline-start:3px] [width:1rem] [height:1rem] [border-radius:50%] [background:white] [box-shadow:0_1px_3px_color-mix(in_srgb,_var(--foreground)_28%,_transparent)] [content:''] [transform:translateY(-50%)] [transition:inset-inline-start_150ms]"
    },
    {
      selector: ".component-switch-row[aria-checked='true'] .component-switch-track",
      utilities: '[border-color:var(--accent)] [background:var(--accent)]'
    },
    {
      selector: ".component-switch-row[aria-checked='true'] .component-switch-track::after",
      utilities: '[inset-inline-start:calc(100%_-_1rem_-_3px)]'
    },
    { selector: '.component-switch-row:disabled .component-switch-track', utilities: '[opacity:0.55]' },
    {
      selector: '.component-switch-track, .component-switch-track::after',
      utilities: '[transition:none]',
      media: '(prefers-reduced-motion: reduce)'
    },
    { selector: '.component-disclosure-layout', utilities: 'grid [gap:0.75rem] [margin:1.25rem]' },
    { selector: '.component-disclosure-label', utilities: 'text-foreground [font-size:0.875rem] font-semibold' },
    {
      selector: '.component-disclosure-list',
      utilities: 'overflow-hidden [border:1px_solid_var(--border)] [border-radius:0.85rem] [background:var(--surface)]'
    },
    { selector: '.component-disclosure-layout > .component-disclosure-list + .component-disclosure-label', utilities: '[margin-top:0.4rem]' },
    {
      selector: '.component-disclosure + .component-disclosure, .component-radio-option + .component-radio-option',
      utilities: '[border-top:1px_solid_var(--border)]'
    },
    {
      selector: '.component-disclosure-trigger, .component-radio-option',
      utilities: 'flex [min-height:3rem] items-center [gap:0.75rem] [padding:0.65rem_0.875rem] [font-size:0.875rem] font-semibold cursor-pointer'
    },
    { selector: '.component-disclosure-trigger', utilities: 'justify-between [list-style:none]' },
    { selector: '.component-disclosure-trigger::-webkit-details-marker', utilities: 'hidden' },
    { selector: '.component-disclosure-trigger svg', utilities: '[flex:none] text-muted' },
    { selector: '.component-disclosure[open] .component-disclosure-trigger svg', utilities: '[transform:rotate(180deg)] text-accent' },
    {
      selector: '.component-disclosure-trigger:hover, .component-radio-option:hover:has(input:not(:disabled))',
      utilities: '[background:var(--surface-secondary)]'
    },
    {
      selector: '.component-disclosure-trigger:focus-visible, .component-radio-option:has(input:focus-visible)',
      utilities: '[outline:2px_solid_var(--accent)] [outline-offset:-2px]'
    },
    { selector: '.component-disclosure-body', utilities: '[padding:0_0.875rem_0.875rem] text-muted [font-size:0.875rem] [line-height:1.5]' },
    { selector: '.component-radio-group', utilities: 'min-w-0 [margin:1.25rem]' },
    { selector: '.component-radio-group legend', utilities: '[margin-bottom:0.75rem]' },
    { selector: '.component-radio-option input', utilities: '[width:1rem] [height:1rem] [flex:none] [accent-color:var(--accent)]' },
    { selector: '.component-radio-option:has(input:disabled)', utilities: 'text-muted [cursor:default]' },
    {
      selector: '.component-progress-circle',
      utilities:
        'grid [width:5.25rem] [height:5.25rem] [place-items:center] [border-radius:50%] [background:radial-gradient(circle,_var(--background)_60%,_transparent_62%),_conic-gradient(var(--accent)_72%,_var(--default)_0)] font-semibold'
    },
    { selector: '.home-actions', utilities: '[gap:0.45rem]', media: '(max-width: 420px)' },
    { selector: '.home-actions > a', utilities: '[padding-inline:0.9rem]', media: '(max-width: 420px)' },
    { selector: '.home-product-grid', utilities: 'grid-cols-2', media: '(min-width: 480px)' },
    { selector: '.workbench-tabs', utilities: '[margin:0.85rem_1rem_0]', media: '(min-width: 640px)' },
    { selector: '.workbench-stage', utilities: '[height:12rem] [margin:0.85rem_1rem]', media: '(min-width: 640px)' },
    { selector: '.game-spotlight-card', utilities: '[aspect-ratio:1]', media: '(min-width: 640px)' },
    { selector: '.home-hero-layout', utilities: '[grid-template-columns:minmax(0,_0.88fr)_minmax(0,_1.12fr)]', media: '(min-width: 900px)' },
    { selector: '.home-demo-layout', utilities: '[grid-template-columns:minmax(0,_0.8fr)_minmax(0,_1.2fr)]', media: '(min-width: 900px)' },
    { selector: '.home-hero-code', utilities: 'absolute [inset:auto_auto_1rem_1rem] [width:min(74%,_28.5rem)] m-0', media: '(min-width: 900px)' },
    { selector: '.home-product-grid', utilities: '[grid-template-columns:repeat(12,_minmax(0,_1fr))] [gap:1rem]', media: '(min-width: 900px)' },
    { selector: '.home-product', utilities: '[grid-column:span_4] [min-height:12rem]', media: '(min-width: 900px)' },
    { selector: '.home-product:first-child', utilities: '[grid-column:span_6]', media: '(min-width: 900px)' },
    { selector: '.home-product:nth-child(2), .home-product:nth-child(3)', utilities: '[grid-column:span_3]', media: '(min-width: 900px)' },
    {
      selector: '.home-product-arrow, .game-spotlight-card img',
      utilities: '[transform:none]! [transition:none]!',
      media: '(prefers-reduced-motion: reduce)'
    },
    { selector: '.site-desktop-nav', utilities: 'hidden' },
    { selector: '.site-nav-list', utilities: 'flex flex-col [gap:0.25rem]' },
    { selector: '.site-nav-item', utilities: 'w-full' },
    { selector: '.site-nav-link', utilities: '[padding:0.48rem_0.7rem] [border-radius:0.55rem]' },
    { selector: '.site-page-subtitle', utilities: '[color:var(--tone-ink,_var(--accent))]' },
    { selector: '.catalog-controls', utilities: 'flex flex-wrap items-center [gap:0.75rem] [margin-bottom:0.75rem]' },
    {
      selector: '.catalog-search',
      utilities:
        'flex items-center [flex:1_1_13rem] [gap:0.55rem] [max-width:25rem] min-w-0 [padding:0.57rem_0.72rem] [border:1px_solid_var(--border)] [border-radius:0.72rem] [background:var(--surface)] text-accent'
    },
    {
      selector: '.catalog-search:focus-within',
      utilities: '[border-color:var(--focus)] [box-shadow:0_0_0_2px_color-mix(in_srgb,_var(--focus)_24%,_transparent)]'
    },
    { selector: '.catalog-search svg', utilities: 'shrink-0' },
    {
      selector: '.catalog-search input',
      utilities: 'w-full min-w-0 [border:0] [outline:none] [background:transparent] text-foreground [font-size:0.88rem]'
    },
    { selector: '.catalog-search input::placeholder', utilities: 'text-muted' },
    { selector: '.catalog-count', utilities: 'ml-auto text-muted [font-family:var(--font-mono,_monospace)] [font-size:0.75rem]' },
    { selector: '.catalog-empty', utilities: '[padding:1.5rem] [border:1px_dashed_var(--border)] [border-radius:0.8rem] text-muted' },
    {
      selector: '.catalog-entry',
      utilities:
        '[background:linear-gradient(140deg,_color-mix(in_srgb,_var(--tone-paper,_var(--surface-secondary))_34%,_var(--surface)),_var(--surface)_74%)]'
    },
    {
      selector: '.catalog-entry-top',
      utilities: 'flex items-center justify-between [gap:0.55rem] [margin-bottom:0.68rem] [color:var(--tone-ink,_var(--accent))]'
    },
    {
      selector: '.catalog-entry-icon',
      utilities:
        'inline-flex justify-center items-center shrink-0 [width:2.15rem] [height:2.15rem] [border-radius:0.62rem] [background:var(--tone-paper,_var(--surface-secondary))] [color:var(--tone-ink,_var(--accent))]'
    },
    {
      selector: '.reference-api',
      utilities:
        'w-fit max-w-full [margin-bottom:0.75rem] [padding:0.75rem] [border-radius:0.65rem] [background:var(--surface-secondary)] text-muted [font-size:0.83rem]'
    },
    {
      selector: '.site-category-grid',
      utilities: 'grid [grid-template-columns:repeat(auto-fit,_minmax(min(100%,_8.25rem),_1fr))] [gap:0.6rem] [margin-bottom:1.85rem]'
    },
    {
      selector: '.site-category-link',
      utilities:
        'flex items-center [gap:0.48rem] [min-height:2.95rem] [padding:0.55rem_0.65rem] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink)_15%,_transparent)] [border-radius:0.7rem] [background:var(--tone-paper)] [color:var(--tone-ink)] [font-size:0.82rem] [font-weight:680]'
    },
    { selector: '.site-category-link:hover', utilities: '[border-color:var(--tone-ink)]' },
    { selector: '.site-category-link svg', utilities: 'shrink-0' },
    { selector: '.site-category-link svg:last-child', utilities: 'ml-auto' },
    { selector: '.site-desktop-nav', utilities: 'block', media: '(min-width: 1150px)' },
    { selector: '.site-desktop-nav .site-nav-list', utilities: 'flex-row items-center', media: '(min-width: 1150px)' },
    { selector: '.site-desktop-nav .site-nav-item', utilities: 'w-auto', media: '(min-width: 1150px)' },
    { selector: '.site-mobile-toggle', utilities: 'hidden', media: '(min-width: 1150px)' }
  ]
} satisfies EngineStyleRecipes;
