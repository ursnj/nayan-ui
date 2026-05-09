import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import Tags from '@/tags/Tags';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Component Tags',
  description: 'Browse Nayan UI React components by tags and categories. Find components organized by functionality and use cases.',
  path: '/react/tags',
  keywords: 'react component tags, nayan ui categories, component search, ui component filter'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React', url: `${SITE_URL}/react/components` },
    { name: 'Tags', url: `${SITE_URL}/react/tags` }
  ])
];

export default function ReactTagsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tags />
    </>
  );
}
