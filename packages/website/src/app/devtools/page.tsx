import Devtools from '@/devtools/Devtools';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Developer Tools',
  description:
    'Nayan UI developer tools, CLI utilities, and AI-powered code analysis. Generate sitemaps, robots.txt files, review PRs with AI, and scan for vulnerabilities.',
  path: '/devtools',
  keywords: 'nayan ui devtools, sitemap generator, robots.txt generator, seo tools, ai code review, vulnerability scanner, nayan ai'
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
