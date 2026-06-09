import AICodeReviewerPage from '@/devtools/AICodeReviewerPage';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'AI Code Reviewer',
  description:
    'AI-powered GitHub Pull Request review using Codex & Claude Code. Deep code analysis for bugs, security issues, performance, and test coverage.',
  path: '/devtools/ai-code-reviewer',
  keywords: 'ai code review, pull request review, codex, claude code, nayan ai, automated review, code analysis, bug detection'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/devtools` },
    { name: 'AI Code Reviewer', url: `${SITE_URL}/devtools/ai-code-reviewer` }
  ]),
  buildTechArticleSchema({
    title: 'AI Code Reviewer',
    description: 'AI-powered GitHub Pull Request review using Codex & Claude Code.',
    url: `${SITE_URL}/devtools/ai-code-reviewer`
  })
];

export default function AICodeReviewerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <AICodeReviewerPage />
    </>
  );
}
