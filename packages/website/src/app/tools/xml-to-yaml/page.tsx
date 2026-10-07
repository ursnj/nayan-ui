import XmlToYamlPage from "@/components/tools/xml-tools/XmlToYamlPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML to YAML",
  description:
    "Convert XML to YAML format for configuration files. Free online XML to YAML converter by Nayan UI.",
  path: "/tools/xml-to-yaml",
  keywords:
    "xml to yaml, convert xml to yaml, xml to yaml online, xml yaml converter, xml to yml, xml config to yaml, free xml to yaml, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML to YAML", url: `${SITE_URL}/tools/xml-to-yaml` },
  ]),
  buildTechArticleSchema({
    title: "XML to YAML",
    description: "Convert XML to YAML format for configuration files.",
    url: `${SITE_URL}/tools/xml-to-yaml`,
    keywords: "xml to yaml, convert xml to yaml, xml yaml converter, xml to yml",
  }),
];

export default function XmlToYamlRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlToYamlPage />
    </>
  );
}
