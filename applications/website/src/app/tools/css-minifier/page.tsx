import CssMinifierPage from "@/components/tools/dev-tools/CssMinifierPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "CSS Minifier",
  description: "Minify CSS by removing whitespace and comments. Free online CSS minifier by Nayan UI.",
  path: "/tools/css-minifier",
  keywords: "css minifier, css compressor, minify css, online css minifier, css optimizer, css reducer, free css minifier, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "CSS Minifier", url: `${SITE_URL}/tools/css-minifier` },
  ]),
  buildTechArticleSchema({
    title: "CSS Minifier",
    description: "Minify CSS by removing whitespace and comments.",
    url: `${SITE_URL}/tools/css-minifier`,
    keywords: "css minifier, css compressor, minify css, css optimizer",
  }),
];

export default function CssMinifierRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CssMinifierPage />
    </>
  );
}
