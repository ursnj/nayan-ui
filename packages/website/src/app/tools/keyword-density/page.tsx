import KeywordDensityPage from "@/components/tools/seo-tools/KeywordDensityPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Keyword Density Analyzer",
  description:
    "Analyze keyword frequency and density in your content for SEO optimization. Free online keyword density checker by Nayan UI.",
  path: "/tools/keyword-density",
  keywords:
    "keyword density, keyword analyzer, keyword density checker, seo keyword analysis, content analysis, keyword frequency, keyword counter, content optimization, seo content tool, keyword research, free keyword tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Keyword Density Analyzer", url: `${SITE_URL}/tools/keyword-density` },
  ]),
  buildTechArticleSchema({
    title: "Keyword Density Analyzer",
    description: "Analyze keyword frequency and density in your content for SEO optimization.",
    url: `${SITE_URL}/tools/keyword-density`,
    keywords: "keyword density, keyword analyzer, seo keyword analysis, content optimization",
  }),
];

export default function KeywordDensityRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <KeywordDensityPage />
    </>
  );
}
