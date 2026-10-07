import AICodeScannerPage from "@/components/tools/ai-tools/AICodeScannerPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "AI Code Scanner",
  description:
    "AI-powered vulnerability scanning for GitHub repositories. Supports npm, Python, Go, Rust, Ruby, PHP, Java, .NET, and Scala with auto-fix PR creation.",
  path: "/tools/ai-code-scanner",
  keywords:
    "vulnerability scanner, security scanning, nayan ai, codex, claude code, npm audit, auto fix, dependency scanning, github security, code vulnerability, sast, dependency checker, supply chain security, open source security, ai vulnerability detection, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "AI Code Scanner", url: `${SITE_URL}/tools/ai-code-scanner` },
  ]),
  buildTechArticleSchema({
    title: "AI Code Scanner",
    description:
      "AI-powered vulnerability scanning for GitHub repositories with auto-fix capabilities.",
    url: `${SITE_URL}/tools/ai-code-scanner`,
    keywords: "vulnerability scanner, security scanning, dependency scanning, ai code scanner, auto fix",
  }),
];

export default function AICodeScannerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <AICodeScannerPage />
    </>
  );
}
