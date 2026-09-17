'use client';

import { ArrowLeft, ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CARD, LEAD } from '@/design/system';
import TagsList from '@/helpers/TagsList';
import { getMenuItem, getSidebarItems } from '@/services/Utils';
import Attributes from './Attributes';
import Code from './Code';
import Sidebar from './Sidebar';
import SubHeader from './SubHeader';

interface Props {
  children: any;
}

const REPO = 'https://github.com/ursnj/nayan-ui/tree/main/packages';

/**
 * The page every component's documentation is rendered into.
 *
 * What changed is the framing rather than the content. The demo used to sit
 * directly on the page background with nothing marking where the example
 * stopped and the page resumed — a Card component demo was indistinguishable
 * from the page's own card. It now has a preview surface of its own, on a
 * dotted ground, so a white component on it is visible as a component.
 *
 * It also gained the two things a reference page of this kind is expected to
 * have and did not: a link to the component's source, and previous/next
 * navigation. Fifty components were reachable only via the sidebar, which
 * meant reading them in order was fifty round trips to the left-hand column.
 */
const ComponentWrapper = (props: Props) => {
  const { children } = props;
  const pathname = usePathname();
  const type = pathname.split('/')[1];
  const component: any = getMenuItem(pathname);

  /*
   * Previous and next among the component pages only. Stepping onto
   * "Installation" or a section heading from the end of the component list
   * would be a jump sideways, not a step along it.
   */
  const components = getSidebarItems(pathname).filter((item: any) => item.isComponent);
  const index = components.findIndex((item: any) => item.link === pathname);
  const previous: any = index > 0 ? components[index - 1] : null;
  const next: any = index >= 0 && index < components.length - 1 ? components[index + 1] : null;

  /** `react-native` maps to the `native` package; `react` to `react`. */
  const sourceUrl = `${REPO}/${type === 'react-native' ? 'native' : 'react'}/src/components`;

  return (
    <Sidebar title={component.title}>
      <p className={`mb-8 max-w-3xl ${LEAD}`}>{component.description}</p>

      <SubHeader title="Demo" description="Rendered live, with the same build of the library you install.">
        {/*
         * A dotted ground, so a component with a white or transparent surface
         * reads as sitting on something rather than dissolving into the page.
         */}
        <div className="rounded-xl border border-default bg-background bg-[radial-gradient(var(--separator)_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="flex flex-wrap items-start gap-4 p-6 sm:p-8">{children}</div>
        </div>
      </SubHeader>

      <SubHeader
        title="Usage"
        action={
          <Link
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground">
            <Github aria-hidden className="h-3.5 w-3.5" />
            Source
          </Link>
        }>
        <Code code={component.code} filename={`${component.title.replace(/\s+/g, '')}.tsx`} />
      </SubHeader>

      <Attributes data={component.attributes} />

      <SubHeader title="Tags" description="Other components solving nearby problems.">
        <TagsList type={type} tags={component.tags} />
      </SubHeader>

      {previous || next ? (
        <nav aria-label="Component navigation" className="mt-12 grid gap-3 border-t border-default pt-6 sm:grid-cols-2">
          {previous ? (
            <Link href={previous.link} className={`${CARD} group flex flex-col p-4 transition-colors hover:border-indigo-500/30`}>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowLeft aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Previous
              </span>
              <span className="mt-1 text-sm font-semibold text-foreground">{previous.title}</span>
            </Link>
          ) : (
            <span aria-hidden />
          )}
          {next ? (
            <Link
              href={next.link}
              className={`${CARD} group flex flex-col items-end p-4 text-right transition-colors hover:border-indigo-500/30 sm:col-start-2`}>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                Next
                <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 text-sm font-semibold text-foreground">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Sidebar>
  );
};

export default ComponentWrapper;
