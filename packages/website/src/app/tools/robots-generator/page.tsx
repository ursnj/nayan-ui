import RobotsPage from "@/components/tools/seo-tools/RobotsPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Robots.txt Generator",
  description:
    "Build robots.txt files with user-agent rules, allow/disallow paths, and sitemap directives. Free online robots.txt generator tool by Nayan UI.",
  path: "/tools/robots-generator",
  keywords:
    "robots.txt generator, search engine crawling, seo tools, robots.txt creator, robots.txt builder, crawl control, search engine optimization, block crawlers, allow crawlers, googlebot rules, free robots.txt tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Robots.txt Generator", url: `${SITE_URL}/tools/robots-generator` },
  ]),
  buildTechArticleSchema({
    title: "Robots.txt Generator",
    description: "Build robots.txt files with user-agent rules, allow/disallow paths, and sitemap directives.",
    url: `${SITE_URL}/tools/robots-generator`,
    keywords: "robots.txt generator, search engine crawling, seo tools, robots.txt creator",
  }),
];

export default function RobotsRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RobotsPage />
    </>
  );
}
