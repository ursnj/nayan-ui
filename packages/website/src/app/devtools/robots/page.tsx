import RobotsPage from '@/devtools/RobotsPage';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Robots.txt Generator',
  description: 'Create and validate robots.txt files for search engine crawling control. Free online robots.txt generator tool by Nayan UI.',
  path: '/devtools/robots',
  keywords: 'robots.txt generator, search engine crawling, seo tools, robots txt validator, nayan ui devtools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/devtools` },
    { name: 'Robots.txt Generator', url: `${SITE_URL}/devtools/robots` }
  ]),
  buildTechArticleSchema({
    title: 'Robots.txt Generator',
    description: 'Create and validate robots.txt files for search engine crawling control.',
    url: `${SITE_URL}/devtools/robots`
  })
];

export default function RobotsRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RobotsPage />
    </>
  );
}
