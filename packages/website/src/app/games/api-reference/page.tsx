import ApiReference from '@/games/ApiReference';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Games API Reference',
  description: 'Complete API documentation for @nayan-ui/games. All exported constants, types, and configuration options.',
  path: '/games/api-reference',
  keywords: 'react native games api, game api reference, react native games documentation'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Games', url: `${SITE_URL}/games` },
    { name: 'API Reference', url: `${SITE_URL}/games/api-reference` }
  ]),
  buildTechArticleSchema({
    title: 'Games API Reference',
    description: 'Complete API documentation for @nayan-ui/games.',
    url: `${SITE_URL}/games/api-reference`
  })
];

export default function ApiReferencePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ApiReference />
    </>
  );
}
