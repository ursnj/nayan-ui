import RobotsValidatorPage from "@/components/tools/seo-tools/RobotsValidatorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Robots.txt Validator",
  description:
    "Validate robots.txt files for correct syntax, directives, and crawler permissions. Free online robots.txt validator tool by Nayan UI.",
  path: "/tools/robots-validator",
  keywords:
    "robots.txt validator, validate robots.txt, robots.txt checker, robots.txt tester, robots.txt verification, crawler permissions, web indexing control, robots protocol, seo tools, free robots.txt validator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Robots.txt Validator", url: `${SITE_URL}/tools/robots-validator` },
  ]),
  buildTechArticleSchema({
    title: "Robots.txt Validator",
    description: "Validate robots.txt files for correct syntax, directives, and crawler permissions.",
    url: `${SITE_URL}/tools/robots-validator`,
    keywords: "robots.txt validator, validate robots.txt, robots.txt checker, crawler permissions",
  }),
];

export default function RobotsValidatorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RobotsValidatorPage />
    </>
  );
}
