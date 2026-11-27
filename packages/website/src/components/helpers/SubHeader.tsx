import { NView, NText } from 'nayan-ui/components';
import { ReactNode } from "react";
import { Link2 } from "@/design/Icons";
import { SCROLL_MT } from "@/design/system";

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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const SubHeader = (props: Props) => {
  const id = props.id ?? slug(props.title);

  return (
    <NView tag="section" className={`mb-3 grid grid-cols-1 gap-3 ${SCROLL_MT}`} aria-labelledby={id}>
      <NView tag="div" className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <NText tag="h2"
          id={id}
          className="group flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
        >
          {props.title}
          <NView tag="a"
            href={`#${id}`}
            aria-label={`Link to ${props.title}`}
            className="text-muted transition-colors hover:text-accent sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
          >
            <Link2 className="h-3.5 w-3.5" />
          </NView>
        </NText>
        {props.action ? <NView tag="div" className="shrink-0">{props.action}</NView> : null}
      </NView>
      {props.description ? (
        <NText tag="p" className="max-w-3xl text-sm leading-relaxed text-muted">{props.description}</NText>
      ) : null}
      <NView tag="div" className="leading-relaxed">{props.children}</NView>
    </NView>
  );
};

export default SubHeader;
