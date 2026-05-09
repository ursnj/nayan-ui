import SitemapPage from '@/devtools/SitemapPage';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Sitemap Generator',
  description: 'Generate and validate XML sitemaps for better SEO optimization. Free online sitemap generator tool by Nayan UI.',
  path: '/devtools/sitemap',
  keywords: 'sitemap generator, xml sitemap, seo optimization, sitemap validator, nayan ui devtools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/devtools` },
    { name: 'Sitemap Generator', url: `${SITE_URL}/devtools/sitemap` }
  ]),
  buildTechArticleSchema({
    title: 'Sitemap Generator',
    description: 'Generate and validate XML sitemaps for better SEO optimization.',
    url: `${SITE_URL}/devtools/sitemap`
  })
];

export default function SitemapRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SitemapPage />
    </>
  );
}
