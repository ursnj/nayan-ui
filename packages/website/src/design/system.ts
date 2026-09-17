/*
 * The design system, as one file of class strings.
 *
 * Every surface, heading and accent on the site resolves to something in here.
 * The point is not to abstract Tailwind away — it is that before this existed,
 * a card was `rounded-xl border-default p-6` on one page and `rounded-lg
 * shadow-lg p-4` on the next, and a heading was blue on the home page, purple
 * in the sidebar and pink in the footer. There was no pattern to follow, so
 * nobody followed one.
 *
 * The rules, in short:
 *
 *   One accent. Indigo carries state — active nav, focus, links, the dot on a
 *   list item. Colour means something, so it is not spent on decoration.
 *
 *   Gradient is a headline treatment, not a theme. It appears on hero
 *   headlines and primary buttons and nowhere else. It used to be on every
 *   h1, h2, icon tile, footer column and border on the site, which is why
 *   none of them read as more important than any other.
 *
 *   Hairline borders over shadows. `border-default` on `bg-surface` separates
 *   panels; shadow is reserved for things that genuinely float (the header,
 *   a hovered card lifting).
 *
 *   Text has three levels and no more: `text-foreground` for content,
 *   `text-muted` for supporting copy, and the accent for state.
 *
 * Tokens come from `globals.css` (`--surface`, `--muted`, `--default`…) so all
 * of this themes light and dark without a single `dark:` variant for surfaces.
 * The `dark:` variants that remain are on Tailwind's own palette, which has no
 * theme awareness of its own.
 */

/* ------------------------------------------------------------------ *
 * Accent
 * ------------------------------------------------------------------ */

/** The one accent, for text. */
export const ACCENT_TEXT = 'text-indigo-600 dark:text-indigo-400';

/** Accent on a tinted ground — badges, active chips, numbered markers. */
export const ACCENT_SOFT = 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300';

/** The headline gradient. Hero headlines and primary buttons only. */
export const GRADIENT_TEXT = 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent';

/** The primary button's fill, matching the headline gradient. */
export const GRADIENT_FILL = 'bg-gradient-to-r from-indigo-500 to-violet-500';

/* ------------------------------------------------------------------ *
 * Type scale
 * ------------------------------------------------------------------ */

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

/**
 * Headings *inside* documentation prose, matching what `SubHeader` renders.
 *
 * These exist because the games and devtools sub-pages write their section
 * headings inline rather than through `SubHeader`, and between ten of those
 * files there were six different `h2` styles and three different `h3`s —
 * `text-xl mb-5`, `text-xl mb-5 mt-8`, `text-xl font-bold text-foreground
 * mb-4`, `text-2xl font-bold mb-6 flex items-center`, and so on. Restructuring
 * every one of them into `SubHeader` would mean re-nesting their JSX; pointing
 * them all at one class string gets the same result.
 */
export const H2_DOC = 'mb-4 mt-10 border-b border-default pb-2 text-sm font-semibold uppercase tracking-wider text-muted';

export const H3_DOC = 'mb-2 mt-6 text-sm font-semibold text-foreground';

/** The title on a card — smaller than a section heading, because it is one of many. */
export const H4_CARD = 'text-sm font-semibold text-foreground';

/** The sentence under a heading. Never more than a couple of lines. */
export const LEAD = 'text-muted leading-relaxed';

/** Body copy inside a card. */
export const BODY = 'text-sm leading-relaxed text-muted';

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/** A panel. The site's default container for anything that is not prose. */
export const CARD = 'rounded-2xl border border-default bg-surface';

/** A panel that responds to the pointer, for cards that are links. */
export const CARD_INTERACTIVE = `${CARD} transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-lg`;

/** A well — a recessed area inside a card, for code, previews and examples. */
export const WELL = 'rounded-xl border border-default bg-background';

/** Standard padding for a card. */
export const CARD_PAD = 'p-5 sm:p-6';

/* ------------------------------------------------------------------ *
 * Rhythm
 * ------------------------------------------------------------------ */

/** The page gutter. Identical on every page, including the docs. */
export const CONTAINER = 'container mx-auto px-4 sm:px-6 lg:px-8';

/** Vertical space between landing-page sections. */
export const SECTION_Y = 'py-12 sm:py-16';

/** Space under a section header, before its content. */
export const HEADER_GAP = 'mb-8 sm:mb-10';

/** The grid gap used site-wide, so cards line up across sections. */
export const GRID_GAP = 'gap-4 sm:gap-5';

/**
 * Clears the fixed site header when an anchor is targeted. The header is
 * 60px; a little more than that keeps the heading off the glass edge.
 */
export const SCROLL_MT = 'scroll-mt-24';

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

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
