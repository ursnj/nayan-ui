import { ReactNode } from 'react';
import Link from 'next/link';
import {
  ACCENT_SOFT,
  BODY,
  CARD,
  CARD_INTERACTIVE,
  CARD_PAD,
  CONTAINER,
  EYEBROW,
  GRADIENT_TEXT,
  H1,
  H2,
  H3,
  HEADER_GAP,
  LEAD,
  SCROLL_MT,
  SECTION_Y
} from './system';

/*
 * The shapes the system is made of.
 *
 * Server components, all of them — nothing here holds state, so pages built
 * from these ship no JavaScript for their layout. A page that needs
 * interactivity marks its own component `'use client'` and still composes
 * these inside it.
 */

/* ------------------------------------------------------------------ *
 * Section scaffolding
 * ------------------------------------------------------------------ */

interface SectionProps {
  /** Anchor id. Given one, the section also gets scroll offset for the header. */
  id?: string;
  /** Wires the section to its heading for assistive technology. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/** A landing-page section: the standard gutter and the standard vertical rhythm. */
export const Section = ({ id, labelledBy, className = '', children }: SectionProps) => (
  <section id={id} aria-labelledby={labelledBy} className={`${CONTAINER} ${SECTION_Y} ${id ? SCROLL_MT : ''} ${className}`}>
    {children}
  </section>
);

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** The `id` the section's `labelledBy` points at. */
  id?: string;
  lead?: ReactNode;
  /** Centred by default; left-aligned where the section is a list rather than a pitch. */
  align?: 'center' | 'left';
}

/**
 * Eyebrow, heading, lead — in that order, at those sizes, everywhere.
 *
 * This is the single most repeated shape on the site, and the one that was
 * most inconsistent before: some sections had a gradient h2 and no lead,
 * others a plain h3 and two paragraphs, and the spacing under each was
 * different again.
 */
export const SectionHeader = ({ eyebrow, title, id, lead, align = 'center' }: SectionHeaderProps) => (
  <header className={`${HEADER_GAP} ${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
    {eyebrow ? <p className={`mb-3 ${EYEBROW}`}>{eyebrow}</p> : null}
    <h2 id={id} className={H2}>
      {title}
    </h2>
    {lead ? <p className={`mt-4 ${LEAD}`}>{lead}</p> : null}
  </header>
);

/* ------------------------------------------------------------------ *
 * Page headers
 * ------------------------------------------------------------------ */

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  /** Rendered in the headline gradient, on its own line. */
  titleAccent?: string;
  lead?: ReactNode;
  /** Buttons. */
  actions?: ReactNode;
  /** A line of small print under the actions — licence, price, requirements. */
  note?: string;
  /** Breadcrumb trail, innermost last. The final entry is rendered as the current page. */
  breadcrumb?: { label: string; href?: string }[];
  /**
   * A screenshot or panel for a second column, as on the home page: pitch on
   * the left, the thing itself on the right. Passing it left-aligns the text,
   * which is what a two-column hero needs — centred text beside an image reads
   * as two unrelated blocks. Omit it and the hero is centred as before.
   */
  media?: ReactNode;
  children?: ReactNode;
}

/**
 * The top of a landing page.
 *
 * One of these on `/games`, `/devtools`, `/contributions` and `/tags` is what
 * makes them look like the same website — each of those had invented its own
 * header, at its own size, with its own gradient.
 */
export const PageHero = ({ eyebrow, title, titleAccent, lead, actions, note, breadcrumb, media, children }: PageHeroProps) => (
  <section className="relative overflow-hidden">
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] to-transparent" />
      <div className="absolute -top-28 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
    </div>

    <div className={`${CONTAINER} pb-10 pt-10 sm:pt-14`}>
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}

      {/*
       * Two shapes from one component. With `media` the hero is the home
       * page's: pitch left, the thing itself right, stacked on a phone and
       * centred there because a lone column of left-aligned text under a
       * breadcrumb looks like it lost its image. Without `media` nothing
       * changes for the pages already using this.
       */}
      <div className={media ? 'grid items-center gap-10 lg:grid-cols-2 lg:gap-14' : ''}>
        <div className={media ? 'text-center lg:text-left' : 'mx-auto max-w-3xl text-center'}>
          {eyebrow ? <p className={`mb-3 ${EYEBROW}`}>{eyebrow}</p> : null}
          <h1 className={H1}>
            {title}
            {titleAccent ? <span className={`mt-1 block ${GRADIENT_TEXT}`}>{titleAccent}</span> : null}
          </h1>
          {lead ? <p className={`mt-5 max-w-2xl text-base ${LEAD} ${media ? 'mx-auto lg:mx-0' : 'mx-auto'}`}>{lead}</p> : null}
          {actions ? (
            <div className={`mt-7 flex flex-col gap-3 sm:flex-row ${media ? 'justify-center lg:justify-start' : 'justify-center'}`}>{actions}</div>
          ) : null}
          {note ? <p className="mt-5 text-xs text-muted">{note}</p> : null}
        </div>

        {media}
      </div>

      {children}
    </div>
  </section>
);

interface DocsIntroProps {
  /** The one-paragraph summary under the page title. */
  lead: ReactNode;
  /** Buttons — npm, source, a link to the running thing. */
  actions?: ReactNode;
  /** A short fact strip: counts, licence, platform support. */
  facts?: { value: string; label: string }[];
}

/**
 * The opening of a page rendered inside the docs shell.
 *
 * `PageHero` cannot be used there — `Sidebar` already supplies the container,
 * the breadcrumb and the `h1`, so a second hero would nest one page header
 * inside another. This is the flat equivalent: the same order of information,
 * no duplicate chrome.
 *
 * It replaces the tinted, blurred, gradient-bordered panel that `/games`,
 * `/devtools` and `/contributions` had each built separately, at three
 * different sizes, in three different colour families, below a title the
 * shell had already printed.
 */
export const DocsIntro = ({ lead, actions, facts }: DocsIntroProps) => (
  <div className="mb-10">
    <p className={`max-w-3xl text-base ${LEAD}`}>{lead}</p>
    {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    {facts?.length ? (
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-default pt-5">
        {facts.map(fact => (
          <div key={fact.label}>
            <dd className="text-xl font-bold text-foreground">{fact.value}</dd>
            <dt className="text-xs text-muted">{fact.label}</dt>
          </div>
        ))}
      </dl>
    ) : null}
  </div>
);

/** The trail above a page title. Mirrors the BreadcrumbList in structured data. */
export const Breadcrumb = ({ items }: { items: { label: string; href?: string }[] }) => (
  <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted">
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <li key={item.label} className="flex items-center gap-2">
            {item.href && !last ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'font-medium text-foreground' : ''} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {last ? null : <span aria-hidden>/</span>}
          </li>
        );
      })}
    </ol>
  </nav>
);

/* ------------------------------------------------------------------ *
 * Content shapes
 * ------------------------------------------------------------------ */

interface CardProps {
  className?: string;
  /** Adds hover lift and an accent border. For cards that are links. */
  interactive?: boolean;
  /** Set false to lay out the padding yourself. */
  padded?: boolean;
  children: ReactNode;
}

export const Card = ({ className = '', interactive = false, padded = true, children }: CardProps) => (
  <div className={`${interactive ? CARD_INTERACTIVE : CARD} ${padded ? CARD_PAD : ''} ${className}`}>{children}</div>
);

interface BrowserFrameProps {
  /** Shown in the address bar. A URL reads best; anything short works. */
  label?: string;
  /** Set false to lay out the body padding yourself. */
  padded?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A browser window around a live example.
 *
 * Demos used to sit in a plain bordered box, which left every component page
 * with the same question: is this thing part of the page, or is it the example?
 * A window answers it before the text does — the chrome says "this is an
 * application, shown to you" and the grey body gives the components something
 * to sit on. Most of them are white or near-white, and on the page's own
 * surface their edges disappeared.
 *
 * The traffic lights are `bg-default` rather than red/amber/green on purpose.
 * They are decoration, and the site spends colour on state — an active link, a
 * focus ring, a danger badge — so three coloured dots at the top of fifty
 * pages would be the loudest thing on any of them. As grey circles they still
 * read as a window instantly.
 *
 * `aria-hidden` on the whole bar: it is a picture of a browser, not a browser.
 * A screen reader gaining three unnamed dots and a fake URL would be worse off
 * than one that skips straight to the demo.
 */
export const BrowserFrame = ({ label, padded = true, className = '', children }: BrowserFrameProps) => (
  <div className={`${CARD} overflow-hidden ${className}`}>
    <div aria-hidden className="flex items-center gap-3 border-b border-default bg-surface px-3 py-2.5">
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-default" />
        <span className="h-2.5 w-2.5 rounded-full bg-default" />
        <span className="h-2.5 w-2.5 rounded-full bg-default" />
      </span>
      {label ? (
        <span className="min-w-0 flex-1 truncate rounded-md border border-default bg-background px-2.5 py-1 text-center font-mono text-[11px] text-muted">
          {label}
        </span>
      ) : null}
    </div>

    {/*
     * The window's surface, as a white margin around the viewport, and the grey
     * screen inset within it. Two jobs at once: the demo keeps the grey ground
     * that makes a white component visible, and the window keeps an edge of its
     * own — before this, the body ran to the window's border and, since both the
     * body and the page are `--background`, the whole thing read as a region of
     * the page with a title bar stuck on top.
     *
     * Inside rather than around it, so the frame belongs to the window instead
     * of being a bezel the page has to make room for.
     */}
    <div className="bg-surface p-2 sm:p-3">
      <div className={`overflow-hidden rounded-xl border border-default bg-background ${padded ? 'p-6 sm:p-8' : ''}`}>{children}</div>
    </div>
  </div>
);

interface FeatureCardProps {
  /** A lucide icon component. */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  /** Short labels under the body — a capability list without the bullets. */
  chips?: string[];
  className?: string;
}

/**
 * The card used for every feature grid on the site.
 *
 * The icon sits in a tinted square rather than its own gradient tile: nine
 * differently-gradiented tiles in a row is what made the old grids read as
 * decoration instead of information.
 */
export const FeatureCard = ({ icon: Icon, title, body, chips, className = '' }: FeatureCardProps) => (
  <article className={`${CARD} ${CARD_PAD} transition-colors duration-200 hover:border-indigo-500/30 ${className}`}>
    {Icon ? (
      <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}>
        <Icon className="h-5 w-5" />
      </span>
    ) : null}
    <h3 className={`mb-2 ${H3}`}>{title}</h3>
    <p className={BODY}>{body}</p>
    {chips?.length ? (
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {chips.map(chip => (
          <li key={chip} className="rounded-md border border-default bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
            {chip}
          </li>
        ))}
      </ul>
    ) : null}
  </article>
);

/** A checked list. The accent dot is the only colour, so the text stays readable. */
export const CheckList = ({ items, className = '' }: { items: string[]; className?: string }) => (
  <ul className={`space-y-2 ${className}`}>
    {items.map(item => (
      <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
        <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

interface StatGridProps {
  stats: { value: string; label: string; detail?: string }[];
  className?: string;
}

/** Numbers, as a definition list — the label defines the value it sits under. */
export const StatGrid = ({ stats, className = '' }: StatGridProps) => (
  <dl className={`grid grid-cols-2 gap-3 sm:gap-4 ${stats.length % 3 === 0 ? 'md:grid-cols-3' : 'md:grid-cols-4'} ${className}`}>
    {stats.map(stat => (
      <div key={stat.label} className={`${CARD} p-4 text-center`}>
        <dt className="sr-only">{stat.label}</dt>
        <dd>
          <span className={`block text-2xl font-bold sm:text-3xl ${GRADIENT_TEXT}`}>{stat.value}</span>
          <span className="mt-1 block text-sm font-semibold text-foreground">{stat.label}</span>
          {stat.detail ? <span className="mt-0.5 block text-xs text-muted">{stat.detail}</span> : null}
        </dd>
      </div>
    ))}
  </dl>
);

/** A badge for the top of a hero — one fact, stated small. */
export const Badge = ({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${ACCENT_SOFT}`}>
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {children}
  </span>
);

/**
 * A key/value strip — the compact alternative to a grid of stat cards.
 *
 * Used where the facts support the copy rather than being the point of it:
 * formats a page accepts, the browser it needs, what a licence is.
 */
export const FactList = ({ facts, className = '' }: { facts: { label: string; value: string }[]; className?: string }) => (
  <dl className={`${CARD} divide-y divide-default ${className}`}>
    {facts.map(fact => (
      <div key={fact.label} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
        <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">{fact.label}</dt>
        <dd className="text-sm text-foreground">{fact.value}</dd>
      </div>
    ))}
  </dl>
);

/**
 * A FAQ, as native `<details>` elements.
 *
 * No JavaScript to open, and every answer sits in the delivered HTML whether
 * or not it is expanded — which is what the `FAQPage` structured data claims,
 * and what a crawler that does not run scripts will see.
 */
export const FaqList = ({ faqs, className = '' }: { faqs: { q: string; a: string }[]; className?: string }) => (
  <div className={`mx-auto grid max-w-4xl gap-3 md:grid-cols-2 ${className}`}>
    {faqs.map(faq => (
      <details key={faq.q} className={`group ${CARD} transition-colors open:border-indigo-500/30`}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <h3 className="text-sm font-semibold leading-snug text-foreground">{faq.q}</h3>
          <span
            aria-hidden
            className="mt-1 h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-muted transition-transform duration-200 group-open:-rotate-[135deg]"
          />
        </summary>
        <p className={`px-5 pb-5 ${BODY}`}>{faq.a}</p>
      </details>
    ))}
  </div>
);

interface CtaPanelProps {
  title: string;
  lead: string;
  children: ReactNode;
}

/**
 * The closing panel, and the only full-bleed gradient a page is allowed.
 *
 * Shared rather than rebuilt per page: the home page and the video editor
 * each had their own, at different radii, with different glow placement and
 * different padding, which is exactly the kind of near-miss that makes a site
 * feel assembled from parts.
 */
export const CtaPanel = ({ title, lead, children }: CtaPanelProps) => (
  <div className={`${CONTAINER} pb-16`}>
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-fuchsia-600/15" />
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative px-6 py-14 text-center sm:px-10 sm:py-16">
        <h2 className={H2}>
          <span className={GRADIENT_TEXT}>{title}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">{lead}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
      </div>
    </div>
  </div>
);
