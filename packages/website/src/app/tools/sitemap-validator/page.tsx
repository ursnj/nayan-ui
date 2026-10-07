import SitemapValidatorPage from "@/components/tools/seo-tools/SitemapValidatorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Sitemap Validator",
  description:
    "Validate XML sitemaps for correct structure, URLs, and SEO compliance. Free online sitemap validator tool by Nayan UI.",
  path: "/tools/sitemap-validator",
  keywords:
    "sitemap validator, xml sitemap validator, validate sitemap, sitemap checker, sitemap tester, sitemap verification, xml validation, seo sitemap check, sitemap analysis, free sitemap validator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Sitemap Validator", url: `${SITE_URL}/tools/sitemap-validator` },
  ]),
  buildTechArticleSchema({
    title: "Sitemap Validator",
    description: "Validate XML sitemaps for correct structure, URLs, and SEO compliance.",
    url: `${SITE_URL}/tools/sitemap-validator`,
    keywords: "sitemap validator, xml sitemap validator, validate sitemap, sitemap checker",
  }),
];

export default function SitemapValidatorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SitemapValidatorPage />
    </>
  );
}
