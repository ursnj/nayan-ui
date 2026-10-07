import AICodeReviewerPage from "@/components/tools/ai-tools/AICodeReviewerPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "AI Code Reviewer",
  description:
    "AI-powered GitHub Pull Request review using Codex & Claude Code. Deep code analysis for bugs, security issues, performance, and test coverage.",
  path: "/tools/ai-code-reviewer",
  keywords:
    "ai code review, pull request review, codex, claude code, nayan ai, automated review, code analysis, bug detection, github pr review, automated code review, security analysis, code quality, performance review, test coverage analysis, ai pair programming, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "AI Code Reviewer", url: `${SITE_URL}/tools/ai-code-reviewer` },
  ]),
  buildTechArticleSchema({
    title: "AI Code Reviewer",
    description: "AI-powered GitHub Pull Request review using Codex & Claude Code.",
    url: `${SITE_URL}/tools/ai-code-reviewer`,
    keywords: "ai code review, pull request review, codex, claude code, automated code analysis",
  }),
];

export default function AICodeReviewerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <AICodeReviewerPage />
    </>
  );
}
