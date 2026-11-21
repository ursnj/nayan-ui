export const ACCENT_TEXT = 'text-accent';
export const ACCENT_SOFT = 'border-accent/20 bg-accent/8 text-accent';

export const H1 = 'text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.057em]';

export const H2 = 'text-[clamp(2rem,4.4vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.045em]';

export const H3 = 'text-base font-semibold leading-snug tracking-[-0.025em] text-foreground sm:text-lg';

export const EYEBROW = 'font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent';

export const H2_DOC = 'mb-4 mt-10 border-b border-default pb-3 text-xl font-semibold tracking-tight text-foreground';
export const H3_DOC = 'mb-2 mt-6 text-base font-semibold tracking-tight text-foreground';
export const H4_CARD = 'text-sm font-semibold text-foreground';

export const LEAD = 'leading-relaxed text-muted';
export const BODY = 'text-sm leading-relaxed text-muted';

export const CARD = 'rounded-2xl border border-border bg-surface';
export const CARD_INTERACTIVE = `${CARD} transition-[border-color,box-shadow] duration-200 hover:border-accent/40 hover:shadow-md hover:shadow-accent/5`;

export const WELL = 'rounded-xl border border-border bg-background';
export const CARD_PAD = 'p-5 sm:p-6';

export const CONTAINER = 'mx-auto w-full max-w-[82rem] px-5 sm:px-8 lg:px-10';
export const SECTION_Y = 'py-12 sm:py-20';
export const HEADER_GAP = 'mb-7 sm:mb-9';
export const GRID_GAP = 'gap-4 sm:gap-5';
export const SCROLL_MT = 'scroll-mt-5';

const BUTTON_BASE = 'inline-flex min-h-10 items-center justify-center rounded-xl font-semibold transition-colors disabled:opacity-60';

export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-accent gap-2 px-5 py-3 text-sm text-accent-foreground hover:bg-accent/85`;
export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-border bg-surface gap-2 px-5 py-3 text-sm text-foreground hover:border-accent/35 hover:bg-surface-secondary`;
export const BUTTON_SMALL = `${BUTTON_BASE} border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-secondary`;

export const PILL = 'rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground';
export const PILL_INTERACTIVE = `${PILL} transition-colors hover:border-accent/40 hover:text-accent`;
export const KBD = 'rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground';
