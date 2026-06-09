import AICodeScannerPage from '@/devtools/AICodeScannerPage';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'AI Code Scanner',
  description:
    'AI-powered vulnerability scanning for GitHub repositories. Supports npm, Python, Go, Rust, Ruby, PHP, Java, .NET, and Scala with auto-fix PR creation.',
  path: '/devtools/ai-code-scanner',
  keywords: 'vulnerability scanner, security scanning, nayan ai, codex, claude code, npm audit, auto fix, dependency scanning'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/devtools` },
    { name: 'AI Code Scanner', url: `${SITE_URL}/devtools/ai-code-scanner` }
  ]),
  buildTechArticleSchema({
    title: 'AI Code Scanner',
    description: 'AI-powered vulnerability scanning for GitHub repositories with auto-fix capabilities.',
    url: `${SITE_URL}/devtools/ai-code-scanner`
  })
];

export default function AICodeScannerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <AICodeScannerPage />
    </>
  );
}
