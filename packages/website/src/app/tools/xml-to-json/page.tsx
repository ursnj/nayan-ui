import XmlToJsonPage from "@/components/tools/xml-tools/XmlToJsonPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML to JSON",
  description:
    "Convert XML to JSON format for modern APIs and applications. Free online XML to JSON converter by Nayan UI.",
  path: "/tools/xml-to-json",
  keywords:
    "xml to json, convert xml to json, xml to json online, xml json converter, xml to json converter, parse xml to json, soap to json, free xml to json, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML to JSON", url: `${SITE_URL}/tools/xml-to-json` },
  ]),
  buildTechArticleSchema({
    title: "XML to JSON",
    description: "Convert XML to JSON format for modern APIs and applications.",
    url: `${SITE_URL}/tools/xml-to-json`,
    keywords: "xml to json, convert xml to json, xml json converter, parse xml to json",
  }),
];

export default function XmlToJsonRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlToJsonPage />
    </>
  );
}
