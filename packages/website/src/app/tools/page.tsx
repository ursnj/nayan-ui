import Devtools from '@/components/tools/Devtools';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Developer Tools',
  description:
    'Guides for working with PDFs, images, structured data, text, and SEO, plus documentation for the Nayan UI and AI command-line packages.',
  path: '/tools',
  keywords:
    'developer tools documentation, pdf tools, image tools, json tools, text tools, sitemap generator, robots.txt generator, seo tools, ai code review, vulnerability scanner, merge pdf, compress image, json formatter, text compare, word counter, nayan ui'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` }
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
