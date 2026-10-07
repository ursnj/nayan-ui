import JsonPathFinderPage from "@/components/tools/json-tools/JsonPathFinderPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Path Finder",
  description: "Query and explore JSON data with path expressions. Free online JSON Path tool by Nayan UI.",
  path: "/tools/json-path-finder",
  keywords: "json path finder, jsonpath tool, json query, json path tester, json explorer, online jsonpath, free json path finder, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Path Finder", url: `${SITE_URL}/tools/json-path-finder` },
  ]),
  buildTechArticleSchema({
    title: "JSON Path Finder",
    description: "Query and explore JSON data with path expressions.",
    url: `${SITE_URL}/tools/json-path-finder`,
    keywords: "json path finder, jsonpath, json query, json explorer",
  }),
];

export default function JsonPathFinderRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonPathFinderPage />
    </>
  );
}
