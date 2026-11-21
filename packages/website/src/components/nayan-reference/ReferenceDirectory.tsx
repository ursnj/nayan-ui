'use client';

import { NView, NText } from 'nayan-ui/components';
import { useState } from 'react';
import Link from 'next/link';
import CatalogSearch from '@/components/helpers/CatalogSearch';
import { ArrowUpRight, Boxes, Code2 } from '@/design/Icons';
import { CARD_INTERACTIVE, H3 } from '@/design/system';

interface Props {
  kind: 'components' | 'modules';
  items: { path: string; title: string; description: string; api: string }[];
}

export default function ReferenceDirectory({ kind, items }: Props) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const matches = items.filter(({ title, description, api }) => `${title} ${description} ${api}`.toLowerCase().includes(term));
  const Icon = kind === 'components' ? Code2 : Boxes;

  return (
    <>
      <NView tag="div" className="catalog-controls">
        <CatalogSearch label={`Search ${kind}`} value={query} onChange={setQuery} />
        <NText tag="p" className="catalog-count" aria-live="polite">
          {matches.length} {matches.length === 1 ? 'result' : 'results'}
        </NText>
      </NView>
      {matches.length ? (
        <NView tag="ul" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map(({ path, title, description, api }) => (
            <NView tag="li" key={path}>
              <Link
                href={path}
                data-tone={kind === 'components' ? 'violet' : 'peach'}
                className={`${CARD_INTERACTIVE} catalog-entry flex h-full flex-col p-3`}
              >
                <NText tag="span" className="catalog-entry-top">
                  <NText tag="span" className="catalog-entry-icon">
                    <Icon aria-hidden size={18} />
                  </NText>
                  <ArrowUpRight aria-hidden size={16} />
                </NText>
                <NText tag="span" className={H3}>{title}</NText>
                <NText tag="code" className="mt-1 text-xs break-all text-accent">{api}</NText>
                <NText tag="span" className="mt-2 text-sm text-muted">{description}</NText>
              </Link>
            </NView>
          ))}
        </NView>
      ) : (
        <NText tag="p" className="catalog-empty">No results for “{query.trim()}”.</NText>
      )}
    </>
  );
}
