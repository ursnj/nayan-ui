import HtmlMinifierPage from "@/components/tools/dev-tools/HtmlMinifierPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "HTML Minifier",
  description: "Minify HTML by removing whitespace and comments. Free online HTML minifier by Nayan UI.",
  path: "/tools/html-minifier",
  keywords: "html minifier, html compressor, minify html, online html minifier, html optimizer, html reducer, free html minifier, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "HTML Minifier", url: `${SITE_URL}/tools/html-minifier` },
  ]),
  buildTechArticleSchema({
    title: "HTML Minifier",
    description: "Minify HTML by removing whitespace and comments.",
    url: `${SITE_URL}/tools/html-minifier`,
    keywords: "html minifier, html compressor, minify html, html optimizer",
  }),
];

export default function HtmlMinifierRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <HtmlMinifierPage />
    </>
  );
}
