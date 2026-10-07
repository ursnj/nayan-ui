import JsonFlattenUnflattenPage from "@/components/tools/json-tools/JsonFlattenUnflattenPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Flatten/Unflatten",
  description:
    "Flatten nested JSON into dot-notation keys, or unflatten dot-path keys back into nested objects and arrays. Free online tool by Nayan UI.",
  path: "/tools/json-flatten-unflatten",
  keywords:
    "json flatten, json unflatten, flatten json object, unflatten json, dot notation json, nested json to flat, flat json to nested, free json flattener, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Flatten/Unflatten", url: `${SITE_URL}/tools/json-flatten-unflatten` },
  ]),
  buildTechArticleSchema({
    title: "JSON Flatten/Unflatten",
    description: "Flatten nested JSON into dot-notation keys, or unflatten it back into nested objects.",
    url: `${SITE_URL}/tools/json-flatten-unflatten`,
    keywords: "json flatten, json unflatten, flatten json object, dot notation json",
  }),
];

export default function JsonFlattenUnflattenRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonFlattenUnflattenPage />
    </>
  );
}
