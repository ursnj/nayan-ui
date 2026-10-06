import JsonDiffPage from "@/components/tools/json-tools/JsonDiffPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Diff",
  description: "Compare two JSON objects and find differences. Free online JSON diff tool by Nayan UI.",
  path: "/tools/json-diff",
  keywords: "json diff, json compare, compare json, json difference, json diff tool, online json diff, free json diff, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Diff", url: `${SITE_URL}/tools/json-diff` },
  ]),
  buildTechArticleSchema({
    title: "JSON Diff",
    description: "Compare two JSON objects and find differences.",
    url: `${SITE_URL}/tools/json-diff`,
    keywords: "json diff, json compare, compare json, json difference",
  }),
];

export default function JsonDiffRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonDiffPage />
    </>
  );
}
