import YamlToXmlPage from "@/components/tools/xml-tools/YamlToXmlPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "YAML to XML",
  description:
    "Convert YAML configuration files to well-formed XML, including nested mappings and lists. Free online YAML to XML converter by Nayan UI.",
  path: "/tools/yaml-to-xml",
  keywords:
    "yaml to xml, convert yaml to xml, yaml to xml online, yaml xml converter, yaml to xml converter free, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "YAML to XML", url: `${SITE_URL}/tools/yaml-to-xml` },
  ]),
  buildTechArticleSchema({
    title: "YAML to XML",
    description: "Convert YAML configuration files to well-formed XML.",
    url: `${SITE_URL}/tools/yaml-to-xml`,
    keywords: "yaml to xml, convert yaml to xml, yaml xml converter",
  }),
];

export default function YamlToXmlRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <YamlToXmlPage />
    </>
  );
}
