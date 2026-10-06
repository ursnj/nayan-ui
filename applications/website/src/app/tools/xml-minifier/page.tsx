import XmlMinifierPage from "@/components/tools/xml-tools/XmlMinifierPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML Minifier",
  description:
    "Minify XML by removing whitespace and reducing file size. Free online XML minifier by Nayan UI.",
  path: "/tools/xml-minifier",
  keywords:
    "xml minifier, xml minify, minify xml online, xml compressor, compress xml, xml compact, xml whitespace remover, free xml minifier, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML Minifier", url: `${SITE_URL}/tools/xml-minifier` },
  ]),
  buildTechArticleSchema({
    title: "XML Minifier",
    description: "Minify XML by removing whitespace and reducing file size.",
    url: `${SITE_URL}/tools/xml-minifier`,
    keywords: "xml minifier, xml minify, compress xml, xml compressor, xml compact",
  }),
];

export default function XmlMinifierRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlMinifierPage />
    </>
  );
}
