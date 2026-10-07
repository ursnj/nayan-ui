import JsonFormatterPage from "@/components/tools/json-tools/JsonFormatterPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Formatter",
  description:
    "Format and beautify JSON with customizable indentation. Free online JSON formatter and beautifier by Nayan UI.",
  path: "/tools/json-formatter",
  keywords:
    "json formatter, json beautifier, json pretty print, format json online, json viewer, json prettifier, json indenter, json editor, pretty json, json formatting tool, free json formatter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Formatter", url: `${SITE_URL}/tools/json-formatter` },
  ]),
  buildTechArticleSchema({
    title: "JSON Formatter",
    description: "Format and beautify JSON with customizable indentation.",
    url: `${SITE_URL}/tools/json-formatter`,
    keywords: "json formatter, json beautifier, json pretty print, format json, json viewer",
  }),
];

export default function JsonFormatterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonFormatterPage />
    </>
  );
}
