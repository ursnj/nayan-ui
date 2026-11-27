import FaviconGeneratorPage from '@/components/tools/image-tools/FaviconGeneratorPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Favicon Generator',
  description: 'Learn how to choose favicon formats, export sizes, and declare icon assets.',
  path: '/tools/favicon-generator',
  keywords:
    'favicon generator, favicon maker, generate favicon, apple touch icon generator, site.webmanifest generator, favicon.ico generator, free favicon generator, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Favicon Generator', url: `${SITE_URL}/tools/favicon-generator` }
  ]),
  buildTechArticleSchema({
    title: 'Favicon Generator',
    description: 'Learn how to choose favicon formats, export sizes, and declare icon assets.',
    url: `${SITE_URL}/tools/favicon-generator`,
    keywords: 'favicon generator, favicon maker, apple touch icon, webmanifest'
  })
];

export default function FaviconGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <FaviconGeneratorPage />
    </>
  );
}
