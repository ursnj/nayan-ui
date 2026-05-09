import type { Metadata } from 'next';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import TagDetails from '@/tags/TagsDetails';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const title = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return buildPageMetadata({
    title: `${title} - React Component Tag`,
    description: `Browse Nayan UI React components tagged with "${title}". Find related components, examples, and documentation.`,
    path: `/react/tags/${tag}`,
    keywords: `${title}, react components, nayan ui, component tag, ui library`
  });
}

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const title = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const schemas = [
    buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'React', url: `${SITE_URL}/react/components` },
      { name: 'Tags', url: `${SITE_URL}/react/tags` },
      { name: title, url: `${SITE_URL}/react/tags/${tag}` }
    ])
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <TagDetails tag={tag} />
    </>
  );
}
