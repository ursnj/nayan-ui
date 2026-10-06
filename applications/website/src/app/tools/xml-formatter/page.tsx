import XmlFormatterPage from "@/components/tools/xml-tools/XmlFormatterPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML Formatter",
  description:
    "Format and beautify XML with customizable indentation. Free online XML formatter and beautifier by Nayan UI.",
  path: "/tools/xml-formatter",
  keywords:
    "xml formatter, xml beautifier, xml pretty print, format xml online, xml viewer, xml prettifier, xml indenter, xml editor, pretty xml, xml formatting tool, free xml formatter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML Formatter", url: `${SITE_URL}/tools/xml-formatter` },
  ]),
  buildTechArticleSchema({
    title: "XML Formatter",
    description: "Format and beautify XML with customizable indentation.",
    url: `${SITE_URL}/tools/xml-formatter`,
    keywords: "xml formatter, xml beautifier, xml pretty print, format xml, xml viewer",
  }),
];

export default function XmlFormatterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlFormatterPage />
    </>
  );
}
