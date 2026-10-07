import TextComparePage from "@/components/tools/text-tools/TextComparePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Text Compare",
  description:
    "Compare two texts side by side and find differences. Free online text diff and comparison tool by Nayan UI.",
  path: "/tools/text-compare",
  keywords:
    "text compare, text diff, compare text online, diff checker, text comparison tool, side by side diff, line by line diff, code diff, online diff tool, free text compare, find differences in text, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Text Compare", url: `${SITE_URL}/tools/text-compare` },
  ]),
  buildTechArticleSchema({
    title: "Text Compare",
    description: "Compare two texts side by side and find differences.",
    url: `${SITE_URL}/tools/text-compare`,
    keywords: "text compare, text diff, diff checker, side by side diff, code diff",
  }),
];

export default function TextCompareRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <TextComparePage />
    </>
  );
}
