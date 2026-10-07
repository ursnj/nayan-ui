import JsonMinifierPage from "@/components/tools/json-tools/JsonMinifierPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Minifier",
  description:
    "Minify JSON by removing whitespace and reducing file size. Free online JSON minifier by Nayan UI.",
  path: "/tools/json-minifier",
  keywords:
    "json minifier, json minify, minify json online, json compressor, compress json, json compact, json uglifier, remove whitespace json, json size reducer, json shrink, small json, free json minifier, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Minifier", url: `${SITE_URL}/tools/json-minifier` },
  ]),
  buildTechArticleSchema({
    title: "JSON Minifier",
    description: "Minify JSON by removing whitespace and reducing file size.",
    url: `${SITE_URL}/tools/json-minifier`,
    keywords: "json minifier, json minify, compress json, json compact, json uglifier",
  }),
];

export default function JsonMinifierRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonMinifierPage />
    </>
  );
}
