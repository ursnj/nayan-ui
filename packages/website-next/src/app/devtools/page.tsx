import Devtools from '@/devtools/Devtools';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Developer Tools',
  description: 'Nayan UI developer tools and CLI utilities. Generate sitemaps, robots.txt files, and more for web development and SEO optimization.',
  path: '/devtools',
  keywords: 'nayan ui devtools, sitemap generator, robots.txt generator, seo tools, web development utilities'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/devtools` }
  ])
];

export default function DevtoolsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Devtools />
    </>
  );
}
