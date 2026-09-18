

/** The one accent, for text. */
export const ACCENT_TEXT = 'text-indigo-600 dark:text-indigo-400';

/** Accent on a tinted ground — badges, active chips, numbered markers. */
export const ACCENT_SOFT = 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300';

/** The headline gradient. Hero headlines and primary buttons only. */
export const GRADIENT_TEXT = 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent';

/** The primary button's fill, matching the headline gradient. */
export const GRADIENT_FILL = 'bg-gradient-to-r from-indigo-500 to-violet-500';

/** Page title. One per page. */
export const H1 = 'text-3xl font-bold tracking-tight sm:text-4xl';

/** Marketing page title, where the page is the pitch. */
export const H1_HERO = 'text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl';

/** Section heading. */
export const H2 = 'text-2xl font-bold tracking-tight sm:text-3xl';

/** Card and subsection heading. */
export const H3 = 'text-base font-semibold text-foreground sm:text-lg';

/** The small capitalised label above a section heading. */
export const EYEBROW = `text-xs font-semibold uppercase tracking-[0.2em] ${ACCENT_TEXT}`;

export const H2_DOC = 'mb-4 mt-10 border-b border-default pb-2 text-sm font-semibold uppercase tracking-wider text-muted';

export const H3_DOC = 'mb-2 mt-6 text-sm font-semibold text-foreground';

export const H4_CARD = 'text-sm font-semibold text-foreground';

/** The sentence under a heading. Never more than a couple of lines. */
export const LEAD = 'text-muted leading-relaxed';

/** Body copy inside a card. */
export const BODY = 'text-sm leading-relaxed text-muted';

/** A panel. The site's default container for anything that is not prose. */
export const CARD = 'rounded-2xl border border-default bg-surface';

/** A panel that responds to the pointer, for cards that are links. */
export const CARD_INTERACTIVE = `${CARD} transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-lg`;

/** A well — a recessed area inside a card, for code, previews and examples. */
export const WELL = 'rounded-xl border border-default bg-background';

/** Standard padding for a card. */
export const CARD_PAD = 'p-5 sm:p-6';

/** The page gutter. Identical on every page, including the docs. */
export const CONTAINER = 'container mx-auto px-4 sm:px-6 lg:px-8';

/** Vertical space between landing-page sections. */
export const SECTION_Y = 'py-12 sm:py-16';

/** Space under a section header, before its content. */
export const HEADER_GAP = 'mb-8 sm:mb-10';

/** The grid gap used site-wide, so cards line up across sections. */
export const GRID_GAP = 'gap-4 sm:gap-5';

export const SCROLL_MT = 'scroll-mt-24';

const BUTTON_BASE = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-60';

/** The one primary action on a page. */
export const BUTTON_PRIMARY = `${BUTTON_BASE} ${GRADIENT_FILL} px-6 py-3 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600`;

/** Everything alongside a primary action. */
export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-default bg-surface/70 px-6 py-3 text-foreground backdrop-blur hover:bg-default/50`;

/** Compact variant, for headers and toolbars. */
export const BUTTON_SMALL = `${BUTTON_BASE} border border-default bg-surface px-3 py-1.5 text-sm hover:bg-default/50`;

/** A neutral, non-interactive label. Tags, formats, counts. */
export const PILL = 'rounded-lg border border-default bg-background px-2.5 py-1 text-xs font-medium text-foreground';

/** A pill that links somewhere. */
export const PILL_INTERACTIVE = `${PILL} transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400`;

/** Inline keyboard key. */
export const KBD = 'rounded-md border border-default bg-background px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground';
