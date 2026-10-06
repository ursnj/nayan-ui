import JsonToXmlPage from "@/components/tools/json-tools/JsonToXmlPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON to XML",
  description:
    "Convert JSON to XML format with custom root tags. Free online JSON to XML converter by Nayan UI.",
  path: "/tools/json-to-xml",
  keywords:
    "json to xml, convert json to xml, json to xml online, json xml converter, json to xml format, json to xml transform, data format converter, json xml translator, api response to xml, free json to xml, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON to XML", url: `${SITE_URL}/tools/json-to-xml` },
  ]),
  buildTechArticleSchema({
    title: "JSON to XML",
    description: "Convert JSON to XML format with custom root tags.",
    url: `${SITE_URL}/tools/json-to-xml`,
    keywords: "json to xml, convert json to xml, json xml converter, json to xml format",
  }),
];

export default function JsonToXmlRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonToXmlPage />
    </>
  );
}
