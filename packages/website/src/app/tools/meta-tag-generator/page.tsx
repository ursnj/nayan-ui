import MetaTagGeneratorPage from "@/components/tools/seo-tools/MetaTagGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Meta Tag Generator",
  description:
    "Generate HTML meta tags, Open Graph, and Twitter Card tags for SEO optimization. Free online meta tag generator by Nayan UI.",
  path: "/tools/meta-tag-generator",
  keywords:
    "meta tag generator, html meta tags, open graph tags, twitter card tags, seo meta tags, meta description generator, og tags generator, social media meta, canonical url, free meta tag tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Meta Tag Generator", url: `${SITE_URL}/tools/meta-tag-generator` },
  ]),
  buildTechArticleSchema({
    title: "Meta Tag Generator",
    description: "Generate HTML meta tags, Open Graph, and Twitter Card tags for SEO optimization.",
    url: `${SITE_URL}/tools/meta-tag-generator`,
    keywords: "meta tag generator, html meta tags, open graph, twitter card, seo",
  }),
];

export default function MetaTagGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <MetaTagGeneratorPage />
    </>
  );
}
