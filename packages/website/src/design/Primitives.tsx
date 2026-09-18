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
  align?: 'center' | 'left';
}

export const SectionHeader = ({ eyebrow, title, id, lead, align = 'center' }: SectionHeaderProps) => (
  <header className={`${HEADER_GAP} ${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
    {eyebrow ? <p className={`mb-3 ${EYEBROW}`}>{eyebrow}</p> : null}
    <h2 id={id} className={H2}>
      {title}
    </h2>
    {lead ? <p className={`mt-4 ${LEAD}`}>{lead}</p> : null}
  </header>
);

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
  media?: ReactNode;
  children?: ReactNode;
}

export const PageHero = ({ eyebrow, title, titleAccent, lead, actions, note, breadcrumb, media, children }: PageHeroProps) => (
  <section className="relative overflow-hidden">
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] to-transparent" />
      <div className="absolute -top-28 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
    </div>

    <div className={`${CONTAINER} pb-10 pt-10 sm:pt-14`}>
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}

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

    <div className="bg-surface p-2 sm:p-3">
      <div className={`min-h-[20rem] overflow-hidden rounded-xl border border-default bg-background ${padded ? 'p-6 sm:p-8' : ''}`}>{children}</div>
    </div>
  </div>
);

interface PhoneFrameProps {
  /** Screenshot shown in the light theme. */
  light: string;
  /** Screenshot shown in the dark theme. */
  dark: string;
  alt: string;
  className?: string;
}

/**
 * A phone around a screenshot, for components that cannot run in a browser.
 *
 * The two images are swapped by CSS rather than JavaScript, the same way the
 * video editor's hero works: HeroUI defines Tailwind's `dark:` variant against
 * the class `NTheme` puts on `<html>`, so the screenshot follows the site's
 * theme with no client component and no flash of the wrong one. Only the
 * matching image is displayed, and `display: none` keeps the other out of the
 * accessibility tree, so a screen reader is read one description.
 *
 * The screen's aspect ratio is the capture's own, 520x1000, so nothing is
 * cropped or stretched: the app's header and its left-hand padding survive,
 * which a phone-shaped 9:19.5 box would have trimmed off the sides.
 */
export const PhoneFrame = ({ light, dark, alt, className = '' }: PhoneFrameProps) => (
  <div className={`mx-auto w-[260px] rounded-[2.25rem] border border-default bg-surface p-2.5 shadow-xl shadow-indigo-500/5 ${className}`}>
    <div className="overflow-hidden rounded-[1.75rem] border border-default bg-background">
      <img src={light} alt={alt} width={520} height={1000} className="block aspect-[520/1000] w-full dark:hidden" />
      <img src={dark} alt={alt} width={520} height={1000} className="hidden aspect-[520/1000] w-full dark:block" />
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
