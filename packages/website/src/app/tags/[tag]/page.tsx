import { notFound } from 'next/navigation';
import JsonLd from '@/components/helpers/JsonLd';
import { TagResults } from '@/components/tags/Tags';
import { findReferenceTag } from '@/services/engine/reference-tags';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

type Props = { params: Promise<{ tag: string }> };

async function getTag({ params }: Props) {
  return findReferenceTag((await params).tag) ?? notFound();
}

export async function generateMetadata(props: Props) {
  const { sku, text, entries } = await getTag(props);
  return buildPageMetadata({
    title: `${text} · Component and Module Tags`,
    description: `Browse Nayan UI components and engine modules tagged with “${text}”.`,
    path: `/tags/${sku}`,
    bannerFor: entries.length === 1 ? entries[0].path : '/tags',
    keywords: `${text}, Nayan UI, React components, React Native components, engine modules`
  });
}

export default async function TagPage(props: Props) {
  const { sku, text, entries } = await getTag(props);
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Tags', url: `${SITE_URL}/tags` },
          { name: text, url: `${SITE_URL}/tags/${sku}` }
        ])}
      />
      <TagResults title={text} entries={entries} />
    </>
  );
}
