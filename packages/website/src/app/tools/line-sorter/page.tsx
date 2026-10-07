import LineSorterPage from "@/components/tools/text-tools/LineSorterPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Line Sorter",
  description: "Sort, deduplicate, and clean up lines of text. Free online line sorter by Nayan UI.",
  path: "/tools/line-sorter",
  keywords: "line sorter, sort lines online, text line sorter, alphabetical sorter, remove duplicate lines, line sorting tool, free line sorter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Line Sorter", url: `${SITE_URL}/tools/line-sorter` },
  ]),
  buildTechArticleSchema({
    title: "Line Sorter",
    description: "Sort, deduplicate, and clean up lines of text.",
    url: `${SITE_URL}/tools/line-sorter`,
    keywords: "line sorter, sort lines, alphabetical sort, remove duplicates",
  }),
];

export default function LineSorterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <LineSorterPage />
    </>
  );
}
