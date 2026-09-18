'use client';

import { ArrowLeft, ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrowserFrame } from '@/design/Primitives';
import { CARD, LEAD } from '@/design/system';
import TagsList from '@/helpers/TagsList';
import { getMenuItem, getSidebarItems } from '@/services/Utils';
import { SITE_HOST } from '@/services/seo';
import Attributes from './Attributes';
import Code from './Code';
import Sidebar from './Sidebar';
import SubHeader from './SubHeader';

interface Props {
  children: any;
}

const REPO = 'https://github.com/ursnj/nayan-ui/tree/main/packages';

const ComponentWrapper = (props: Props) => {
  const { children } = props;
  const pathname = usePathname();
  const type = pathname.split('/')[1];
  const component: any = getMenuItem(pathname);

  const components = getSidebarItems(pathname).filter((item: any) => item.isComponent);
  const index = components.findIndex((item: any) => item.link === pathname);
  const previous: any = index > 0 ? components[index - 1] : null;
  const next: any = index >= 0 && index < components.length - 1 ? components[index + 1] : null;

  /** `react-native` maps to the `native` package; `react` to `react`. */
  const sourceUrl = `${REPO}/${type === 'react-native' ? 'native' : 'react'}/src/components`;

  return (
    <Sidebar title={component.title}>
      <p className={`mb-8 max-w-3xl ${LEAD}`}>{component.description}</p>

      <SubHeader
        title="Demo"
        description={
          type === 'react-native'
            ? 'React Native components render to native views, so the example below describes the component rather than running it.'
            : 'Rendered live, with the same build of the library you install.'
        }>
        <BrowserFrame label={`${SITE_HOST}${pathname}`} padded={false}>
          <div className="space-y-4 p-6 [&>*]:max-w-full sm:p-8">{children}</div>
        </BrowserFrame>
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

      {(component.extraAttributes ?? []).map((table: any) => (
        <Attributes key={table.title} title={table.title} data={table.data} />
      ))}

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
