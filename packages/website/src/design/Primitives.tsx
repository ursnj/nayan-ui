import { ReactNode } from "react";
import Link from "next/link";
import { NText, NView } from "@nayan-ui/engine/components";
import {
  ACCENT_SOFT,
  BODY,
  CARD,
  CARD_INTERACTIVE,
  CARD_PAD,
  CONTAINER,
  EYEBROW,
  ACCENT_TEXT,
  H1,
  H2,
  H3,
  HEADER_GAP,
  LEAD,
  PILL,
  SCROLL_MT,
  SECTION_Y,
} from "./system";

interface SectionProps {
  /** Anchor id. Given one, the section also gets scroll offset for the header. */
  id?: string;
  /** Wires the section to its heading for assistive technology. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/** A landing-page section: the standard gutter and the standard vertical rhythm. */
export const Section = ({ id, labelledBy, className = "", children }: SectionProps) => (
  <NView
    tag="section"
    id={id}
    aria-labelledby={labelledBy}
    className={`${CONTAINER} ${SECTION_Y} ${id ? SCROLL_MT : ""} ${className}`}
  >
    {children}
  </NView>
);

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** The `id` the section's `labelledBy` points at. */
  id?: string;
  lead?: ReactNode;
  align?: "center" | "left";
}

export const SectionHeader = ({
  eyebrow,
  title,
  id,
  lead,
  align = "left",
}: SectionHeaderProps) => (
  <NView
    tag="header"
    className={`${HEADER_GAP} ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}
  >
    {eyebrow ? (
      <NText tag="p" className={`mb-3 ${EYEBROW}`}>
        {eyebrow}
      </NText>
    ) : null}
    <NText tag="h2" id={id} className={H2}>
      {title}
    </NText>
    {lead ? (
      <NText tag="p" className={`mt-4 ${LEAD}`}>
        {lead}
      </NText>
    ) : null}
  </NView>
);

interface PageHeroProps {
  tone?: "violet" | "peach" | "pink" | "mint";
  eyebrow?: string;
  title: string;
  /** Supporting line beneath the title. */
  titleAccent?: string;
  lead?: ReactNode;
  /** Buttons. */
  actions?: ReactNode;
  /** Short facts shown as pills under the actions. */
  pills?: string[];
  /** A line of small print under the actions — licence, price, requirements. */
  note?: string;
  /** Breadcrumb trail, innermost last. The final entry is rendered as the current page. */
  breadcrumb?: { label: string; href?: string }[];
  media?: ReactNode;
  children?: ReactNode;
}

export const PageHero = ({
  tone,
  eyebrow,
  title,
  titleAccent,
  lead,
  actions,
  pills,
  note,
  breadcrumb,
  media,
  children,
}: PageHeroProps) => (
  <section className="site-page-hero" data-tone={tone}>
    <div className={`${CONTAINER} py-8 sm:pb-14 sm:pt-9`}>
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
      <div className={media ? "grid min-w-0 items-center gap-8 md:grid-cols-2 lg:gap-14" : ""}>
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? <p className={`mb-3 ${EYEBROW}`}>{eyebrow}</p> : null}
          <h1 className={H1}>{title}</h1>
          {titleAccent ? (
            <p className="site-page-subtitle mt-3 text-lg font-semibold leading-snug tracking-tight sm:text-2xl">
              {titleAccent}
            </p>
          ) : null}
          {lead ? <p className={`mt-4 max-w-xl ${LEAD}`}>{lead}</p> : null}
          {actions ? <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">{actions}</div> : null}
          {pills?.length ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {pills.map((pill) => (
                <li key={pill} className={PILL}>{pill}</li>
              ))}
            </ul>
          ) : null}
          {note ? <p className="mt-4 text-xs text-muted">{note}</p> : null}
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
  <NView tag="div" className="mb-9">
    <NText tag="p" className={`max-w-3xl text-base ${LEAD}`}>
      {lead}
    </NText>
    {actions ? (
      <NView tag="div" className="mt-6 flex flex-wrap gap-3">
        {actions}
      </NView>
    ) : null}
    {facts?.length ? (
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-default pt-5">
        {facts.map((fact) => (
          <NView tag="div" key={fact.label}>
            <dd className="text-xl font-bold text-foreground">{fact.value}</dd>
            <dt className="text-xs text-muted">{fact.label}</dt>
          </NView>
        ))}
      </dl>
    ) : null}
  </NView>
);

/** The trail above a page title. Mirrors the BreadcrumbList in structured data. */
export const Breadcrumb = ({ items }: { items: { label: string; href?: string }[] }) => (
  <nav aria-label="Breadcrumb" className="mb-5 text-xs text-muted sm:mb-6">
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
              <span
                className={last ? "font-medium text-foreground" : ""}
                aria-current={last ? "page" : undefined}
              >
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
  /** Adds hover styles for cards that act as links. */
  interactive?: boolean;
  /** Set false to lay out the padding yourself. */
  padded?: boolean;
  children: ReactNode;
}

export const Card = ({
  className = "",
  interactive = false,
  padded = true,
  children,
}: CardProps) => (
  <NView
    tag="div"
    className={`${interactive ? CARD_INTERACTIVE : CARD} ${padded ? CARD_PAD : ""} ${className}`}
  >
    {children}
  </NView>
);

interface BrowserFrameProps {
  /** Shown in the address bar. A URL reads best; anything short works. */
  label?: string;
  /** Set false to lay out the body padding yourself. */
  padded?: boolean;
  className?: string;
  children: ReactNode;
}

export const BrowserFrame = ({
  label,
  padded = true,
  className = "",
  children,
}: BrowserFrameProps) => (
  <NView tag="div" className={`${CARD} overflow-hidden ${className}`}>
    <NView
      tag="div"
      aria-hidden
      className="flex items-center gap-3 border-b border-default bg-surface px-3 py-2.5"
    >
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
    </NView>

    <NView tag="div" className="bg-surface p-2 sm:p-3">
      <NView
        tag="div"
        className={`min-h-[20rem] overflow-hidden rounded-xl border border-default bg-background ${padded ? "p-6 sm:p-8" : ""}`}
      >
        {children}
      </NView>
    </NView>
  </NView>
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
 * CSS shows the screenshot that matches the root theme class. The hidden
 * image stays out of the accessibility tree.
 *
 * The screen's aspect ratio is the capture's own, 520x1000, so nothing is
 * cropped or stretched: the app's header and its left-hand padding survive,
 * which a phone-shaped 9:19.5 box would have trimmed off the sides.
 */
export const PhoneFrame = ({ light, dark, alt, className = "" }: PhoneFrameProps) => (
  <NView
    tag="div"
    className={`w-[260px] rounded-[2.25rem] border border-default bg-surface p-2.5 shadow-xl shadow-accent/5 ${className}`}
  >
    <NView tag="div" className="overflow-hidden rounded-[1.75rem] border border-default bg-surface">
      <NView
        tag="div"
        className="flex items-center justify-between px-5 py-1.5 text-[10px] font-semibold text-foreground/70"
      >
        <span>9:41</span>
        <NView tag="div" className="flex items-center gap-1">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
            <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
            <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" />
            <rect x="7" y="2" width="2.5" height="8" rx="0.5" />
            <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" />
          </svg>
          <svg width="13" height="10" viewBox="0 0 13 10" fill="currentColor">
            <path d="M6.5 3.2a4.8 4.8 0 0 1 3.4 1.4l1-1a6.2 6.2 0 0 0-8.8 0l1 1a4.8 4.8 0 0 1 3.4-1.4Zm0 2.5c.9 0 1.7.3 2.3.9l1-1a4.6 4.6 0 0 0-6.6 0l1 1c.6-.6 1.4-.9 2.3-.9Zm1.2 1.9a1.7 1.7 0 0 0-2.4 0L6.5 9l1.2-1.4Z" />
          </svg>
          <svg width="22" height="10" viewBox="0 0 22 10" fill="currentColor">
            <rect
              x="0"
              y="1"
              width="18"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            <rect x="18.5" y="3" width="1.5" height="4" rx="0.5" />
            <rect x="1.5" y="2.5" width="12" height="5" rx="0.8" />
          </svg>
        </NView>
      </NView>
      <img
        src={light}
        alt={alt}
        width={520}
        height={1000}
        className="block aspect-[520/1000] w-full dark:hidden"
      />
      <img
        src={dark}
        alt={alt}
        width={520}
        height={1000}
        className="hidden aspect-[520/1000] w-full dark:block"
      />
    </NView>
  </NView>
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

export const FeatureCard = ({
  icon: Icon,
  title,
  body,
  chips,
  className = "",
}: FeatureCardProps) => (
  <NView
    tag="article"
    className={`${CARD} ${CARD_PAD} transition-colors duration-200 hover:border-accent/30 ${className}`}
  >
    {Icon ? (
      <span
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}
      >
        <Icon className="h-5 w-5" />
      </span>
    ) : null}
    <NText tag="h3" className={`mb-2 ${H3}`}>
      {title}
    </NText>
    <NText tag="p" className={BODY}>
      {body}
    </NText>
    {chips?.length ? (
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <li
            key={chip}
            className="rounded-md border border-default bg-background px-2 py-0.5 text-[11px] font-medium text-muted"
          >
            {chip}
          </li>
        ))}
      </ul>
    ) : null}
  </NView>
);

/** A checked list. The accent dot is the only colour, so the text stays readable. */
export const CheckList = ({ items, className = "" }: { items: string[]; className?: string }) => (
  <ul className={`space-y-2 ${className}`}>
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
        <span
          aria-hidden
          className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
        />
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
export const StatGrid = ({ stats, className = "" }: StatGridProps) => (
  <dl
    className={`grid grid-cols-2 gap-3 sm:gap-4 ${stats.length % 3 === 0 ? "md:grid-cols-3" : "md:grid-cols-4"} ${className}`}
  >
    {stats.map((stat) => (
      <NView tag="div" key={stat.label} className={`${CARD} p-4 text-center`}>
        <dt className="sr-only">{stat.label}</dt>
        <dd>
          <span className={`block text-2xl font-bold sm:text-3xl ${ACCENT_TEXT}`}>
            {stat.value}
          </span>
          <span className="mt-1 block text-sm font-semibold text-foreground">{stat.label}</span>
          {stat.detail ? (
            <span className="mt-0.5 block text-xs text-muted">{stat.detail}</span>
          ) : null}
        </dd>
      </NView>
    ))}
  </dl>
);

/** A badge for the top of a hero — one fact, stated small. */
export const Badge = ({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${ACCENT_SOFT}`}
  >
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {children}
  </span>
);

export const FactList = ({
  facts,
  className = "",
}: {
  facts: { label: string; value: string }[];
  className?: string;
}) => (
  <dl className={`${CARD} divide-y divide-default ${className}`}>
    {facts.map((fact) => (
      <NView tag="div" key={fact.label} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
        <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
          {fact.label}
        </dt>
        <dd className="text-sm text-foreground">{fact.value}</dd>
      </NView>
    ))}
  </dl>
);

export const FaqList = ({
  faqs,
  className = "",
}: {
  faqs: { q: string; a: string }[];
  className?: string;
}) => (
  <NView tag="div" className={`mx-auto grid max-w-4xl gap-3 md:grid-cols-2 ${className}`}>
    {faqs.map((faq) => (
      <details key={faq.q} className={`group ${CARD} transition-colors open:border-accent/30`}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <NText tag="h3" className="text-sm font-semibold leading-snug text-foreground">
            {faq.q}
          </NText>
          <span
            aria-hidden
            className="mt-1 h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-muted transition-transform duration-200 group-open:-rotate-[135deg]"
          />
        </summary>
        <NText tag="p" className={`px-5 pb-5 ${BODY}`}>
          {faq.a}
        </NText>
      </details>
    ))}
  </NView>
);

interface CtaPanelProps {
  title: string;
  lead: string;
  children: ReactNode;
}

export const CtaPanel = ({ title, lead, children }: CtaPanelProps) => (
  <div className={`${CONTAINER} pb-12 sm:pb-16`}>
    <section className="site-cta grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <h2 className={H2}>{title}</h2>
        <p className={`mt-3 max-w-xl ${LEAD}`}>{lead}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </section>
  </div>
);
