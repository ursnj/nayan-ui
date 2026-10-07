import FindAndReplacePage from "@/components/tools/text-tools/FindAndReplacePage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Find & Replace",
  description: "Search and replace text with regex support. Free online find and replace tool by Nayan UI.",
  path: "/tools/find-and-replace",
  keywords: "find and replace, text search replace, online find replace, regex find replace, bulk text replace, text replacement tool, free find replace, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Find & Replace", url: `${SITE_URL}/tools/find-and-replace` },
  ]),
  buildTechArticleSchema({
    title: "Find & Replace",
    description: "Search and replace text with regex support.",
    url: `${SITE_URL}/tools/find-and-replace`,
    keywords: "find and replace, text search, regex replace, bulk replace",
  }),
];

export default function FindAndReplaceRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <FindAndReplacePage />
    </>
  );
}
