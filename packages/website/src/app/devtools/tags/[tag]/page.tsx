import type { Metadata } from 'next';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import TagDetails from '@/tags/TagsDetails';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const title = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return buildPageMetadata({
    title: `${title} - Developer Tools Tag`,
    description: `Browse Nayan UI developer tools tagged with "${title}". Find related tools, documentation, and CLI utilities.`,
    path: `/devtools/tags/${tag}`,
    keywords: `${title}, devtools, nayan ui, developer tools, cli utilities`
  });
}

export default async function DevtoolsTagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const title = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const schemas = [
    buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Developer Tools', url: `${SITE_URL}/devtools` },
      { name: 'Tags', url: `${SITE_URL}/devtools/tags` },
      { name: title, url: `${SITE_URL}/devtools/tags/${tag}` }
    ])
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <TagDetails tag={tag} />
    </>
  );
}
