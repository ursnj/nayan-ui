import JsonToTypescriptPage from "@/components/tools/json-tools/JsonToTypescriptPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON to TypeScript",
  description:
    "Generate TypeScript interfaces from JSON automatically, with nested object and array-of-object support. Free online JSON to TypeScript converter by Nayan UI.",
  path: "/tools/json-to-typescript",
  keywords:
    "json to typescript, json to ts, generate typescript interface, json to interface, typescript type generator, convert json to typescript online, free json to typescript, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON to TypeScript", url: `${SITE_URL}/tools/json-to-typescript` },
  ]),
  buildTechArticleSchema({
    title: "JSON to TypeScript",
    description: "Generate TypeScript interfaces from JSON automatically.",
    url: `${SITE_URL}/tools/json-to-typescript`,
    keywords: "json to typescript, json to ts, generate typescript interface, json to interface",
  }),
];

export default function JsonToTypescriptRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonToTypescriptPage />
    </>
  );
}
