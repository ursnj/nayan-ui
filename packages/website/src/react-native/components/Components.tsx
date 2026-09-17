'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DocsIntro } from '@/design/Primitives';
import { CARD_INTERACTIVE, H4_CARD } from '@/design/system';
import Sidebar from '@/helpers/Sidebar';
import { reactNativeSidebarItems } from '@/services/Utils';

/**
 * The React Native component index.
 *
 * Deliberately identical in shape to the React one — same card, same clamp,
 * same grid. The two indexes previously differed in how they sourced their
 * title and description but rendered the same markup, which meant any change
 * to one silently left the other behind.
 */
const Components = () => {
  const items = reactNativeSidebarItems.filter((item: any) => item.isComponent);

  return (
    <Sidebar title="React Native Components">
      <DocsIntro
        lead="Components for iOS and Android, built on HeroUI Native. The same prop names and the same theme tokens as the React package, rendered natively."
        facts={[{ value: String(items.length), label: 'Components, each with a live demo and prop table' }]}
      />

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
