import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';
import Tags from '@/tags/Tags';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Native Component Tags',
  description: 'Browse Nayan UI React Native components by tags and categories. Find mobile components organized by functionality and use cases.',
  path: '/react-native/tags',
  keywords: 'react native component tags, nayan ui categories, mobile component search, ui component filter'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React Native', url: `${SITE_URL}/react-native/components` },
    { name: 'Tags', url: `${SITE_URL}/react-native/tags` }
  ])
];

export default function RNTagsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tags />
    </>
  );
}
