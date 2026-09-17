import { ReactNode } from 'react';
import { Link2 } from 'lucide-react';
import { SCROLL_MT } from '@/design/system';

interface Props {
  title: string;
  children: ReactNode;
  /** Overrides the id derived from the title, where two sections share a name. */
  id?: string;
  /** A sentence between the heading and the content. */
  description?: ReactNode;
  /** Rendered at the end of the heading row — a link out, a count, a format note. */
  action?: ReactNode;
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * A subsection heading inside the docs.
 *
 * Anchored, which it was not before: every Demo, Usage, Attributes and Tags
 * block on the site is now linkable, so an answer to "how do I use this" can
 * point at `/react/select#usage` instead of at the top of the page. The
 * anchor itself only appears on hover or keyboard focus, so it does not
 * clutter the heading it belongs to.
 *
 * The rule that used to sit to the left of the title is gone. It was a
 * blue-to-purple gradient bar on every heading at every level, which gave
 * four equally-weighted sections four identical badges of importance.
 */
const SubHeader = (props: Props) => {
  const id = props.id ?? slug(props.title);

  return (
    <section className={`mb-10 ${SCROLL_MT}`} aria-labelledby={id}>
      <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-default pb-2">
        <h2 id={id} className="group flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          {props.title}
          <a
            href={`#${id}`}
            aria-label={`Link to ${props.title}`}
            className="text-muted opacity-0 transition-opacity hover:text-indigo-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:text-indigo-400">
            <Link2 className="h-3.5 w-3.5" />
          </a>
        </h2>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
      </div>
      {props.description ? <p className="mb-4 text-sm leading-relaxed text-muted">{props.description}</p> : null}
      <div className="leading-relaxed">{props.children}</div>
    </section>
  );
};

export default SubHeader;
