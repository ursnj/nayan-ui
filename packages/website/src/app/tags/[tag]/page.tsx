import { notFound } from 'next/navigation';
import JsonLd from '@/components/helpers/JsonLd';
import { TagResults } from '@/components/tags/Tags';
import { findReferenceTag, findReferenceTopic, referenceTopics } from '@/services/ui/reference-tags';
import { SITE_URL, buildBreadcrumbSchema, buildCollectionSchema, buildPageMetadata } from '@/services/seo';

type Props = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return referenceTopics.map(({ sku }) => ({ tag: sku }));
}

async function getTag({ params }: Props) {
  const { tag: sku } = await params;
  const topic = findReferenceTopic(sku);
  if (topic) return { ...topic, indexable: true };
  const tag = findReferenceTag(sku) ?? notFound();
  return { ...tag, description: `Browse Nayan UI references tagged with “${tag.text}”.`, guide: undefined, indexable: false };
}

export async function generateMetadata(props: Props) {
  const { sku, text, description, indexable } = await getTag(props);
  return buildPageMetadata({
    title: `${text} · Component and Module Tags`,
    description,
    path: `/tags/${encodeURIComponent(sku)}`,
    bannerFor: '/tags',
    ogType: 'website',
    indexable
  });
}

export default async function TagPage(props: Props) {
  const { sku, text, description, guide, entries } = await getTag(props);
  const path = `/tags/${encodeURIComponent(sku)}`;
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: 'Home', url: SITE_URL },
            { name: 'Tags', url: `${SITE_URL}/tags` },
            { name: text, url: SITE_URL + path }
          ]),
          buildCollectionSchema({ title: text, description, path, entries })
        ]}
      />
      <TagResults title={text} description={description} guide={guide} entries={entries} />
    </>
  );
}
