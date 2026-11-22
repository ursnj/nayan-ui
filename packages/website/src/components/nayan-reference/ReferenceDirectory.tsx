'use client';

import { NView, NText } from 'nayan-ui/components';
import { useState } from 'react';
import Link from 'next/link';
import CatalogSearch from '@/components/helpers/CatalogSearch';
import { ArrowUpRight } from '@/design/Icons';
import { CARD_INTERACTIVE, H3 } from '@/design/system';
import type { ReferencePlatform } from '@/services/nayan-ui/reference-platforms';
import PlatformPills from './PlatformPills';

interface Props {
  kind: 'components' | 'hooks' | 'modules';
  items: { path: string; title: string; description: string; api: string; platforms: readonly ReferencePlatform[] }[];
}

export default function ReferenceDirectory({ kind, items }: Props) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const matches = items.filter(({ title, description, api }) => `${title} ${description} ${api}`.toLowerCase().includes(term));

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
          {matches.map(({ path, title, description, api, platforms }) => (
            <NView tag="li" key={path}>
              <Link href={path} className={`${CARD_INTERACTIVE} flex h-full flex-col p-3`}>
                <NView tag="div" className="mb-3 flex items-start justify-between gap-2">
                  <PlatformPills platforms={platforms} />
                  <ArrowUpRight aria-hidden size={16} className="mt-1 shrink-0 text-accent" />
                </NView>
                <NText tag="span" className={H3}>
                  {title}
                </NText>
                <NText tag="span" className="mt-1 text-sm text-muted">
                  {description}
                </NText>
                <NText tag="code" className="mt-2 break-all text-xs text-accent">
                  {api}
                </NText>
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
