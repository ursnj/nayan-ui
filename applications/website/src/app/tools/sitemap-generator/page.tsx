import SitemapPage from "@/components/tools/seo-tools/SitemapPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Sitemap Generator",
  description:
    "Create XML sitemaps with URLs, change frequency, and priority settings. Free online sitemap generator tool by Nayan UI.",
  path: "/tools/sitemap-generator",
  keywords:
    "sitemap generator, xml sitemap, seo optimization, generate sitemap, sitemap.xml generator, website sitemap, seo sitemap, sitemap creator, sitemap builder, xml sitemap generator, free sitemap tool, google sitemap, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Sitemap Generator", url: `${SITE_URL}/tools/sitemap-generator` },
  ]),
  buildTechArticleSchema({
    title: "Sitemap Generator",
    description: "Create XML sitemaps with URLs, change frequency, and priority settings.",
    url: `${SITE_URL}/tools/sitemap-generator`,
    keywords: "sitemap generator, xml sitemap, seo optimization, sitemap.xml, sitemap creator",
  }),
];

export default function SitemapRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SitemapPage />
    </>
  );
}
