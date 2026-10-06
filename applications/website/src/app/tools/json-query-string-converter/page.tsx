import JsonQueryStringConverterPage from "@/components/tools/json-tools/JsonQueryStringConverterPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON ⇄ Query String",
  description:
    "Convert a JSON object into a URL query string, or parse a query string back into JSON, with correct percent-encoding and array support. Free tool by Nayan UI.",
  path: "/tools/json-query-string-converter",
  keywords:
    "json to query string, query string to json, url query string converter, json url params, parse query string, build query string, free online tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON ⇄ Query String", url: `${SITE_URL}/tools/json-query-string-converter` },
  ]),
  buildTechArticleSchema({
    title: "JSON ⇄ Query String",
    description: "Convert a JSON object into a URL query string, or parse a query string back into JSON.",
    url: `${SITE_URL}/tools/json-query-string-converter`,
    keywords: "json to query string, query string to json, url query string converter",
  }),
];

export default function JsonQueryStringConverterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonQueryStringConverterPage />
    </>
  );
}
