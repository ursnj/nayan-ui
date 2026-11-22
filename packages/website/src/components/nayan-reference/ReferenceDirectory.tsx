'use client';

import { NView, NText } from 'nayan-ui/components';
import { useState } from 'react';
import Link from 'next/link';
import CatalogSearch from '@/components/helpers/CatalogSearch';
import { ArrowUpRight, Boxes, Code2 } from '@/design/Icons';
import { CARD_INTERACTIVE, H3 } from '@/design/system';

interface Props {
  kind: 'components' | 'hooks' | 'modules';
  items: { path: string; title: string; description: string; api: string }[];
}

export default function ReferenceDirectory({ kind, items }: Props) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const matches = items.filter(({ title, description, api }) => `${title} ${description} ${api}`.toLowerCase().includes(term));
  const Icon = kind === 'modules' ? Boxes : Code2;

  return (
    <>
      <NView tag="div" className="catalog-controls flex flex-wrap items-center [gap:0.75rem] [margin-bottom:0.75rem]">
        <CatalogSearch label={`Search ${kind}`} value={query} onChange={setQuery} />
        <NText tag="p" className="catalog-count ml-auto text-muted [font-family:var(--font-mono,_monospace)] [font-size:0.75rem]" aria-live="polite">
          {matches.length} {matches.length === 1 ? 'result' : 'results'}
        </NText>
      </NView>
      {matches.length ? (
        <NView tag="ul" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map(({ path, title, description, api }) => (
            <NView tag="li" key={path}>
              <Link
                href={path}
                className={`${CARD_INTERACTIVE} flex h-full flex-col p-3`}
              >
                <NText tag="span" className="catalog-entry-top flex items-center justify-between [gap:0.55rem] [margin-bottom:0.68rem] [color:var(--tone-ink,_var(--accent))]">
                  <NText tag="span" className="catalog-entry-icon inline-flex justify-center items-center shrink-0 [width:2.15rem] [height:2.15rem] [border-radius:0.62rem] [background:var(--tone-paper,_var(--surface-secondary))] [color:var(--tone-ink,_var(--accent))]">
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
        <NText tag="p" className="catalog-empty [padding:1.5rem] [border:1px_dashed_var(--border)] [border-radius:0.8rem] text-muted">No results for “{query.trim()}”.</NText>
      )}
    </>
  );
}
