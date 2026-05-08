import type { Metadata } from 'next';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import TagDetails from '@/tags/TagsDetails';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const title = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return buildPageMetadata({
    title: `${title} - React Native Component Tag`,
    description: `Browse Nayan UI React Native components tagged with "${title}". Find related mobile components, examples, and documentation.`,
    path: `/react-native/tags/${tag}`,
    keywords: `${title}, react native components, nayan ui, component tag, mobile ui`
  });
}

export default async function RNTagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const title = tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const schemas = [
    buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'React Native', url: `${SITE_URL}/react-native/components` },
      { name: 'Tags', url: `${SITE_URL}/react-native/tags` },
      { name: title, url: `${SITE_URL}/react-native/tags/${tag}` }
    ])
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <TagDetails tag={tag} />
    </>
  );
}
