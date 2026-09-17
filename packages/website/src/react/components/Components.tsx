'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocsIntro } from '@/design/Primitives';
import { CARD_INTERACTIVE, H4_CARD } from '@/design/system';
import Sidebar from '@/helpers/Sidebar';
import { getMenuItem, getSidebarItems } from '@/services/Utils';

/**
 * The component index.
 *
 * Each card showed six clamped lines of the component's full description,
 * which made a four-column grid of twelve-line cards and put the component
 * names — the only thing anyone scans this page for — a long way apart. Two
 * lines is enough to tell two components apart; the rest is on the page the
 * card links to.
 */
const Components = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname) || getMenuItem(pathname + '/components');
  const items = getSidebarItems(pathname).filter((item: any) => item.isComponent);

  return (
    <Sidebar title={component?.title || 'Components'}>
      <DocsIntro lead={component?.description} facts={[{ value: String(items.length), label: 'Components, each with a live demo and prop table' }]} />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: any) => {
          const Icon = item.icon;
          return (
            <li key={item.link}>
              <Link href={item.link} className={`${CARD_INTERACTIVE} group flex h-full flex-col p-4`}>
                <span className="mb-1.5 flex items-center gap-2.5">
                  {Icon ? <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" /> : null}
                  <span className={H4_CARD}>{item.title}</span>
                  <ArrowRight aria-hidden className="ml-auto h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="line-clamp-2 text-sm leading-relaxed text-muted">{item.description}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Sidebar>
  );
};

export default Components;
