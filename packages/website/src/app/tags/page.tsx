import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import Tags from '@/tags/Tags';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Tags - Browse Components by Category',
  description:
    'Browse Nayan UI components by tags and categories. Find React and React Native components organized by functionality, design patterns, and use cases.',
  path: '/tags',
  keywords: 'nayan ui tags, component categories, react component tags, ui component search, component filter'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tags', url: `${SITE_URL}/tags` }
  ])
];

export default function TagsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tags />
    </>
  );
}
