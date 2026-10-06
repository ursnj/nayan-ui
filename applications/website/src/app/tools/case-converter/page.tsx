import CaseConverterPage from "@/components/tools/text-tools/CaseConverterPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Case Converter",
  description:
    "Convert text between uppercase, lowercase, title case, camelCase, snake_case, and more. Free online case converter by Nayan UI.",
  path: "/tools/case-converter",
  keywords:
    "case converter, text case converter, uppercase converter, lowercase converter, title case converter, camelCase converter, snake_case converter, kebab-case, sentence case, alternating case, text transformation, change text case online, free case converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Case Converter", url: `${SITE_URL}/tools/case-converter` },
  ]),
  buildTechArticleSchema({
    title: "Case Converter",
    description: "Convert text between uppercase, lowercase, title case, camelCase, snake_case, and more.",
    url: `${SITE_URL}/tools/case-converter`,
    keywords: "case converter, uppercase, lowercase, title case, camelCase, snake_case, kebab-case",
  }),
];

export default function CaseConverterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CaseConverterPage />
    </>
  );
}
