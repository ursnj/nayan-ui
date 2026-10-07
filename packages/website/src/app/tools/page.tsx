import Devtools from "@/components/tools/Devtools";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Developer Tools",
  description:
    "Nayan UI developer tools, CLI utilities, and AI-powered code analysis. Generate sitemaps, robots.txt files, review PRs with AI, and scan for vulnerabilities.",
  path: "/tools",
  keywords:
    "free online developer tools, pdf tools, image tools, json tools, text tools, sitemap generator, robots.txt generator, seo tools, ai code review, vulnerability scanner, merge pdf, compress image, json formatter, text compare, word counter, nayan ui",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
  ]),
];

export default function DevtoolsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Devtools />
    </>
  );
}
